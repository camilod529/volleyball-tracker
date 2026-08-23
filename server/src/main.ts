import { NestFactory } from '@nestjs/core';
import { json } from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Express's default JSON body limit is 100kb — a /sync/push payload for a
  // semi-complete match (many actionEvents rows, each with a full column
  // set) exceeds that easily, causing a 413 before the request even reaches
  // the controller.
  app.use(json({ limit: '10mb' }));
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
