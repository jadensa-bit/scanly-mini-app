export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ maxWidth: 420, width: "100%", padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          Login
        </h1>
        <p style={{ opacity: 0.7, marginBottom: 16 }}>
          Placeholder login page.
        </p>
        <a href="/create">Go to Create</a>
      </div>
    </main>
  );
}
