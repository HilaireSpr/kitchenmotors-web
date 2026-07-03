import { redirect } from "next/navigation";

export default function IntelligencePage() {
  const enabled = process.env.NEXT_PUBLIC_INTELLIGENCE_ENABLED === "true";

  if (!enabled) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-yellow-600">
            KitchenMotors Premium Module
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            KitchenMotors Intelligence
          </h1>

          <p className="mt-4 max-w-2xl text-gray-600">
            Deze premium module is niet actief voor deze klant.
          </p>
        </section>
      </main>
    );
  }

  redirect("/intelligence/menu-engineering");
}