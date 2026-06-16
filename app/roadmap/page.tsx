import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { CTASection } from "@/components/marketing/CTASection";

export default function RoadmapPage() {
  return (
    <MarketingLayout>
      <FeatureGrid
        eyebrow="Roadmap"
        title="Van productieplanning naar operationeel keukensysteem."
        intro="De eerste focus ligt op productieplanning. Daarna bouwen we verder richting bestellen, leveranciers en voorraad."
        features={[
          {
            title: "Bestelmodule",
            text: "Van menu en productieplanning naar concrete bestelvoorstellen.",
          },
          {
            title: "Leveranciersbeheer",
            text: "Koppel producten, leveranciers, leverdagen en bestelafspraken.",
          },
          {
            title: "Voorraadbeheer",
            text: "Ondersteun voorraadopvolging en verminder manueel tel- en rekenwerk.",
          },
        ]}
      />
      <CTASection />
    </MarketingLayout>
  );
}