import { z } from 'zod';

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;