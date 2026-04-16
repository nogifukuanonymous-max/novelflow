import type { Metadata } from "next";
import { GlobalNav } from "@/components/layout/Nav";
import { HeroSection } from "./HeroSection";
import {
  PickupSection,
  RankingSection,
  NvfBanner,
  FeatureSection,
  CtaSection,
  FooterSection,
} from "./PageSections";

export const metadata: Metadata = {
  title: "NovelFlow — あなただけの物語を、読もう",
};

export default function HomePage() {
  return (
    <>
      <GlobalNav />
      <main>
        <HeroSection />
        <PickupSection />
        <div className="border-t border-border max-w-[1100px] mx-auto my-6" />
        <RankingSection />
        <div className="border-t border-border max-w-[1100px] mx-auto my-8" />
        <NvfBanner />
        <FeatureSection />
        <CtaSection />
      </main>
      <FooterSection />
    </>
  );
}
