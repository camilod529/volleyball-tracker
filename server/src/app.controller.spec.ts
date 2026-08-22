import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get(AppController);
  });

  it('returns ok status with a timestamp', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(new Date(result.time).toString()).not.toBe('Invalid Date');
  });
});
