import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiKeyGuard } from './api-key.guard';

function contextWithHeader(headerValue: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        header: (name: string) =>
          name === 'x-api-key' ? headerValue : undefined,
      }),
    }),
  } as unknown as ExecutionContext;
}

function configWithApiKey(apiKey: string): ConfigService {
  return { getOrThrow: () => apiKey } as unknown as ConfigService;
}

describe('ApiKeyGuard', () => {
  it('allows a request with the correct key', () => {
    const guard = new ApiKeyGuard(configWithApiKey('secret'));
    expect(guard.canActivate(contextWithHeader('secret'))).toBe(true);
  });

  it('rejects a request with the wrong key', () => {
    const guard = new ApiKeyGuard(configWithApiKey('secret'));
    expect(() => guard.canActivate(contextWithHeader('wrong'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a request with no key header at all', () => {
    const guard = new ApiKeyGuard(configWithApiKey('secret'));
    expect(() => guard.canActivate(contextWithHeader(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
