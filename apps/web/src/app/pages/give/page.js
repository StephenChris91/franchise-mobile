import React from "react";
import GiveHero from "@/components/Give/GiveHero";
import WaysToGive from "@/components/Give/WaysToGive";
import OtherGivingOptions from "@/components/Give/OtherGivingOptions";
import FaqSection from "@/components/Give/FAQSection";

const GivePage = () => {
  return (
    <main className="bg-white">
      <GiveHero />
      <WaysToGive />
      {/* <OtherGivingOptions /> */}
      <FaqSection />
    </main>
  );
};

export default GivePage;
