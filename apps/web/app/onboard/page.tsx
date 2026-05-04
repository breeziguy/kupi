import Image from "next/image";
import OnboardForm from "@/components/OnboardForm";

export default function OnboardPage() {
  return (
    <div className="page-wrap">

      <Image
        src="/profile.png"
        alt="KUPI"
        width={120}
        height={120}
        style={{ width: 120, height: 120, borderRadius: 24, objectFit: "cover", marginBottom: 24 }}
        priority
      />

      <h1 className="heading-xl" style={{ marginBottom: 12 }}>
        Meet KUPI
      </h1>

      <p className="body-muted" style={{ marginBottom: 36 }}>
        Your AI wingman in iMessage. Sign up free and start chatting in 30 seconds — no app download needed.
      </p>

      <div className="card" style={{ maxWidth: 450 }}>
        <OnboardForm />
      </div>

      <p className="body-muted" style={{ marginTop: 24, marginBottom: 0 }}>
        Works with Tinder · Hinge · Instagram · WhatsApp · Bumble
      </p>

      <footer style={{ marginTop: 40 }}>© 2025 KUPI. All rights reserved.</footer>
    </div>
  );
}
