import { z } from 'zod';

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  cityId: z.number().int().positive('City must be a valid city id').optional(),
  role: z.enum(['seller', 'customer']).optional(),
});

export const UpdateDeliveryCitiesSchema = z.object({
  cityIds: z
    .array(z.number().int().positive())
    .min(1, 'At least one delivery city is required'),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateDeliveryCitiesInput = z.infer<typeof UpdateDeliveryCitiesSchema>;