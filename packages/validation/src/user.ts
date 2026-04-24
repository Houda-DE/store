import { z } from 'zod';

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  cityId: z.number().int().positive('City must be a valid city id').optional(),
  role: z.enum(['seller', 'customer']).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;