import { auth } from "../../../../auth";
import { redirect, notFound } from "next/navigation";
import { db, profiles, users } from "../../../../db";
import { eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import { ProfileRow } from "@/components/profile/ProfileRow";

export const dynamic = "force-dynamic";

const MINISTRY_LABELS: Record<string, string> = {
  none: "No ministry",
  choir: "Choir",
  ushers: "Ushers",
  prayer_team: "Prayer Team",
  media: "Media",
  kids: "Franchise Kids",
  youth: "Youth",
  adults: "Adults",
  other: "Other",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username} — Franchise Church` };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();

  // Only approved members can view profiles
  if (!session?.user) redirect(`/auth/login?callbackUrl=/profile/${username}`);
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const profile = await db
    .select({ profile: profiles, user: users })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.username, username))
    .limit(1)
    .then((r) => r[0]);

  if (!profile || profile.profile.approvalStatus !== "approved") notFound();

  const { profile: p } = profile;
  const isOwn = session.user.id === p.userId;

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-white">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5">
            <div>
              {p.photoUrl ? (
                <Image
                  src={p.photoUrl}
                  alt={p.fullName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#af601a]/20 flex items-center justify-center">
                  <User size={36} className="text-[#af601a]" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{p.fullName}</p>
              <p className="text-white/50 text-sm">@{p.username}</p>
              <p className="text-xs mt-1 capitalize text-[#af601a] font-medium">
                {p.role}
              </p>
            </div>
          </div>

          {p.bio && (
            <p className="mt-5 text-white/70 text-sm leading-relaxed border-t border-white/10 pt-5">
              {p.bio}
            </p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
          <ProfileRow label="Ministry">{MINISTRY_LABELS[p.ministry] ?? p.ministry}</ProfileRow>
          <ProfileRow label="Member since">
            {p.createdAt.toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </ProfileRow>
        </div>

        {isOwn && (
          <div className="mt-6 text-center">
            <Link
              href="/profile/edit"
              className="inline-block px-5 py-2.5 rounded-lg bg-[#af601a] text-white text-sm font-medium hover:bg-[#c47020] transition"
            >
              Edit your profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
