import { Module } from '@nestjs/common';
import {
  AdminOrdersController,
  CustomerOrdersController,
  DashboardController,
  OrdersController,
} from './orders.controller';
import { OrdersService } from './orders.service';
import { ExpiredOrderCleanupService } from './expired-order-cleanup.service';

@Module({
  controllers: [
    OrdersController,
    CustomerOrdersController,
    AdminOrdersController,
    DashboardController,
  ],
  providers: [OrdersService, ExpiredOrderCleanupService],
  exports: [OrdersService],
})
export class OrdersModule {}
