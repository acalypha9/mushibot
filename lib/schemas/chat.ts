import { z } from "zod";

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(4000, "Message is too long (max 4000 chars)"),
});

export type ChatMessageFormValues = z.infer<typeof chatMessageSchema>;
