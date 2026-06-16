import Link from "next/link";
import { colors } from "@/styles/colors";

export function CTASection() {
  return (
    <section style={{ padding: "32px clamp(24px, 5vw, 72px) 88px" }}>
      <div
        style={{
          borderRadius: 28,
          padding: "36px clamp(24px, 5vw, 48px)",
          background: colors.primarySoft,
          border: `1px solid ${colors.primaryLight}`,
          color: colors.text,
          display: "flex",
          justifyContent: "space-between",
          gap: 24,
          alignItems: "center",
          flexWrap: "wrap",
          boxShadow: "0 18px 44px rgba(255, 192, 0, 0.24)",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 34, letterSpacing: "-0.04em" }}>
            Klaar om de keukenplanning te testen?
          </h2>
          <p style={{ margin: "10px 0 0", opacity: 0.92 }}>
            Vraag een demo aan voor je grootkeuken of pilootproject.
          </p>
        </div>

        <Link
          href="/contact"
          style={{
            background: "#ffffff",
            color: colors.text,
            borderRadius: 999,
            fontWeight: 900,
            padding: "13px 18px",
            textDecoration: "none",
          }}
        >
          Demo aanvragen
        </Link>
      </div>
    </section>
  );
}