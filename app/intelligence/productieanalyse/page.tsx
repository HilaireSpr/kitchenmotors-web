import Link from "next/link";

export default function ProductieanalysePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <Link
          href="/intelligence"
          className="text-sm font-semibold text-yellow-700 hover:text-yellow-800"
        >
          ← Terug naar Intelligence
        </Link>
      </div>

      <section className="rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-yellow-600">
          Intelligence Module
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Productieanalyse
        </h1>

        <p className="mt-4 max-w-3xl text-gray-600">
          Deze module wordt later gebruikt voor analyse van productievolumes,
          evoluties, planning versus realisatie en jaar-op-jaar inzichten.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-bold text-gray-900">Binnenkort beschikbaar</h2>
        <p className="mt-2 text-sm text-gray-600">
          We bouwen eerst Menu Engineering volledig uit en gebruiken daarna
          dezelfde Intelligence-bouwstenen voor Productieanalyse.
        </p>
      </section>
    </main>
  );
}