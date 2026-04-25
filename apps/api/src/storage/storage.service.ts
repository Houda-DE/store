import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

function validateJwt(key: string, label: string): void {
  const parts = key.trim().split('.');
  if (parts.length !== 3) {
    throw new Error(`${label} is not a valid JWT (expected 3 dot-separated parts, got ${parts.length})`);
  }
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!header.alg) throw new Error('missing "alg" field');
  } catch (e: any) {
    throw new Error(`${label} has an invalid JWT header: ${e.message}`);
  }
}

@Injectable()
export class StorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const url = config.getOrThrow<string>('SUPABASE_URL');
    const key = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY').trim();

    validateJwt(key, 'SUPABASE_SERVICE_ROLE_KEY');

    this.supabase = createClient(url, key);
    this.bucket = config.getOrThrow<string>('SUPABASE_BUCKET');
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const ext = extname(file.originalname).toLowerCase() || '.jpg';
    const path = `items/${randomUUID()}${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }
}
