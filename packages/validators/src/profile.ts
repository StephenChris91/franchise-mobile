import { z } from "zod";

const nigerianPhone = z
  .string()
  .regex(/^(\+234|0)[7-9][0-1]\d{8}$/, "Enter a valid Nigerian phone number")
  .optional()
  .nullable()
  .or(z.literal(""));

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional().nullable(),
  ministry: z.enum(["none", "choir", "ushers", "prayer_team", "media", "kids", "youth", "adults", "other"]),
  phone: nigerianPhone,
  whatsappNumber: nigerianPhone,
  photoUrl: z.string().url().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
