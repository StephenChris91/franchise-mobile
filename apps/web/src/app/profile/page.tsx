import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { db, profiles } from "../../../db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { Pencil, User } from "lucide-react";
import { ProfileRow, ProfileBlank } from "@/components/profile/ProfileRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Profile — Franchise Church" };

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

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/profile");

  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)
    .then((r) => r[0]);

  if (!profile) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-[#1b1b1b] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between mb-8">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <Link
            href="/profile/edit"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#af601a] text-white text-sm font-medium hover:bg-[#c47020] transition"
          >
            <Pencil size={14} />
            Edit profile
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {profile.photoUrl ? (
                <Image
                  src={profile.photoUrl}
                  alt={profile.fullName}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#af601a]/20 flex items-center justify-center">
                  <User size={36} className="text-[#af601a]" />
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1b1b1b] ${
                  profile.approvalStatus === "approved"
                    ? "bg-green-500"
                    : "bg-yellow-500"
                }`}
              />
            </div>
            <div>
              <p className="text-xl font-bold">{profile.fullName}</p>
              <p className="text-white/50 text-sm">@{profile.username}</p>
              <p className="text-xs mt-1 capitalize text-[#af601a] font-medium">
                {profile.role}
              </p>
            </div>
          </div>

          {profile.bio && (
            <p className="mt-5 text-white/70 text-sm leading-relaxed border-t border-white/10 pt-5">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl divide-y divide-white/10">
          <ProfileRow label="Ministry">{MINISTRY_LABELS[profile.ministry] ?? profile.ministry}</ProfileRow>
          <ProfileRow label="Phone">{profile.phone ?? <ProfileBlank />}</ProfileRow>
          <ProfileRow label="WhatsApp">{profile.whatsappNumber ?? <ProfileBlank />}</ProfileRow>
          <ProfileRow label="Member since">
            {profile.createdAt.toLocaleDateString("en-NG", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </ProfileRow>
          <ProfileRow label="Approval">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                profile.approvalStatus === "approved"
                  ? "bg-green-900/40 text-green-400"
                  : profile.approvalStatus === "pending"
                  ? "bg-yellow-900/40 text-yellow-400"
                  : "bg-red-900/40 text-red-400"
              }`}
            >
              {profile.approvalStatus}
            </span>
          </ProfileRow>
        </div>
      </div>
    </div>
  );
}
