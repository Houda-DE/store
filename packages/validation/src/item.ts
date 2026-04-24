import { z } from 'zod';

const deliveryCityIds = z.preprocess(
  (v) => {
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return []; }
    }
    return v;
  },
  z.array(z.number().int().positive()).min(1, 'At least one delivery city is required'),
);

export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().min(1, 'Description is required'),
  price: z.preprocess((v) => parseFloat(String(v)), z.number().positive('Price must be positive')),
  deliveryCityIds,
});

export const UpdateItemSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  price: z.preprocess((v) => parseFloat(String(v)), z.number().positive()).optional(),
  deliveryCityIds: deliveryCityIds.optional(),
});

export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
