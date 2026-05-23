"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Compass,
  HandHeart,
  Bell,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Group } from "../../../db/schema";

const NAV_ITEMS = [
  { label: "Feed", href: "/social", icon: LayoutDashboard, exact: true },
  { label: "My Groups", href: "/social/groups", icon: Users },
  { label: "Discover", href: "/social/groups?discover=1", icon: Compass },
  { label: "Prayer Wall", href: "/social/prayer-wall", icon: HandHeart },
  { label: "Members", href: "/social/members", icon: Users },
  { label: "Announcements", href: "/social?type=announcement", icon: Megaphone },
];

interface Props {
  children: React.ReactNode;
  joinedGroups?: Pick<Group, "id" | "slug" | "name">[];
  rightSidebar?: React.ReactNode;
}

export default function SocialLayout({ children, joinedGroups = [], rightSidebar }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f5f3f0]">
      {/* Desktop three-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-6">
        {/* Left sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-1">
            <nav className="bg-white rounded-2xl shadow-sm p-3 space-y-0.5">
              {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href.split("?")[0]);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      active
                        ? "bg-[#af601a]/10 text-[#af601a]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {joinedGroups.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  My Groups
                </p>
                {joinedGroups.slice(0, 8).map((g) => (
                  <Link
                    key={g.id}
                    href={`/social/groups/${g.slug}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
                      pathname === `/social/groups/${g.slug}`
                        ? "bg-[#af601a]/10 text-[#af601a]"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#af601a] to-[#e8913a] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {g.name[0]}
                    </span>
                    <span className="truncate">{g.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center content */}
        <main className="min-w-0 pb-20 lg:pb-0">{children}</main>

        {/* Right sidebar */}
        {rightSidebar && (
          <aside className="hidden lg:block">
            <div className="sticky top-6">{rightSidebar}</div>
          </aside>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around py-2 lg:hidden">
        {NAV_ITEMS.slice(0, 5).map(({ label, href, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href.split("?")[0]);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                active ? "text-[#af601a]" : "text-gray-500"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
