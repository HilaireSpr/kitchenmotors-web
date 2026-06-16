import Link from "next/link";
import { colors } from "@/styles/colors";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${colors.border}`,
        padding: "20px clamp(24px, 5vw, 72px)",
        background: "rgba(255,255,255,0.6)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: colors.textMuted,
            fontSize: 14,
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          Productieplanning voor grootkeukens.
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 18,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Link href="/oplossing">Oplossing</Link>
          <Link href="/workfloor">Workfloor</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Login</Link>
        </div>

        <div
          style={{
            color: colors.textMuted,
            fontSize: 13,
          }}
        >
          © {new Date().getFullYear()} KitchenMotors
        </div>
      </div>
    </footer>
  );
}