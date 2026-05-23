import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { getAllGroups, getUserGroups } from "@/lib/social";
import SocialLayout from "@/components/social/SocialLayout";
import GroupsClient from "@/components/social/GroupsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Groups — Franchise Community" };

export default async function GroupsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/social/groups");
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const [allGroups, joinedGroups] = await Promise.all([
    getAllGroups(),
    getUserGroups(session.user.id),
  ]);

  const joinedIds = new Set(joinedGroups.map((g) => g.id));

  return (
    <SocialLayout joinedGroups={joinedGroups}>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Discover Groups</h1>
      <GroupsClient
        groups={allGroups}
        joinedIds={[...joinedIds]}
        currentUserId={session.user.id}
      />
    </SocialLayout>
  );
}
