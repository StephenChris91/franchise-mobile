import AboutApproachSection from "@/components/about/AboutApproachSection";
import AboutBanner from "@/components/about/AboutBanner";
import AboutBelieveSection from "@/components/about/AboutBelieveSection";
import AboutIntroSection from "@/components/about/AboutIntroSection";
import AboutLeadPastorSection from "@/components/about/AboutLeadPastorSection";
import AboutServeGodSection from "@/components/about/AboutServeGodSection";
import IntroSection from "@/components/about/IntroSection";
// import WeBelieveSection from '@/components/about/WeBelieveSection'
// import ApproachSection from '@/components/about/ApproachSection'
// import GallerySection from '@/components/about/GallerySection'
// import LeadPastorSection from '@/components/about/LeadPastorSection'
// import ExperienceSection from '@/components/about/ExperienceSection'
// import CommunitySection from '@/components/about/CommunitySection'
// import GiveSection from '@/components/about/GiveSection'
// import NewsletterSection from '@/components/about/NewsletterSection'

export default function AboutPage() {
  return (
    <div className="bg-[#ededed] text-black">
      <AboutBanner />
      <AboutServeGodSection />
      <AboutBelieveSection />
      <AboutApproachSection />
      <AboutLeadPastorSection />
    </div>
  );
}
