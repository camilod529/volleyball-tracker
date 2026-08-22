import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import * as schema from './schema';

export const DB = Symbol('DB');

function createDb(databaseUrl: string) {
  const pool = mysql.createPool(databaseUrl);
  return drizzle(pool, { schema, mode: 'default' });
}

export type Db = ReturnType<typeof createDb>;

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DB,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Db =>
        createDb(config.getOrThrow<string>('DATABASE_URL')),
    },
  ],
  exports: [DB],
})
export class DbModule {}
