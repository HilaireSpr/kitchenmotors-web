"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { colors } from "@/styles/colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();

    if (!email) return;

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check je mailbox om je wachtwoord opnieuw in te stellen.");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "80px auto",
        padding: 20,
      }}
    >
      <h2>Wachtwoord vergeten</h2>

      <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="email"
          placeholder="jij@bedrijf.be"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 10,
            borderRadius: 8,
            background: colors.primary,
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Bezig..." : "Reset wachtwoord"}
        </button>
      </form>

      {message && (
        <div style={{ marginTop: 12, fontSize: 14 }}>
          {message}
        </div>
      )}
    </div>
  );
}