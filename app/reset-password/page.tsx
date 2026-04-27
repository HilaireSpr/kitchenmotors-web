"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setupSession() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage("Reset link is ongeldig of verlopen.");
          return;
        }

        window.history.replaceState({}, document.title, "/reset-password");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Geen geldige reset sessie gevonden. Vraag opnieuw een reset link aan.");
      }

      setIsReady(true);
    }

    setupSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Wachtwoord succesvol aangepast. Je kan nu opnieuw inloggen.");
      setPassword("");
    }

    setIsLoading(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div
        className="card stack"
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 24,
          borderRadius: 20,
        }}
      >
        <h1 style={{ margin: 0 }}>Nieuw wachtwoord</h1>

        <form onSubmit={handleUpdate} className="stack">
          <input
            type="password"
            placeholder="Nieuw wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!isReady || isLoading}
          />

          <button type="submit" disabled={!isReady || isLoading}>
            {isLoading ? "Opslaan..." : "Wachtwoord opslaan"}
          </button>
        </form>

        {message && <p>{message}</p>}
      </div>
    </main>
  );
}