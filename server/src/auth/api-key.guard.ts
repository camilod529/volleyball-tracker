import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Single shared static API key, per docs/SYNC_PROTOCOL.md's auth model —
 * no per-user accounts. Every request needs `X-API-Key: <API_KEY env var>`.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-api-key');
    const expected = this.config.getOrThrow<string>('API_KEY');

    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Missing or invalid API key');
    }
    return true;
  }
}
