"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";
  const kupiPhone = process.env.NEXT_PUBLIC_KUPI_PHONE ?? "";

  const deepLink = `sms:${kupiPhone};body=Hey%20KUPI!`;

  return (
    <main style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔥</div>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>You&apos;re in, {name}!</h1>
      <p style={{ fontSize: "18px", color: "#666", marginBottom: "32px" }}>
        Tap below to open iMessage with KUPI. Send your first message to start your free trial.
      </p>
      <a
        href={deepLink}
        style={{
          display: "inline-block",
          padding: "16px 32px",
          backgroundColor: "#000",
          color: "#fff",
          borderRadius: "12px",
          textDecoration: "none",
          fontSize: "18px",
          fontWeight: "bold",
          marginBottom: "24px",
        }}
      >
        Open iMessage with KUPI →
      </a>
      {kupiPhone && (
        <p style={{ color: "#999", fontSize: "14px" }}>
          Or text <strong>{kupiPhone}</strong> and say &quot;Hey KUPI!&quot;
        </p>
      )}
    </main>
  );
}
