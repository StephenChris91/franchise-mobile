"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { markNotificationsRead } from "@/lib/actions/social";
import { getPusherClient } from "@/lib/pusher-client";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  notificationType: string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  createdAt: Date;
  actorName?: string;
}

const TYPE_LABELS: Record<string, string> = {
  comment_on_post: "commented on your post",
  reaction_on_post: "reacted to your post",
  prayer_reaction: "is praying for your post",
  group_join: "joined your group",
  mention: "mentioned you",
  new_post_in_group: "posted in a group you follow",
};

interface Props {
  userId: string;
  initialNotifications: NotificationItem[];
  initialUnread: number;
}

export default function NotificationBell({ userId, initialNotifications, initialUnread }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-user-${userId}`);
    channel.bind("notification", () => {
      setUnread((n) => n + 1);
      // Reload page notifications on next open — keep it simple
    });
    return () => {
      pusher.unsubscribe(`private-user-${userId}`);
    };
  }, [userId]);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      setUnread(0);
      setNotifications((n) => n.map((item) => ({ ...item, isRead: true })));
      startTransition(() => void markNotificationsRead());
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
              <Link
                href="/social/notifications"
                className="text-xs text-[#af601a] hover:underline"
                onClick={() => setOpen(false)}
              >
                See all
              </Link>
            </div>

            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>No notifications yet</p>
                <p className="text-xs mt-1 text-gray-300">
                  &ldquo;Be still, and know that I am God.&rdquo; — Ps 46:10
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {notifications.slice(0, 10).map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "px-4 py-3 text-sm",
                      !n.isRead && "bg-[#af601a]/5"
                    )}
                  >
                    <p className="text-gray-800">
                      {n.actorName && <span className="font-semibold">{n.actorName} </span>}
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
        </>
      )}
    </div>
  );
}
