import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().max(30),
});

export type ProfileInput = z.infer<typeof profileSchema>;
