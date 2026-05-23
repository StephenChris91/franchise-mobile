import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, users, profiles } from "@franchise/db";
import { signupSchema } from "@franchise/validators";
import { ok, err } from "@/lib/api/middleware";
import { sendAdminNotification } from "@/lib/email";

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return err("BAD_REQUEST", "Invalid JSON", 400); }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return err("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);

  const { fullName, username, email, password } = parsed.data;

  const [existingEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existingEmail) return err("CONFLICT", "An account with this email already exists", 409);

  const [existingUsername] = await db.select({ userId: profiles.userId }).from(profiles).where(eq(profiles.username, username)).limit(1);
  if (existingUsername) return err("CONFLICT", "This username is already taken", 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = crypto.randomUUID();

  await db.insert(users).values({ id: userId, name: fullName, email, passwordHash });
  await db.insert(profiles).values({ userId, username, fullName, approvalStatus: "pending", role: "member", ministry: "none" });

  sendAdminNotification({ fullName, email, username }).catch(() => {});

  return ok({ message: "Account created. Awaiting admin approval.", user: { id: userId, email, username } }, 201);
}
