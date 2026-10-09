import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { createOpaqueToken } from '../common/utils/crypto.util';
import {
  CreateOrderDto,
  OrdersQueryDto,
  UpdateOrderStatusDto,
} from './order.dto';
import { OrdersService } from './orders.service';

type RequestWithCookies = Request & { cookies?: Record<string, unknown> };

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async checkout(
    @Body() body: CreateOrderDto,
    @CurrentUser() user: AuthUser | undefined,
    @Headers('idempotency-key') key: string | undefined,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Record<string, unknown>> {
    const cookieName = this.config.get<string>(
      'CART_COOKIE_NAME',
      'bootyard_cart',
    );
    const rawGuestSessionId: unknown = request.cookies?.[cookieName];
    let guestSessionId =
      typeof rawGuestSessionId === 'string' ? rawGuestSessionId : undefined;
    if (!user && typeof guestSessionId !== 'string') {
      guestSessionId = createOpaqueToken();
      response.cookie(cookieName, guestSessionId, {
        httpOnly: true,
        secure: this.config.get<boolean>('COOKIE_SECURE', false),
        sameSite: 'lax',
        path: '/api/v1',
        maxAge: 90 * 24 * 60 * 60 * 1000,
      });
    }
    const result = await this.orders.checkout(
      body,
      { userId: user?.id, guestSessionId: String(guestSessionId ?? '') },
      key,
    );
    if (result.replayed) response.status(HttpStatus.OK);
    const order = result.order;
    if (typeof order.orderNo === 'string')
      response.location(`/api/v1/orders/${order.orderNo}`);
    return {
      order,
      ...(result.guestAccessToken
        ? {
            guestAccessToken: result.guestAccessToken,
            guestAccessExpiresAt: result.guestAccessExpiresAt,
          }
        : {}),
    };
  }

  @Get(':orderNo')
  @UseGuards(OptionalJwtAuthGuard)
  async get(
    @Param('orderNo') orderNo: string,
    @CurrentUser() user: AuthUser | undefined,
    @Headers('x-guest-order-token') guestToken: string | undefined,
  ): Promise<{ order: Record<string, unknown> }> {
    return { order: await this.orders.get(orderNo, user?.id, guestToken) };
  }
}

@Controller('users/me/orders')
@UseGuards(JwtAuthGuard)
export class CustomerOrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get() list(
    @CurrentUser() user: AuthUser,
    @Query() query: OrdersQueryDto,
  ): Promise<unknown> {
    return this.orders.listForCustomer(user.id, query);
  }
}

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get() list(@Query() query: OrdersQueryDto): Promise<unknown> {
    return this.orders.listAdmin(query);
  }
  @Get(':orderNo') async get(
    @Param('orderNo') orderNo: string,
  ): Promise<{ order: Record<string, unknown> }> {
    return { order: await this.orders.adminGet(orderNo) };
  }
  @Patch(':orderNo') async update(
    @Param('orderNo') orderNo: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateOrderStatusDto,
  ): Promise<{ order: Record<string, unknown> }> {
    return { order: await this.orders.updateStatus(orderNo, user.id, body) };
  }
}

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DashboardController {
  constructor(private readonly orders: OrdersService) {}
  @Get('overview') async overview(): Promise<Record<string, unknown>> {
    return this.orders.overview();
  }
}
