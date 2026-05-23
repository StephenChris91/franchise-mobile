import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { getMembers, getUserGroups } from "@/lib/social";
import SocialLayout from "@/components/social/SocialLayout";
import MembersClient from "@/components/social/MembersClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Members — Franchise Community" };

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/social/members");
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const [members, joinedGroups] = await Promise.all([
    getMembers(),
    getUserGroups(session.user.id),
  ]);

  return (
    <SocialLayout joinedGroups={joinedGroups}>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Members</h1>
      <MembersClient members={members} currentUserId={session.user.id} />
    </SocialLayout>
  );
}
