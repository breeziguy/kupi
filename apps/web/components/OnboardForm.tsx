"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

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
    if (!name.trim() || !gender || !phone.trim()) {
      setError("Please fill in all fields to continue.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onboard({ name: name.trim(), gender, phone: phone.trim() });
      const photonResponse = await fetch("/api/photon/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const photon = await photonResponse.json();
      if (!photonResponse.ok) throw new Error(photon.error ?? "Photon setup failed");
      router.push(
        `/onboard/success?name=${encodeURIComponent(name.trim())}&redirectUrl=${encodeURIComponent(photon.redirectUrl)}&assignedPhone=${encodeURIComponent(photon.assignedPhoneNumber ?? "")}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="form-wrap">
      <input
        type="text"
        placeholder="Your first name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        className="form-input"
      />
      <select
        value={gender}
        onChange={e => setGender(e.target.value)}
        required
        className="form-select"
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
        className="form-input"
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={loading} className="form-btn">
        {loading ? "Getting you set up..." : "Get Started Free →"}
      </button>
    </form>
  );
}
