"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { db, profiles } from "../../../db";

const editSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z
    .string()
    .max(500, "Bio must be under 500 characters")
    .optional()
    .nullable(),
  ministry: z.enum([
    "none","choir","ushers","prayer_team","media","kids","youth","adults","other",
  ]),
  phone: z
    .string()
    .regex(/^(\+234|0)[7-9][0-1]\d{8}$/, "Enter a valid Nigerian phone number")
    .optional()
    .nullable()
    .or(z.literal("")),
  whatsappNumber: z
    .string()
    .regex(/^(\+234|0)[7-9][0-1]\d{8}$/, "Enter a valid Nigerian phone number")
    .optional()
    .nullable()
    .or(z.literal("")),
  photoUrl: z.string().url().optional().nullable(),
});

export type ProfileEditInput = z.infer<typeof editSchema>;

export async function updateProfileAction(data: ProfileEditInput) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = editSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { fullName, bio, ministry, phone, whatsappNumber, photoUrl } = parsed.data;

  await db
    .update(profiles)
    .set({
      fullName,
      bio: bio || null,
      ministry,
      phone: phone || null,
      whatsappNumber: whatsappNumber || null,
      photoUrl: photoUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.user.id));

  revalidatePath("/profile");
  revalidatePath("/profile/edit");

  return { success: true };
}
