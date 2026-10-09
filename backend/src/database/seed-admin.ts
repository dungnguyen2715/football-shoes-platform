import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { User } from './schemas/user.schema';
import { sha256 } from '../common/utils/crypto.util';

async function seedAdmin(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const config = app.get(ConfigService);
    const email = config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const password = config.get<string>('ADMIN_PASSWORD');
    if (!email || !password || password.length < 12) {
      throw new Error(
        'Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in backend/.env first.',
      );
    }
    const users = app.get<Model<User>>(getModelToken(User.name));
    const existing = await users.findOne({ email });
    const passwordHash = await bcrypt.hash(
      sha256('bootyard-password:' + password),
      config.get<number>('BCRYPT_ROUNDS', 12),
    );
    if (existing) {
      existing.role = 'admin';
      existing.status = 'active';
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log('Admin account updated: ' + email);
    } else {
      await users.create({
        email,
        passwordHash,
        role: 'admin',
        status: 'active',
        profile: { name: 'Bootyard Admin' },
      });
      console.log('Admin account created: ' + email);
    }
  } finally {
    await app.close();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'Admin bootstrap failed',
  );
  process.exitCode = 1;
});
