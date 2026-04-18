import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((err) => {
          const path = err.path.join('.');
          return path ? `${path}: ${err.message}` : err.message;
        });

        throw new BadRequestException(messages);
      }

      throw new BadRequestException('Validation failed');
    }
  }
}