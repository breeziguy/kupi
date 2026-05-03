"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";

export default function OnboardForm() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const onboard = useMutation(api.users.onboard);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onboard({ name, gender, phone });
      router.push(
        `/onboard/success?name=${encodeURIComponent(name)}`
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
      <input
        type="text"
        placeholder="Your first name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        style={{ padding: "10px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box" as const }}
      />
      <select
        value={gender}
        onChange={e => setGender(e.target.value)}
        required
        style={{ padding: "10px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box" as const }}
      >
        <option value="">Who are you?</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <input
        type="tel"
        placeholder="+1 (555) 000-0000"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
        style={{ padding: "10px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", width: "100%", boxSizing: "border-box" as const }}
      />
      {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
      <button
        type="submit"
        disabled={loading}
        style={{ padding: "12px", fontSize: "16px", borderRadius: "8px", backgroundColor: "#000", color: "#fff", border: "none", cursor: loading ? "wait" : "pointer" }}
      >
        {loading ? "Getting you set up..." : "Get Started Free →"}
      </button>
    </form>
  );
}
