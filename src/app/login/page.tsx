export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 420, width: "100%", padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Login</h1>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>
          This is a placeholder login page. You can wire Supabase Auth here later.
        </p>

        <a
          href="/create"
          style={{
            display: "inline-block",
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            textDecoration: "none",
          }}
        >
          Continue to Create
        </a>
      </div>
    </main>
  );
}
