import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, MapPin } from "lucide-react";
import { auth } from "../../../auth";
import {
  getMainFeed,
  getUserGroups,
  getUserNotifications,
  getUnreadNotificationCount,
  getMembers,
} from "@/lib/social";
import { getUpcomingEventTeaser } from "@/lib/events";
import SocialLayout from "@/components/social/SocialLayout";
import SocialFeedSection from "@/components/social/SocialFeedSection";
import NotificationBell from "@/components/social/NotificationBell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Community — Franchise Church" };

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login?callbackUrl=/social");
  if (session.user.approvalStatus !== "approved") redirect("/auth/pending");

  const { type } = await searchParams;

  const [initialPosts, joinedGroups, notifications, unreadCount, members, upcomingEvents] = await Promise.all([
    getMainFeed(session.user.id, undefined, type),
    getUserGroups(session.user.id),
    getUserNotifications(session.user.id),
    getUnreadNotificationCount(session.user.id),
    getMembers(),
    getUpcomingEventTeaser(3),
  ]);

  // Find the current user's username for optimistic post display
  const currentUserUsername =
    members.find((m) => m.userId === session.user.id)?.username ?? "";

  async function loadMorePosts(cursor: string) {
    "use server";
    return getMainFeed(session!.user!.id!, cursor, type);
  }

  const rightSidebar = (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Members</h3>
        <div className="space-y-2">
          {members.slice(0, 5).map((m) => (
            <Link
              key={m.userId}
              href={`/social/members/${m.username}`}
              className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg p-1.5 transition"
            >
              {m.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.photoUrl} alt={m.fullName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-[11px] font-bold text-white">
                  {m.fullName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.fullName}</p>
                <p className="text-xs text-gray-400 truncate capitalize">
                  {m.ministry.replace("_", " ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <Link href="/social/members" className="text-xs text-[#af601a] hover:underline mt-3 block">
          See all members →
        </Link>
      </div>

      {/* Events teaser */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming Events</h3>
            <Link href="/events" className="text-xs text-[#af601a] hover:underline">
              See all →
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="flex gap-3 hover:bg-gray-50 rounded-lg p-1.5 transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#af601a]/10 flex items-center justify-center shrink-0">
                  <Calendar size={15} className="text-[#af601a]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-[#af601a] transition">
                    {e.title}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {format(new Date(e.startsAt), "d MMM · h:mm a")}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    <MapPin size={9} />
                    <span className="truncate">{e.location}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#1b1b1b] to-[#2a2a2a] rounded-2xl p-4 text-white/80">
        <p className="text-xs leading-relaxed italic">
          &ldquo;And let us consider how to stir up one another to love and good
          works, not neglecting to meet together.&rdquo;
        </p>
        <p className="text-[10px] text-white/40 mt-2">Hebrews 10:24–25</p>
      </div>
    </div>
  );

  return (
    <SocialLayout joinedGroups={joinedGroups} rightSidebar={rightSidebar}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">
          {type === "prayer"
            ? "Prayer Wall"
            : type === "announcement"
            ? "Announcements"
            : "Community Feed"}
        </h1>
        <NotificationBell
          userId={session.user.id}
          initialNotifications={notifications}
          initialUnread={unreadCount}
        />
      </div>

      <SocialFeedSection
        initialPosts={initialPosts}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
        currentUserName={session.user.name ?? "Member"}
        currentUserPhoto={session.user.image}
        currentUserUsername={currentUserUsername}
        groupId={null}
        postType={type}
        loadMoreAction={loadMorePosts}
      />
    </SocialLayout>
  );
}
