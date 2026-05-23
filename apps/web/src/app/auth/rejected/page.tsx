import { auth } from "../../../../auth";
import Link from "next/link";
import { db, profiles } from "../../../../db";
import { eq } from "drizzle-orm";
import { XCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Application Declined — Franchise Church" };

export default async function RejectedPage() {
  const session = await auth();
  let reason: string | null = null;

  if (session?.user?.id) {
    const profile = await db
      .select({ rejectionReason: profiles.rejectionReason })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1)
      .then((r) => r[0]);
    reason = profile?.rejectionReason ?? null;
  }

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 mb-6">
        <XCircle className="text-red-400" size={32} />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">
        Application not approved
      </h1>
      <p className="text-white/60 text-sm leading-relaxed mb-4 max-w-sm mx-auto">
        Unfortunately, your membership application was not approved at this time.
      </p>
      {reason && (
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-6 text-left">
          <p className="text-xs text-white/40 mb-1 font-medium uppercase tracking-wide">Reason</p>
          <p className="text-white/80 text-sm">{reason}</p>
        </div>
      )}
      <p className="text-white/40 text-xs mb-8">
        If you believe this is in error, please contact our pastoral team.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/pages/counselling"
          className="px-6 py-3 rounded-lg bg-[#af601a] text-white text-sm font-bold hover:bg-[#c47020] transition"
        >
          Contact pastoral team
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition"
        >
          Back to site
        </Link>
      </div>
    </div>
  );
}
