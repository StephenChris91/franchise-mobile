import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users, passwordResetTokens } from "@franchise/db";
import { resetPasswordSchema } from "@franchise/validators";
import { ok, err } from "@/lib/api/middleware";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const { token, password } = parsed.data;

  const [record] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
  if (!record || record.used || record.expires < new Date()) {
    return err("BAD_REQUEST", "This reset link is invalid or has expired", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
  await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, record.id));

  return ok({ message: "Password reset successfully" });
}
