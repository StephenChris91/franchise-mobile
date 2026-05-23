import Link from "next/link";
import { Clock } from "lucide-react";

export const metadata = { title: "Awaiting Approval — Franchise Church" };

export default function PendingPage() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#af601a]/20 mb-6">
        <Clock className="text-[#af601a]" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">
        You&apos;re on the list
      </h1>
      <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
        Your registration is being reviewed by our pastoral team. We typically
        respond within 24–48 hours. You&apos;ll receive an email once approved.
      </p>
      <p className="text-white/40 text-xs mb-8">
        Questions? Reach us at{" "}
        <a
          href="mailto:info@thefranchiselagos.com.ng"
          className="text-[#af601a] hover:underline"
        >
          info@thefranchiselagos.com.ng
        </a>
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition"
      >
        Back to the site
      </Link>
    </div>
  );
}
