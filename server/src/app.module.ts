import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { DbModule } from './db/db.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DbModule, SyncModule],
  controllers: [AppController],
})
export class AppModule {}
