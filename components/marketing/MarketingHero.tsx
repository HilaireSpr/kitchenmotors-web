import Link from "next/link";
import { colors } from "@/styles/colors";

export function MarketingHero() {
  return (
    <section
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.15fr) minmax(340px, 0.85fr)",
        gap: 48,
        alignItems: "center",
        padding: "56px clamp(24px, 5vw, 72px)",
      }}
    >
      <div style={{ maxWidth: 780 }}>
        <div
          style={{
            display: "inline-flex",
            padding: "8px 12px",
            borderRadius: 999,
            background: colors.primarySoft,
            border: `1px solid ${colors.primaryLight}`,
            fontSize: 13,
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          Productieplanning voor grootkeukens
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(44px, 7vw, 82px)",
            lineHeight: 0.96,
            letterSpacing: "-0.06em",
            fontWeight: 900,
          }}
        >
          Van menu naar werkbare keukenplanning.
        </h1>

        <p
          style={{
            marginTop: 24,
            maxWidth: 650,
            color: colors.textMuted,
            fontSize: 20,
            lineHeight: 1.55,
          }}
        >
          KitchenMotors helpt grootkeukens om recepten, menu’s, capaciteit,
          posten en takenlijsten samen te brengen in één praktische planning.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
          <Link
            href="/contact"
            style={{
              background: colors.primary,
              color: colors.text,
              borderRadius: 999,
              fontWeight: 900,
              padding: "13px 18px",
              textDecoration: "none",
              boxShadow: "0 10px 24px rgba(255, 192, 0, 0.26)",
            }}
          >
            Demo aanvragen
          </Link>

          <Link
            href="/oplossing"
            style={{
              background: "#fff",
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              fontWeight: 900,
              padding: "13px 18px",
              textDecoration: "none",
            }}
          >
            Bekijk oplossing
          </Link>
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${colors.border}`,
          background: "rgba(255,255,255,0.86)",
          borderRadius: 28,
          padding: 24,
          boxShadow: "0 24px 70px rgba(17,17,17,0.10)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {[
          ["Receptbeheer", "Beheer stappen, handelingen, tijden en posten."],
          ["Productieplanning", "Plan taken met capaciteit, starturen en conflicten."],
          ["Workfloor", "Geef medewerkers een duidelijke smartphone takenlijst."],
          ["Pilotklaar", "Gebouwd rond de realiteit van grootkeukens."],
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
            <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
            <div style={{ marginTop: 6, color: colors.textMuted, lineHeight: 1.5 }}>
              {text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}