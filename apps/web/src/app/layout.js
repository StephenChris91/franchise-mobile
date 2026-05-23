import "./globals.css";
import { Ubuntu } from "next/font/google";
import { Toaster } from "react-hot-toast";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import SiteChrome from "@/components/SiteChrome";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-heading",
});

const ubuntuBody = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
});

export const metadata = {
  title: "Franchise Church",
  description: "We envision all men celebrating endless life in Christ.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${ubuntu.variable} ${ubuntuBody.variable}`}>
      <body className="font-body">
        <SessionProviderWrapper>
          <SiteChrome>
            {children}
          </SiteChrome>
          <Toaster position="top-right" />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
