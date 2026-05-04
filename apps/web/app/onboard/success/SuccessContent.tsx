"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessContent() {
  const params = useSearchParams();
  const name = params.get("name") ?? "there";
  const redirectUrl = params.get("redirectUrl");
  const assignedPhone = params.get("assignedPhone");
  const configuredPhotonPhone =
    process.env.NEXT_PUBLIC_PHOTON_IMESSAGE_PHONE ??
    process.env.NEXT_PUBLIC_KUPI_PHONE ??
    "";

  const photonPhone = configuredPhotonPhone.includes("XXXX")
    ? ""
    : configuredPhotonPhone;
  const fallbackDeepLink = `sms:${photonPhone}&body=${encodeURIComponent("Hey KUPI!")}`;
  const deepLink = redirectUrl ?? fallbackDeepLink;
  const displayPhone = assignedPhone || photonPhone;

  return (
    <main style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔥</div>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>You&apos;re in, {name}!</h1>
      <p style={{ fontSize: "18px", color: "#666", marginBottom: "32px" }}>
        Tap below to open iMessage with KUPI. Send your first message to start your free trial.
      </p>
      {redirectUrl || photonPhone ? (
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
      ) : (
        <p style={{ color: "#b45309", fontSize: "16px", marginBottom: "24px" }}>
          Photon iMessage number is not configured yet.
        </p>
      )}
      {displayPhone ? (
        <p style={{ color: "#999", fontSize: "14px" }}>
          Or text <strong>{displayPhone}</strong> and say &quot;Hey KUPI!&quot;
        </p>
      ) : null}
    </main>
  );
}
