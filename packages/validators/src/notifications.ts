import { z } from "zod";

export const listNotificationsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
  deviceName: z.string().max(100).optional(),
});

export type PushTokenInput = z.infer<typeof pushTokenSchema>;
