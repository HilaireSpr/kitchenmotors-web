import Link from "next/link";
import { colors } from "@/styles/colors";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffffff 0%, #fffdf7 42%, #fff3bf 100%)",
        color: colors.text,
      }}
    >
      <section
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(360px, 0.85fr)",
          gap: 48,
          alignItems: "center",
          padding: "56px clamp(24px, 5vw, 72px)",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: colors.primarySoft,
              border: `1px solid ${colors.primaryLight}`,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            Productieplanning voor grootkeukens
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(48px, 7vw, 86px)",
              lineHeight: 0.95,
              letterSpacing: "-0.06em",
              fontWeight: 900,
            }}
          >
            Kitchen
            <br />
            Motors
          </h1>

          <p
            style={{
              margin: "24px 0 0 0",
              maxWidth: 620,
              color: colors.textMuted,
              fontSize: 20,
              lineHeight: 1.55,
            }}
          >
            Slim plannen voor grootkeukens. Van recepten en menu’s naar een
            werkbare dagplanning met capaciteit, starturen, conflicten en
            printbare takenlijsten.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 32,
            }}
          >
            <Link
              className="button"
              href="/login"
              style={{
                background: colors.primary,
                color: colors.text,
                border: "none",
                fontWeight: 800,
                padding: "12px 18px",
                boxShadow: "0 10px 24px rgba(255, 192, 0, 0.26)",
              }}
            >
              Start met plannen
            </Link>

          </div>
        </div>

        <div
          style={{
            border: `1px solid ${colors.border}`,
            background: "rgba(255,255,255,0.84)",
            borderRadius: 28,
            padding: 24,
            boxShadow: "0 24px 70px rgba(17,17,17,0.10)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {[
            ["Recepten", "Importeer en beheer handelingen, stappen en tijden."],
            ["Menu", "Bouw menu-groepen per dag, cyclus en serveermoment."],
            ["Planner", "Genereer planning met Gantt, capaciteit en overrides."],
            ["Print", "Maak heldere dag- en postlijsten voor de keuken."],
          ].map(([title, text]) => (
            <div
              key={title}
              style={{
                padding: 18,
                borderRadius: 18,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 18 }}>{title}</div>
              <div
                style={{
                  marginTop: 6,
                  color: colors.textMuted,
                  lineHeight: 1.5,
                }}
              >
                {text}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}