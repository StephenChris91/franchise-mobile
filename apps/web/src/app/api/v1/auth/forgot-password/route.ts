import { NextRequest } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, users, passwordResetTokens } from "@franchise/db";
import { forgotPasswordSchema } from "@franchise/validators";
import { ok, err } from "@/lib/api/middleware";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const { email } = parsed.data;

  // Always return success to prevent user enumeration
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({ userId: user.id, token, expires });
    sendPasswordResetEmail({ to: email, fullName: user.name ?? "Member", token }).catch(() => {});
  }

  return ok({ message: "If an account exists with that email, a reset link has been sent." });
}
