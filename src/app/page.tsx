import { LandingNavbar } from "@/components/landing-navbar";
import { LandingHero } from "@/components/landing-hero";
import { LandingFeatures } from "@/components/landing-features";
import { LandingInteractiveScroll } from "@/components/landing-interactive-scroll";
import { LandingPricing } from "@/components/landing-pricing";
import { LandingFooter } from "@/components/landing-footer";
import { LogoSlider } from "@/components/logo-slider";
import { ProductSlider } from "@/components/product-slider";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <LandingNavbar />
      
      <main>
        <LandingHero />
        <ProductSlider />
        <LandingFeatures />
        <LogoSlider />
        <LandingPricing />
        <LandingInteractiveScroll />
      </main>

      <LandingFooter />
    </div>
  );
}