"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users, profiles, passwordResetTokens } from "../../../db";
import { sendAdminNotification, sendPasswordResetEmail } from "../email";
import { signIn } from "../../../auth";
import { redirect } from "next/navigation";
import crypto from "crypto";

// ─── Signup ───────────────────────────────────────────────────────────────────

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Username may only contain lowercase letters, numbers, and hyphens"
      ),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export async function signupAction(data: SignupInput) {
  const parsed = signupSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullName, username, email, password } = parsed.data;

  // Check existing email
  const existingEmail = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0]);

  if (existingEmail) {
    return { error: "An account with this email already exists." };
  }

  // Check existing username
  const existingUsername = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1)
    .then((r) => r[0]);

  if (existingUsername) {
    return { error: "This username is already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = crypto.randomUUID();

  await db.insert(users).values({
    id: userId,
    name: fullName,
    email,
    passwordHash,
  });

  await db.insert(profiles).values({
    userId,
    username,
    fullName,
    approvalStatus: "pending",
    role: "member",
    ministry: "none",
  });

  // Fire-and-forget admin notification (don't block signup on email failure)
  sendAdminNotification({ fullName, email, username }).catch(console.error);

  return { success: true };
}

// ─── Forgot password ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(email: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0]);

  // Always return success to avoid user enumeration
  if (!user) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expires,
  });

  await sendPasswordResetEmail({
    to: email,
    fullName: user.name ?? "Member",
    token,
  }).catch(console.error);

  return { success: true };
}

// ─── Reset password ───────────────────────────────────────────────────────────

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(data: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = resetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { token, password } = parsed.data;

  const record = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1)
    .then((r) => r[0]);

  if (!record || record.used || record.expires < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, record.userId));

  await db
    .update(passwordResetTokens)
    .set({ used: true })
    .where(eq(passwordResetTokens.id, record.id));

  return { success: true };
}
