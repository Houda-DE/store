import { z } from 'zod';

export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().min(1, 'Description is required'),
  price: z.preprocess((v) => parseFloat(String(v)), z.number().positive('Price must be positive')),
});

export const UpdateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  price: z.preprocess((v) => parseFloat(String(v)), z.number().positive()).optional(),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
