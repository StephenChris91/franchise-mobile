"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface ChartRow { date: string; count: number }

interface Props {
  memberData: ChartRow[];
  postData: ChartRow[];
}

function fillDays(data: ChartRow[], days = 30): ChartRow[] {
  const map = new Map(data.map((r) => [r.date, Number(r.count)]));
  const result: ChartRow[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    result.push({ date: label, count: map.get(key) ?? 0 });
  }
  return result;
}

export default function AdminCharts({ memberData, postData }: Props) {
  const members = fillDays(memberData);
  const posts = fillDays(postData);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-8">
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">New Members — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={members} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#af601a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#af601a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              labelStyle={{ color: "#6b7280" }}
            />
            <Area type="monotone" dataKey="count" stroke="#af601a" strokeWidth={2} fill="url(#memberGrad)" name="New members" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Posts per Day — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={posts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="postGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              labelStyle={{ color: "#6b7280" }}
            />
            <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#postGrad)" name="Posts" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
