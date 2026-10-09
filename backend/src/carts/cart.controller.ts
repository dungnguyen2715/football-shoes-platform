import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { createOpaqueToken } from '../common/utils/crypto.util';
import { AddCartItemDto } from './cart.dto';
import { CartService } from './cart.service';

type RequestWithCookies = Request & { cookies?: Record<string, unknown> };

@Controller('carts')
export class CartController {
  constructor(
    private readonly carts: CartService,
    private readonly config: ConfigService,
  ) {}

  @Post('guest-session')
  async guestSession(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ cart: Record<string, unknown> }> {
    if (this.getGuestId(request)) response.status(HttpStatus.OK);
    const { sessionId } = this.ensureGuestCookie(request, response);
    return { cart: await this.carts.current(undefined, sessionId) };
  }

  @Get('current')
  @UseGuards(OptionalJwtAuthGuard)
  async current(
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: RequestWithCookies,
  ): Promise<{ cart: Record<string, unknown> }> {
    return { cart: await this.carts.current(user, this.getGuestId(request)) };
  }

  @Post('current/items')
  @UseGuards(OptionalJwtAuthGuard)
  async add(
    @Body() body: AddCartItemDto,
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ cart: Record<string, unknown> }> {
    const guest = user
      ? undefined
      : this.ensureGuestCookie(request, response).sessionId;
    const result = await this.carts.add(user, guest, body);
    if (!result.created) response.status(HttpStatus.OK);
    return { cart: result.cart };
  }

  @Delete('current/items/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async remove(
    @Param('productId') id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: RequestWithCookies,
  ): Promise<Record<string, unknown>> {
    return this.carts.remove(user, this.getGuestId(request), id);
  }

  @Delete('current')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async clear(
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: RequestWithCookies,
  ): Promise<void> {
    await this.carts.clear(user, this.getGuestId(request));
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  async merge(
    @CurrentUser() user: AuthUser,
    @Req() request: RequestWithCookies,
  ): Promise<Record<string, unknown>> {
    return this.carts.merge(user, this.getGuestId(request));
  }

  private getGuestId(request: RequestWithCookies): string | undefined {
    const value: unknown =
      request.cookies?.[
        this.config.get<string>('CART_COOKIE_NAME', 'bootyard_cart')
      ];
    return typeof value === 'string' ? value : undefined;
  }
  private ensureGuestCookie(
    request: RequestWithCookies,
    response: Response,
  ): { sessionId: string } {
    const existing = this.getGuestId(request);
    if (existing) return { sessionId: existing };
    const sessionId = createOpaqueToken();
    response.cookie(
      this.config.get<string>('CART_COOKIE_NAME', 'bootyard_cart'),
      sessionId,
      {
        httpOnly: true,
        secure: this.config.get<boolean>('COOKIE_SECURE', false),
        sameSite: 'lax',
        path: '/api/v1',
        maxAge: 90 * 86400000,
      },
    );
    return { sessionId };
  }
}
