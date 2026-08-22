import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { ApiKeyGuard } from '../auth/api-key.guard';
import { SyncService } from './sync.service';
import type { SyncTablesPayload } from './sync.types';

@Controller('sync')
@UseGuards(ApiKeyGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('push')
  push(@Body() body: Partial<SyncTablesPayload>) {
    return this.syncService.push(body);
  }

  @Get('pull')
  pull(@Query('since') since?: string) {
    return this.syncService.pull(since);
  }
}
