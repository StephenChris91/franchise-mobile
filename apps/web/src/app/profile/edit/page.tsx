import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { db, profiles } from "../../../../db";
import { eq } from "drizzle-orm";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Profile — Franchise Church" };

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/profile/edit");

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
        <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
