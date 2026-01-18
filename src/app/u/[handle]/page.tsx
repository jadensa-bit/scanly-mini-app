

// Full original code restored below
"use client";

import React, { useEffect, useState } from "react";
import type { StorefrontPreviewProps } from "../../../components/StorefrontPreview";
import dynamic from "next/dynamic";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	BadgeCheck,
	CalendarClock,
	ExternalLink,
	Gift,
	ShoppingBag,
	Sparkles,
	Instagram,
	Globe,
	Phone,
	MapPin,
	Copy,
	Share2,
	Star,
	Clock,
} from "lucide-react";

// ...existing code...

// Types
// ...existing code...

// Helpers
// ...existing code...


// Dynamically import the new StorefrontPreview component (no SSR)
const StorefrontPreview = dynamic(() => import("../../../components/StorefrontPreview"), { ssr: false });

export default function HandlePage() {
	const params = useParams();
	const sp = useSearchParams();
	const router = useRouter();

	const [cfg, setCfg] = useState<StorefrontPreviewProps | null>(null);
	const [loading, setLoading] = useState(true);
	const [err, setErr] = useState<string | null>(null);

	// Listen for live preview updates from the create page via BroadcastChannel
	useEffect(() => {
		const isPreview = sp?.get("preview") === "1";
		if (!isPreview) return;

		if (typeof BroadcastChannel === "undefined") return;

		const bc = new BroadcastChannel("piqo-preview");
		bc.onmessage = (e) => {
			if (e.data?.type === "config" && e.data?.config) {
				console.log("[Preview] Received live config update:", e.data.config);
				setCfg(e.data.config);
				setLoading(false);
				setErr(null);
			}
		};

		return () => bc.close();
	}, [sp]);

	useEffect(() => {
		let cancelled = false;
		let retries = 0;
		const maxRetries = 6; // ~3 seconds (6 x 500ms)
		async function fetchConfig() {
			setLoading(true);
			setErr(null);
			while (!cancelled && retries < maxRetries) {
				try {
					const handle = (params?.handle || "").toString();
					if (!handle) {
						setErr("Missing handle");
						setLoading(false);
						return;
					}
					const res = await fetch(`/api/site?handle=${encodeURIComponent(handle)}`);
					const data = await res.json();
					if (typeof window !== "undefined") {
						// Debug: log what we got from the API
						console.log("[Live Fetch] handle:", handle, "data:", data);
					}
					if (res.ok && data?.config) {
						setCfg(data.config);
						setLoading(false);
						return;
					}
				} catch (e) {
					// ignore and retry
				}
				retries++;
				await new Promise(r => setTimeout(r, 500));
			}
			setErr("Not found or not published yet.");
			setCfg(null);
			setLoading(false);
		}
		fetchConfig();
		return () => { cancelled = true; };
	}, [params]);

	if (loading) return <div style={{padding:40, textAlign:'center'}}>Loading your live creation...</div>;
	if (err) return <div style={{padding:40, textAlign:'center', color:'red'}}>Error: {err}</div>;
	if (!cfg) return <div style={{padding:40, textAlign:'center'}}>Not found or not published yet.</div>;

	// Use the full-featured StorefrontPreview for pixel-perfect rendering
	// Pass all config fields as props for full fidelity
	const handle = (params?.handle || "").toString();
	return (
		<StorefrontPreview
			handle={handle}
			mode={cfg.mode}
			brandName={cfg.brandName}
			tagline={cfg.tagline}
			businessDescription={cfg.businessDescription}
			items={cfg.items}
			appearance={cfg.appearance}
			staffProfiles={cfg.staffProfiles}
			ownerEmail={cfg.ownerEmail}
			brandLogo={cfg.brandLogo}
			social={cfg.social}
			availability={cfg.availability}
			notifications={cfg.notifications}
			payments={cfg.payments}
		/>
	);
}

// ...existing code...

