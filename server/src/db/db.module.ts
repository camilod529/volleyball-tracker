import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

import {
  resolveDbConnectionConfig,
  type DbConnectionConfig,
} from './connection-config';
import * as schema from './schema';

export const DB = Symbol('DB');

function createDb(config: DbConnectionConfig) {
  // mysql2's overloads don't resolve against a union type directly — the
  // typeof branch (same call either way) narrows config for TS.
  const pool =
    typeof config === 'string'
      ? mysql.createPool(config)
      : mysql.createPool(config);
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
        createDb(resolveDbConnectionConfig((key) => config.get<string>(key))),
    },
  ],
  exports: [DB],
})
export class DbModule {}
