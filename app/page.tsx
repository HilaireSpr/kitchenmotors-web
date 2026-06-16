import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { ProductScreenshots } from "@/components/marketing/ProductScreenshots";
import { CTASection } from "@/components/marketing/CTASection";

export default function HomePage() {
  return (
    <MarketingLayout>
      <MarketingHero />
      <ProductScreenshots />
      <CTASection />
    </MarketingLayout>
  );
}