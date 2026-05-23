import { NextResponse } from "next/server";
import { db, users, profiles } from "../../../../../db";
import { and, eq, inArray } from "drizzle-orm";
import { getWeeklyDigestData } from "@/lib/admin";
import { sendWeeklyDigest } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getWeeklyDigestData();

    // Send digest to pastoral team (pastor + admin roles)
    const recipients = await db
      .select({
        email: users.email,
        fullName: profiles.fullName,
      })
      .from(users)
      .innerJoin(profiles, eq(users.id, profiles.userId))
      .where(
        and(
          eq(profiles.approvalStatus, "approved"),
          inArray(profiles.role, ["admin", "pastor"])
        )
      );

    const pastoralEmails = recipients.filter((r) => r.email);

    if (pastoralEmails.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: "No recipients found" });
    }

    // Send digest to each recipient
    const sends = pastoralEmails.map((r) =>
      sendWeeklyDigest({
        to: r.email!,
        newMembers: data.newMembers,
        postsCount: data.postsCount,
        pendingReports: data.pendingReports,
        topGroups: data.topGroups,
      }).catch((err) => {
        console.error(`Failed to send digest to ${r.email}:`, err);
      })
    );

    await Promise.allSettled(sends);

    return NextResponse.json({
      ok: true,
      sent: sends.length,
    });
  } catch (err) {
    console.error("weekly-digest cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
