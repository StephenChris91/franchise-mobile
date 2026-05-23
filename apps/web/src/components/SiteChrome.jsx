"use client";

import { usePathname } from "next/navigation";
import SiteNavbar from "./Navbar";
import SiteFooter from "./Footer";
import AudioPlayerBar from "./sermons/AudioPlayerBar";
import { AudioPlayerProvider } from "@/context/AudioPlayerContext";

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <AudioPlayerProvider>
      <SiteNavbar />
      {children}
      <SiteFooter />
      <AudioPlayerBar />
    </AudioPlayerProvider>
  );
}
