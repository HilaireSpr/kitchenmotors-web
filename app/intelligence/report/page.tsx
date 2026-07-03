import Link from "next/link";
import ReportHeader from "@/components/intelligence/report/ReportHeader";

export default function IntelligenceReportPage() {
  return (
    <main className="app-page">
      <div style={{ marginBottom: 20 }}>
        <Link href="/intelligence/menu-engineering" style={{ fontWeight: 700 }}>
          ← Terug naar analyse
        </Link>
      </div>

      <ReportHeader
        title="Managementrapport"
        subtitle="Interactief rapport met managementsamenvatting, topgerechten, aandachtspunten, prestatiematrix en export."
      />

      <section className="card" style={{ padding: 24 }}>
        <h2>Rapport in opbouw</h2>
        <p style={{ color: "#666", marginBottom: 0 }}>
          Hier komen de rapportsecties op basis van de analyse.
        </p>
      </section>
    </main>
  );
}