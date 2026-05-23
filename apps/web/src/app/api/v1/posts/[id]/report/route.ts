import { NextRequest } from "next/server";
import { db, contentReports } from "@franchise/db";
import { reportSchema } from "@franchise/validators";
import { ok, err, withApproved } from "@/lib/api/middleware";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withApproved(req, async (req, user) => {
    const { id } = await params;
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    await db.insert(contentReports).values({
      reporterId: user.sub,
      reportedPostId: id,
      reason: parsed.data.reason,
      notes: parsed.data.notes ?? "",
    });

    return ok({ ok: true });
  });
}
