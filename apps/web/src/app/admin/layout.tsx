import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "../../../auth";
import {
  LayoutDashboard, Users, Flag, Megaphone, Calendar,
  Users2, ClipboardList, FileText, ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/events", label: "Events", icon: Calendar },
  { href: "/admin/groups", label: "Groups", icon: Users2 },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/audit", label: "Audit Log", icon: ClipboardList, pastorOnly: true },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "pastor") redirect("/");

  const isPastor = role === "pastor";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#1b1b1b] min-h-screen flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Admin</p>
          <p className="text-white font-bold text-lg mt-0.5">Franchise</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems
            .filter((item) => !item.pastorOnly || isPastor)
            .map((item) => (
              <AdminNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <Link
            href="/social"
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition"
          >
            <ChevronRight size={12} />
            Back to Community
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

function AdminNavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  // We use a client component for active state
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition group"
    >
      <Icon size={16} className="shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
