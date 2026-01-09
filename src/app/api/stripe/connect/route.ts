// src/app/api/stripe/connect/route.ts
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* --------------------
   env helpers
-------------------- */
function mustEnv(k: string) {
  const v = (process.env[k] ?? "").trim();
  if (!v) throw new Error(`${k} is missing`);
  return v;
}

const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");
const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

/* --------------------
   clients
-------------------- */
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-12-15.clover" });

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* --------------------
   utils
-------------------- */
function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function safeHandle(input: unknown) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 32);
}

function originFromReq(req: Request) {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

type SiteRow = {
  handle: string;
  config: any;
  owner_email: string | null;
  stripe_account_id: string | null;
};

async function ensureSiteRow(handle: string, ownerEmail?: string) {
  const baseConfig = {
    handle,
    brandName: "My Scanly",
    tagline: "Scan → tap → done.",
    mode: "services",
    items: [],
    active: true,
    createdAt: Date.now(),
  };

  // ✅ Upsert prevents duplicates if two requests happen at once
  const { data, error } = await supabase
    .from("sites")
    .upsert(
      {
        handle,
        config: baseConfig,
        // only set owner_email if provided
        ...(ownerEmail ? { owner_email: ownerEmail } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "handle" }
    )
    .select("handle, config, owner_email, stripe_account_id")
    .single();

  if (error) throw new Error(`Supabase error ensuring site row: ${error.message}`);

  // Safety: if config is missing, repair it
  if (!data?.config) {
    const { data: repaired, error: updErr } = await supabase
      .from("sites")
      .update({ config: { handle }, updated_at: new Date().toISOString() })
      .eq("handle", handle)
      .select("handle, config, owner_email, stripe_account_id")
      .single();

    if (updErr) throw new Error(`Failed repairing site config: ${updErr.message}`);
    return repaired as SiteRow;
  }

  return data as SiteRow;
}

async function verifyStripeAccount(accountId: string) {
  try {
    const acct = await stripe.accounts.retrieve(accountId);
    // if Stripe returns an object with an id, we consider it valid
    return !!(acct && typeof acct === "object" && "id" in acct && (acct as any).id);
  } catch {
    return false;
  }
}

/* --------------------
   handler
-------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const handle = safeHandle(body?.handle);
    const emailFromBody = String(body?.email ?? "").trim();
    if (!handle) return jsonError("Missing handle", 400);

    // 1) Ensure the site exists (and optionally store owner_email)
    const site = await ensureSiteRow(handle, emailFromBody || undefined);

    // prefer explicit email, otherwise owner_email, otherwise undefined
    const email = emailFromBody || String(site?.owner_email ?? "").trim() || undefined;

    // 2) Ensure Stripe connected account exists + is valid
    let accountId = (site?.stripe_account_id as string | null) || null;

    if (accountId) {
      const ok = await verifyStripeAccount(accountId);
      if (!ok) {
        // saved ID is stale/broken; recreate
        accountId = null;
      }
    }

    if (!accountId) {
      const acct = await stripe.accounts.create(
        {
          type: "express",
          email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { handle },
        },
        // ✅ prevents duplicates on retries
        { idempotencyKey: `scanly_acct_${handle}` }
      );

      accountId = acct.id;

      // write stripe_account_id into candidate site tables (be resilient to different schema names)
      const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];
      for (const tbl of TABLE_CANDIDATES) {
        try {
          const { error: updErr } = await supabase
            .from(tbl)
            .update({
              stripe_account_id: accountId,
              ...(emailFromBody ? { owner_email: emailFromBody } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq("handle", handle);

          if (updErr) {
            // if table/column missing, skip to next
            const msg = String(updErr.message || "").toLowerCase();
            if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("column")) continue;
            return jsonError("Failed saving stripe_account_id", 500, { detail: updErr.message });
          }
        } catch (e) {
          // ignore and continue to next candidate
        }
      }
    }

    // 3) Create onboarding link
    const origin = originFromReq(req);

    const refresh_url = `${origin}/connect/refresh?handle=${encodeURIComponent(handle)}`;
    const return_url = `${origin}/connect/return?handle=${encodeURIComponent(handle)}`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type: "account_onboarding",
    });

    return NextResponse.json({ ok: true, url: link.url, accountId });
  } catch (e: any) {
    console.error("stripe/connect route error:", e);
    return jsonError("Connect failed", 500, { detail: e?.message || String(e) });
  }
}
