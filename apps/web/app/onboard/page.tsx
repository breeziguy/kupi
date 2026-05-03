import OnboardForm from "@/components/OnboardForm";

export default function OnboardPage() {
  return (
    <main style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "8px" }}>Meet KUPI 🔥</h1>
      <p style={{ fontSize: "18px", color: "#666", marginBottom: "32px" }}>
        Your AI wingman in iMessage. Sign up free and start chatting in 30 seconds.
      </p>
      <OnboardForm />
    </main>
  );
}
