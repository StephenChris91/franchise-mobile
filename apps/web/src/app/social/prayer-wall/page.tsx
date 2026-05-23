import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "../../../../auth";
import { getMainFeed, getUserGroups } from "@/lib/social";
import SocialLayout from "@/components/social/SocialLayout";
import PostComposer from "@/components/social/PostComposer";
import FeedClient from "@/components/social/FeedClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prayer Wall — Franchise Community" };

export default async function PrayerWallPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/social/prayer-wall");
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const [initialPosts, joinedGroups] = await Promise.all([
    getMainFeed(session.user.id, undefined, "prayer"),
    getUserGroups(session.user.id),
  ]);

  async function loadMorePosts(cursor: string) {
    "use server";
    return getMainFeed(session!.user!.id!, cursor, "prayer");
  }

  return (
    <SocialLayout joinedGroups={joinedGroups}>
      <div className="mb-4">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-5 text-white mb-4">
          <h1 className="text-xl font-bold mb-1">🕊️ Prayer Wall</h1>
          <p className="text-sm text-purple-200">
            Share your prayer requests and agree with others in faith.
          </p>
          <p className="text-xs text-purple-300 mt-1 italic">
            &ldquo;The effective, fervent prayer of a righteous man avails much.&rdquo; — James 5:16
          </p>
        </div>

        <PostComposer
          authorName={session.user.name ?? "Member"}
          authorPhoto={session.user.image}
        />
      </div>

      <FeedClient
        initialPosts={initialPosts}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
        groupId={null}
        postType="prayer"
        loadMoreAction={loadMorePosts}
      />
    </SocialLayout>
  );
}
