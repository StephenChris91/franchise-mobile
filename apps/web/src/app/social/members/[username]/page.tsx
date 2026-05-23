import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "../../../../../auth";
import { db, profiles } from "../../../../../db";
import { getUserGroups } from "@/lib/social";
import SocialLayout from "@/components/social/SocialLayout";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await db.select().from(profiles).where(eq(profiles.username, username)).limit(1).then((r) => r[0]);
  if (!profile) return { title: "Member not found" };
  return { title: `${profile.fullName} — Franchise Community` };
}

export default async function MemberProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/auth/login?callbackUrl=/social/members/${username}`);
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const [profile, joinedGroups] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.username, username)).limit(1).then((r) => r[0]),
    getUserGroups(session.user.id),
  ]);

  if (!profile || profile.approvalStatus !== "approved") notFound();

  const isOwn = session.user.id === profile.userId;
  const initials = profile.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SocialLayout joinedGroups={joinedGroups}>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-br from-[#af601a] to-[#e8913a]" />

        <div className="px-5 pb-5">
          <div className="-mt-10 mb-3">
            {profile.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.photoUrl}
                alt={profile.fullName}
                className="w-20 h-20 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-2xl font-bold text-white">
                {initials}
              </div>
            )}
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{profile.fullName}</h1>
              <p className="text-sm text-gray-500">@{profile.username}</p>
              <p className="text-xs text-[#af601a] mt-0.5 capitalize">
                {profile.ministry.replace("_", " ")} · {profile.role.replace("_", " ")}
              </p>
            </div>
            {isOwn && (
              <Link
                href="/profile/edit"
                className="text-xs text-[#af601a] border border-[#af601a]/30 rounded-full px-3 py-1.5 hover:bg-[#af601a]/5 transition"
              >
                Edit profile
              </Link>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{profile.bio}</p>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
            {profile.phone && (
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-gray-700 mt-0.5">{profile.phone}</p>
              </div>
            )}
            {profile.whatsappNumber && (
              <div>
                <p className="text-xs text-gray-400">WhatsApp</p>
                <a
                  href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#af601a] hover:underline mt-0.5 block"
                >
                  {profile.whatsappNumber}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </SocialLayout>
  );
}
