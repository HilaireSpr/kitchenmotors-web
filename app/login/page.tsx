import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/login-form";
import { colors } from "@/styles/colors";

type Props = {
  searchParams?: {
    error?: string;
  };
};

function getErrorMessage(error?: string) {
  if (!error) return null;

  if (error === "invalid_link") {
    return "Deze login link is ongeldig of verlopen.";
  }

  return "Er ging iets mis. Probeer opnieuw.";
}

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const errorMessage = getErrorMessage(searchParams?.error);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr minmax(420px, 520px)",
        background: colors.bg,
      }}
    >
      <section
        style={{
          padding: 48,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #fffdf7 0%, #fff8de 48%, #fff3bf 100%)",
          borderRight: `1px solid ${colors.border}`,
        }}
      >
        <div className="stack">
          <Link href="/">← Terug</Link>

          <h1 style={{ fontSize: 48, margin: 0 }}>
            Kitchen
            <br />
            Motors
          </h1>

          <p style={{ color: colors.textMuted, maxWidth: 480 }}>
            Slim plannen voor grootkeukens. Minder chaos, meer overzicht.
          </p>
        </div>

        <div style={{ fontSize: 13, color: colors.textMuted }}>
          Menu • Planner • Print
        </div>
      </section>

      <section
        style={{
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
          <h2 style={{ margin: 0 }}>Login</h2>

          {errorMessage && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: colors.conflictBg,
                border: `1px solid ${colors.danger}`,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {errorMessage}
            </div>
          )}

          <LoginForm />

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <Link
              href="/forgot-password"
              style={{
                fontSize: 14,
                color: colors.textMuted,
                textDecoration: "underline",
              }}
            >
              Wachtwoord vergeten?
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}