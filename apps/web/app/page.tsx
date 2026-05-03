import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif" }}>
      <section style={{ padding: "80px 20px", textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "16px", lineHeight: 1.1 }}>
          Your iMessage Wingman 🔥
        </h1>
        <p style={{ fontSize: "20px", color: "#555", marginBottom: "40px", lineHeight: 1.6 }}>
          Send a screenshot. Get real replies. Track interest levels, red flags, and compatibility — all inside iMessage. No app download needed.
        </p>
        <Link
          href="/onboard"
          style={{
            display: "inline-block",
            padding: "16px 40px",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          Get Started Free →
        </Link>
      </section>

      <section style={{ padding: "60px 20px", backgroundColor: "#f9f9f9" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "32px", textAlign: "center" }}>How it works</h2>
          <ol style={{ fontSize: "18px", lineHeight: 2, paddingLeft: "24px" }}>
            <li>Sign up with your name and phone number</li>
            <li>Tap the link to open iMessage with KUPI</li>
            <li>Send a screenshot of any conversation</li>
            <li>Get reply suggestions + vibe analysis instantly</li>
          </ol>
        </div>
      </section>

      <section style={{ padding: "60px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "32px", textAlign: "center" }}>What KUPI does</h2>
          <ul style={{ fontSize: "18px", lineHeight: 2.2, listStyle: "none", padding: 0 }}>
            <li>📸 Analyses chat screenshots — Tinder, Instagram, WhatsApp</li>
            <li>💬 Suggests authentic, personalised replies</li>
            <li>💫 Tracks interest levels over time</li>
            <li>🚩 Spots red flags and green flags</li>
            <li>📊 Chat wraps with compatibility scores</li>
          </ul>
        </div>
      </section>

      <section style={{ padding: "60px 20px", textAlign: "center", backgroundColor: "#000", color: "#fff" }}>
        <h2 style={{ fontSize: "32px", marginBottom: "16px" }}>Start free. No app needed.</h2>
        <p style={{ fontSize: "18px", color: "#aaa", marginBottom: "32px" }}>7-day free trial. Everything in iMessage.</p>
        <Link
          href="/onboard"
          style={{
            display: "inline-block",
            padding: "16px 40px",
            backgroundColor: "#fff",
            color: "#000",
            borderRadius: "12px",
            textDecoration: "none",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          Get Started Free →
        </Link>
      </section>
    </main>
  );
}
