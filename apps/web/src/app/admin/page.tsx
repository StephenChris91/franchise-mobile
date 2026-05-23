import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { Users, Flag, FileText, TrendingUp, TrendingDown, Minus, Plus } from "lucide-react";
import { auth } from "../../../auth";
import {
  getAdminStats,
  getRecentActivity,
  getMemberChartData,
  getPostChartData,
  getTopGroups,
} from "@/lib/admin";
import AdminCharts from "@/components/admin/AdminCharts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Dashboard — Franchise Church" };

function StatCard({
  label,
  value,
  delta,
  href,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  delta?: number;
  href?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}) {
  const card = (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-sm transition">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value.toLocaleString()}</p>
        {delta !== undefined && (
          <p className={`text-xs mt-1 flex items-center gap-0.5 ${delta > 0 ? "text-green-600" : delta < 0 ? "text-red-500" : "text-gray-400"}`}>
            {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
            {delta > 0 ? "+" : ""}{delta} vs last week
          </p>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function AdminDashboardPage() {
  const session = await auth();

  const [stats, activity, memberChart, postChart, topGroups] = await Promise.all([
    getAdminStats(),
    getRecentActivity(),
    getMemberChartData(),
    getPostChartData(),
    getTopGroups(),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, {session?.user?.name}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Members"
          value={stats.totalMembers}
          delta={stats.newMembersDelta}
          href="/admin/members?status=approved"
          icon={Users}
          color="bg-[#af601a]"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingApprovals}
          href="/admin/members?status=pending"
          icon={Users}
          color={stats.pendingApprovals > 0 ? "bg-amber-500" : "bg-gray-400"}
        />
        <StatCard
          label="Pending Reports"
          value={stats.pendingReports}
          href="/admin/reports"
          icon={Flag}
          color={stats.pendingReports > 0 ? "bg-red-500" : "bg-gray-400"}
        />
        <StatCard
          label="Posts This Week"
          value={stats.postsThisWeek}
          delta={stats.postsDelta}
          icon={FileText}
          color="bg-blue-500"
        />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/members?status=pending"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
          >
            <Users size={12} />
            {stats.pendingApprovals > 0 ? `Approve ${stats.pendingApprovals} member${stats.pendingApprovals > 1 ? "s" : ""}` : "Member approvals"}
          </Link>
          {stats.pendingReports > 0 && (
            <Link
              href="/admin/reports"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition"
            >
              <Flag size={12} />
              {stats.pendingReports} pending report{stats.pendingReports > 1 ? "s" : ""}
            </Link>
          )}
          <Link
            href="/admin/announcements"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[#af601a]/10 text-[#af601a] hover:bg-[#af601a]/20 transition"
          >
            <Plus size={12} />
            Post announcement
          </Link>
          <Link
            href="/admin/events/new"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
          >
            <Plus size={12} />
            Create event
          </Link>
        </div>
      </div>

      {/* Charts + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <AdminCharts memberData={memberChart} postData={postChart} />
        </div>

        {/* Top groups */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Top Groups</h2>
          <div className="space-y-3">
            {topGroups.map((g) => (
              <div key={g.id} className="flex items-center justify-between">
                <p className="text-sm text-gray-800 truncate mr-2">{g.name}</p>
                <span className="text-xs text-gray-400 shrink-0">{g.memberCount} members</span>
              </div>
            ))}
            {topGroups.length === 0 && <p className="text-xs text-gray-400">No groups yet</p>}
          </div>
          <Link href="/admin/groups" className="text-xs text-[#af601a] hover:underline mt-4 block">
            Manage groups →
          </Link>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Sign-ups</h2>
          <div className="space-y-2">
            {activity.recentMembers.map((m) => (
              <div key={m.username} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{m.fullName}</p>
                  <p className="text-xs text-gray-400">@{m.username}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  m.approvalStatus === "approved" ? "bg-green-100 text-green-700" :
                  m.approvalStatus === "pending" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {m.approvalStatus}
                </span>
              </div>
            ))}
            {activity.recentMembers.length === 0 && <p className="text-xs text-gray-400">No new sign-ups in 3 days</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Posts</h2>
          <div className="space-y-2">
            {activity.recentPosts.map((p) => (
              <div key={p.id} className="text-sm">
                <p className="text-gray-900 truncate">{p.authorName}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="capitalize">{p.postType}</span>
                  <span>·</span>
                  <span>{format(new Date(p.createdAt), "d MMM HH:mm")}</span>
                </p>
              </div>
            ))}
            {activity.recentPosts.length === 0 && <p className="text-xs text-gray-400">No posts in 3 days</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Reports</h2>
          <div className="space-y-2">
            {activity.recentReports.map((r) => (
              <div key={r.id} className="text-sm">
                <p className="text-gray-900 capitalize">{r.reason}</p>
                <p className="text-xs text-gray-400">by {r.reporterName} · {format(new Date(r.createdAt), "d MMM")}</p>
              </div>
            ))}
            {activity.recentReports.length === 0 && <p className="text-xs text-gray-400">No reports in 3 days</p>}
          </div>
          {activity.recentReports.length > 0 && (
            <Link href="/admin/reports" className="text-xs text-red-600 hover:underline mt-3 block">
              Review reports →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
