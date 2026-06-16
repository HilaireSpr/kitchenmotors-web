import Link from "next/link";
import { colors } from "@/styles/colors";
import Image from "next/image";
import { Footer } from "./Footer";

export function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #ffffff 0%, #fffdf7 42%, #fff3bf 100%)",
        color: colors.text,
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px clamp(24px, 5vw, 72px)",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: "-0.04em",
            textDecoration: "none",
            color: colors.text,
          }}
        >
        <Image
            src="/logo.png"
            alt="KitchenMotors"
            width={1200}
            height={300}
            priority
            style={{
                width: "320px",
                height: "auto",
            }}
        />
        </Link>

        <nav
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          <Link href="/oplossing">Oplossing</Link>
          <Link href="/workfloor">Workfloor</Link>
          <Link href="/roadmap">Roadmap</Link>
          <Link href="/contact">Contact</Link>
          <Link
            href="/login"
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              background: colors.primary,
              color: colors.text,
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        </nav>
      </header>

      {children}
      <Footer />
    </main>
  );
}