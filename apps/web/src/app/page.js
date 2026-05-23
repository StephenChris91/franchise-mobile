import CommunitySection from "@/components/CommunitySection";
import EveryoneSection from "@/components/EveryoneSection";
import HeroSection from "@/components/HeroSection";
import LeadPastorSection from "@/components/LeadPastorSection";
import MovementSection from "@/components/MovementSection";
import WelcomeSection from "@/components/WelcomeSection";
import WorshipHighlight from "@/components/WorshipHighlight";

export default function Home() {
  return (
    <>
      <HeroSection />
      <WelcomeSection />
      <MovementSection />
      <WorshipHighlight />
      <CommunitySection />
      <LeadPastorSection />
      <EveryoneSection />
      {/* More sections will go here... */}
    </>
  );
}
