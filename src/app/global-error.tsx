"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body style={{ background: "#0a0910", color: "rgba(255,255,255,0.8)", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠</p>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 500, marginBottom: "0.5rem" }}>エラーが発生しました</h2>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem" }}>
            {error.message}
          </p>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "999px", background: "#534ab7", color: "white", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
