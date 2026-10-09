import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrdersService } from '../orders/orders.service';
import { AnalyticsQueryDto } from './analytics-query.dto';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnalyticsController {
  constructor(private readonly orders: OrdersService) {}
  @Get() analytics(
    @Query() query: AnalyticsQueryDto,
  ): Promise<Record<string, unknown>> {
    return this.orders.analytics(
      query.from,
      query.to,
      query.groupBy,
      query.limit,
    );
  }
}
