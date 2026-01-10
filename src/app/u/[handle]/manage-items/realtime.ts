// Supabase Realtime for items
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

type Item = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  type: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Create ONE client (module singleton)
const supabase =
  supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

export function subscribeToItems({
  handle,
  onUpdate,
}: {
  handle: string;
  onUpdate: (item: Item) => void;
}): RealtimeChannel | null {
  // ✅ If env vars aren’t set, fail gracefully instead of exploding
  if (!supabase) {
    console.error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return null;
  }

  return supabase
    .channel(`items-changes:${handle}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "items",
        filter: `creator_handle=eq.${handle}`,
      },
      (payload) => {
        const newItem = payload.new as Partial<Item> | null;

        if (
          newItem &&
          typeof newItem.id === "string" &&
          typeof newItem.name === "string" &&
          typeof newItem.description === "string" &&
          (typeof newItem.price === "number" || typeof newItem.price === "string") &&
          typeof newItem.type === "string"
        ) {
          onUpdate(newItem as Item);
        }
      }
    )
    .subscribe();
}
