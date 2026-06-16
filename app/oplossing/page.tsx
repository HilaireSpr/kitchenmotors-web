import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTASection } from "@/components/marketing/CTASection";

export default function OplossingPage() {
  return (
    <MarketingLayout>
      <FeatureGrid
        eyebrow="Oplossing"
        title="Eén planning voor recepten, capaciteit en uitvoering."
        intro="KitchenMotors vertaalt menu’s en recepturen naar een haalbare productieplanning voor grootkeukens."
        features={[
          {
            title: "Productieplanning",
            text: "Genereer een dagplanning met starturen, posten, capaciteit, conflicten en manuele overrides.",
          },
          {
            title: "Capaciteitsplanning",
            text: "Bekijk of werkdruk realistisch verdeeld is over tijd, posten en medewerkers.",
          },
          {
            title: "Receptbeheer",
            text: "Beheer recepten, stappen, handelingen, tijden, toestellen en productieposten.",
          },
          {
            title: "Workfloor",
            text: "Zet planning om naar duidelijke takenlijsten voor medewerkers op de werkvloer.",
          },
        ]}
      />
      <CTASection />
    </MarketingLayout>
  );
}