import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { auth } from "../../../../auth";
import { getUserNotifications, getUserGroups } from "@/lib/social";
import SocialLayout from "@/components/social/SocialLayout";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications — Franchise Community" };

const TYPE_LABELS: Record<string, string> = {
  comment_on_post: "commented on your post",
  reaction_on_post: "reacted to your post",
  prayer_reaction: "is praying for your post",
  group_join: "joined your group",
  mention: "mentioned you",
  new_post_in_group: "posted in a group you follow",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/social/notifications");
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const [notifications, joinedGroups] = await Promise.all([
    getUserNotifications(session.user.id),
    getUserGroups(session.user.id),
  ]);

  return (
    <SocialLayout joinedGroups={joinedGroups}>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Notifications</h1>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <p className="text-base">No notifications yet</p>
            <p className="text-xs mt-2 text-gray-300">
              &ldquo;Be still, and know that I am God.&rdquo; — Psalm 46:10
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn("px-5 py-4", !n.isRead && "bg-[#af601a]/5")}
              >
                <p className="text-sm text-gray-800">
                  {n.actorName && (
                    <span className="font-semibold">{n.actorName} </span>
                  )}
                  {TYPE_LABELS[n.notificationType] ?? n.notificationType}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SocialLayout>
  );
}
