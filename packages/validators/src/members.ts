import { z } from "zod";

export const listMembersSchema = z.object({
  search: z.string().optional(),
  ministry: z.enum(["none", "choir", "ushers", "prayer_team", "media", "kids", "youth", "adults", "other"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type ListMembersInput = z.infer<typeof listMembersSchema>;
