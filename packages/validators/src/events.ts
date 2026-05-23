import { z } from "zod";

export const rsvpSchema = z.object({
  status: z.enum(["going", "interested", "not_going"]),
  guestsCount: z.coerce.number().min(0).max(20).default(0),
  notes: z.string().max(500).optional(),
});

export const listEventsSchema = z.object({
  upcoming: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type ListEventsInput = z.infer<typeof listEventsSchema>;
