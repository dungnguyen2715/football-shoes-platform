import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './carts/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { CustomersModule } from './customers/customers.module';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { DatabaseModule } from './database/database.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { WishlistItemsModule } from './wishlist-items/wishlist-items.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';

const envValidation = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  MONGODB_URI: Joi.string().uri().default('mongodb://127.0.0.1:27017/bootyard'),
  MONGOOSE_AUTO_INDEX: Joi.boolean()
    .truthy('true')
    .falsy('false')
    .default(false),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().min(60).default(900),
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().min(3600).default(2592000),
  CORS_ORIGINS: Joi.string().default(
    'http://localhost:8080,http://localhost:8081',
  ),
  COOKIE_SECURE: Joi.boolean().truthy('true').falsy('false').default(false),
  CART_COOKIE_NAME: Joi.string().default('bootyard_cart'),
  REFRESH_COOKIE_NAME: Joi.string().default('bootyard_refresh'),
  COOKIE_DOMAIN: Joi.string().allow('').optional(),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:8080'),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  ORDER_RESERVATION_TTL_HOURS: Joi.number()
    .integer()
    .min(24)
    .max(72)
    .default(48),
  ADMIN_EMAIL: Joi.string().email().lowercase().empty('').optional(),
  ADMIN_PASSWORD: Joi.string().min(12).empty('').optional(),
  SMTP_HOST: Joi.string().empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASSWORD: Joi.string().empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_FROM: Joi.string().empty('').when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
}).unknown(true);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config) => {
        const result = envValidation.validate(config, {
          abortEarly: false,
          allowUnknown: true,
        });
        if (result.error) throw result.error;
        return result.value as Record<string, unknown>;
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        autoIndex: config.get<boolean>('MONGOOSE_AUTO_INDEX', false),
        serverSelectionTimeoutMS: 5000,
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    CommonModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    CartModule,
    WishlistItemsModule,
    SettingsModule,
    ReviewsModule,
    CustomersModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
