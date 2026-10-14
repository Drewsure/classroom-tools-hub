"use client";

import { RefreshCw } from "lucide-react";

export function AppRecovery({ retry }: { retry: () => void }) {
  return (
    <main style={{ minHeight: "100vh", background: "#f0f9ff", color: "#0f172a", padding: 24, display: "grid", placeItems: "center" }}>
      <section style={{ maxWidth: 480, width: "100%" }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>Classroom Tools Hub could not load</h1>
        <p style={{ fontSize: 17, lineHeight: 1.5 }}>Try again, or reconnect and reload. Reloading does not clear saved class records.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button onClick={retry} style={{ padding: "12px 18px", background: "#047857", color: "white", border: 0, borderRadius: 8, fontSize: 17 }}>Try again</button>
          <button onClick={() => window.location.reload()} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", background: "white", color: "#0f172a", border: "1px solid #94a3b8", borderRadius: 8, fontSize: 17 }}>
            <RefreshCw size={20} /> Reload app
          </button>
        </div>
      </section>
    </main>
  );
}
