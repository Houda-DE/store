import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const connection = await mysql.createConnection(
          configService.get<string>('DATABASE_URL')!
        );

        return drizzle(connection, {
          schema,
          mode: 'default', 
        });
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}