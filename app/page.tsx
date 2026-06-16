import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { CTASection } from "@/components/marketing/CTASection";

export default function HomePage() {
  return (
    <MarketingLayout>
      <MarketingHero />
      <CTASection />
    </MarketingLayout>
  );
}