import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scanly’s",
  description: "Scanly’s — QR-first mini-app storefronts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {/* Ambient premium background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-black" />

          {/* soft “ink” vignette */}
          <div
            className="absolute inset-0 opacity-[0.55]"
            style={{
              background:
                "radial-gradient(900px 600px at 20% 10%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(800px 520px at 80% 90%, rgba(255,255,255,0.05), transparent 60%)",
            }}
          />

          {/* neon accents (subtle) */}
          <div
            className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(0,255,255,0.25), transparent 60%)",
            }}
          />
          <div
            className="absolute bottom-[-240px] right-[-120px] h-[520px] w-[520px] rounded-full blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgba(120,255,0,0.18), transparent 60%)",
            }}
          />
        </div>

        {children}
      </body>
    </html>
  );
}
