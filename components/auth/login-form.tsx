"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { colors } from "@/styles/colors";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) return;

    setLoading(true);
    setMessage("");
    setIsError(false);

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleLogin} className="stack" style={{ gap: 14 }}>
      <input
        className="input"
        type="email"
        placeholder="jij@bedrijf.be"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
        autoComplete="email"
        style={{ minHeight: 48, borderRadius: 12 }}
      />

      <input
        className="input"
        type="password"
        placeholder="Wachtwoord"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        style={{ minHeight: 48, borderRadius: 12 }}
      />

      <button
        className="button"
        type="submit"
        disabled={loading}
        style={{
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
          background: colors.primary,
          border: "none",
        }}
      >
        {loading ? "Bezig..." : "Inloggen"}
      </button>

      {message ? (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            background: isError ? colors.conflictBg : colors.primarySoft,
            color: isError ? "#9f1d1d" : colors.text,
            border: `1px solid ${
              isError ? colors.danger : colors.primaryLight
            }`,
          }}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}