import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { AnalyticsController } from './analytics.controller';

@Module({ imports: [OrdersModule], controllers: [AnalyticsController] })
export class AnalyticsModule {}
