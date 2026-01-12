import React from "react";

// Accepts the same config as used in /u/[handle]/page.tsx and create/page.tsx
export default function PiqoLivePreview({ config }: { config: any }) {
  if (!config) return null;
  return (
    <main style={{ fontFamily: 'Inter, sans-serif', background: '#f9f9f9', minHeight: '100vh', padding: 0, margin: 0 }}>
      <div style={{ maxWidth: 480, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{config.brandName}</h1>
        <div style={{ fontSize: 18, color: '#666', marginBottom: 24 }}>{config.tagline}</div>
        {config.brandLogo && <img src={config.brandLogo} alt="Logo" style={{ maxWidth: 120, marginBottom: 24, borderRadius: 12 }} />}
        <div style={{ marginBottom: 24 }}>
          <strong>Items:</strong>
          <ul style={{ paddingLeft: 20 }}>
            {(config.items || []).map((item: any, i: number) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>{item.title}</span> — {item.price}
                {item.note && <span style={{ color: '#888', marginLeft: 8 }}>({item.note})</span>}
              </li>
            ))}
          </ul>
        </div>
        {config.social && (
          <div style={{ marginBottom: 24 }}>
            <strong>Socials:</strong>
            <ul style={{ paddingLeft: 20 }}>
              {config.social.instagram && <li>Instagram: {config.social.instagram}</li>}
              {config.social.tiktok && <li>TikTok: {config.social.tiktok}</li>}
              {config.social.website && <li>Website: {config.social.website}</li>}
              {config.social.phone && <li>Phone: {config.social.phone}</li>}
              {config.social.address && <li>Address: {config.social.address}</li>}
            </ul>
          </div>
        )}
        <div style={{ fontSize: 14, color: '#aaa', marginTop: 32 }}>
          <span>Live at: </span>
          <span style={{ fontWeight: 600 }}>{typeof window !== 'undefined' ? window.location.href : ''}</span>
        </div>
      </div>
    </main>
  );
}
