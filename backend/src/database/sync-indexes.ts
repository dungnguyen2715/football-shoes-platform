import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { AppModule } from '../app.module';

async function syncIndexes(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const logger = new Logger('DatabaseIndexSync');

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const results = await Promise.all(
      connection.modelNames().map(async (modelName) => {
        const droppedIndexes = await connection.model(modelName).syncIndexes();
        return { modelName, droppedIndexes };
      }),
    );
    for (const result of results) {
      logger.log(
        `${result.modelName}: synchronized indexes` +
          (result.droppedIndexes.length
            ? `; dropped ${result.droppedIndexes.join(', ')}`
            : ''),
      );
    }
  } finally {
    await app.close();
  }
}

syncIndexes().catch((error: unknown) => {
  console.error('Database index synchronization failed', error);
  process.exitCode = 1;
});
