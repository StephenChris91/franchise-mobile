import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, serviceReminders } from "@franchise/db";
import { ok, err, withApproved } from "@/lib/api/middleware";
import { z } from "zod";

export const dynamic = "force-dynamic";

const SERVICE_TYPES = ["sunday_youtube", "wednesday_youtube", "friday_zoom"] as const;

const setSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES),
  isActive: z.boolean(),
  minutesBefore: z.number().int().min(5).max(60).optional(),
});

export async function GET(req: NextRequest) {
  return withApproved(req, async (_, user) => {
    const rows = await db
      .select()
      .from(serviceReminders)
      .where(eq(serviceReminders.userId, user.sub));

    return ok(
      rows.map((r) => ({
        serviceType: r.serviceType,
        isActive: r.isActive,
        minutesBefore: r.minutesBefore,
      }))
    );
  });
}

export async function POST(req: NextRequest) {
  return withApproved(req, async (req, user) => {
    let body: unknown;
    try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

    const parsed = setSchema.safeParse(body);
    if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

    const { serviceType, isActive, minutesBefore = 15 } = parsed.data;

    await db
      .insert(serviceReminders)
      .values({ userId: user.sub, serviceType, isActive, minutesBefore })
      .onConflictDoUpdate({
        target: [serviceReminders.userId, serviceReminders.serviceType],
        set: { isActive, minutesBefore },
      });

    return ok({ serviceType, isActive, minutesBefore });
  });
}
