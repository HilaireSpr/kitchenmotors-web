import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTASection } from "@/components/marketing/CTASection";

export default function WorkfloorPage() {
  return (
    <MarketingLayout>
      <FeatureGrid
        eyebrow="Workfloor"
        title="Takenlijsten die werken op de keukenvloer."
        intro="De smartphonepagina geeft medewerkers een helder overzicht van hun taken, zonder dat ze door de volledige planning moeten navigeren."
        features={[
          {
            title: "Mobiel bruikbaar",
            text: "De pagina is bedoeld voor gebruik op smartphone via /my-tasks.",
          },
          {
            title: "Per medewerker of post",
            text: "Taken worden begrijpelijk weergegeven zodat uitvoering centraal staat.",
          },
          {
            title: "Minder printchaos",
            text: "Digitale takenlijsten helpen om planning en uitvoering dichter bij elkaar te brengen.",
          },
        ]}
      />
      <CTASection />
    </MarketingLayout>
  );
}