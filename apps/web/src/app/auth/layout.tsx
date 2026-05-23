import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1b1b1b] flex flex-col">
      <header className="py-6 px-6 flex justify-center border-b border-white/10">
        <Link href="/">
          <Image
            src="/assets/logo.png"
            alt="Franchise Church"
            width={140}
            height={40}
            style={{ objectFit: "contain", height: "40px", width: "auto" }}
            priority
          />
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-4 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Franchise Church, Lagos
      </footer>
    </div>
  );
}
