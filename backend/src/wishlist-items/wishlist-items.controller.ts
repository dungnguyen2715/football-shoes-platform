import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
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
import { AddWishlistItemDto, WishlistQueryDto } from './wishlist.dto';
import { WishlistItemsService } from './wishlist-items.service';

type RequestWithCookies = Request & { cookies?: Record<string, unknown> };
@Controller('wishlist-items')
export class WishlistItemsController {
  constructor(
    private readonly wishlist: WishlistItemsService,
    private readonly config: ConfigService,
  ) {}
  @Get() @UseGuards(OptionalJwtAuthGuard) list(
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: RequestWithCookies,
    @Query() query: WishlistQueryDto,
  ): Promise<Record<string, unknown>> {
    return this.wishlist.list(
      user,
      this.guestId(request),
      query.limit,
      query.cursor,
    );
  }
  @Post() @UseGuards(OptionalJwtAuthGuard) async add(
    @Body() body: AddWishlistItemDto,
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Record<string, unknown>> {
    const guestId = user ? undefined : this.ensureGuest(request, response);
    const result = await this.wishlist.add(user, guestId, body.productId);
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return { item: result.item };
  }
  @Delete(':productId')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('productId') id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Req() request: RequestWithCookies,
  ): Promise<void> {
    await this.wishlist.remove(user, this.guestId(request), id);
  }
  @Post('merge') @UseGuards(JwtAuthGuard) async merge(
    @CurrentUser() user: AuthUser,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ mergedCount: number }> {
    const merged = await this.wishlist.merge(user, this.guestId(request));
    response.clearCookie(
      this.config.get<string>('CART_COOKIE_NAME', 'bootyard_cart'),
      {
        httpOnly: true,
        secure: this.config.get<boolean>('COOKIE_SECURE', false),
        sameSite: 'lax',
        path: '/api/v1',
      },
    );
    return merged;
  }
  private guestId(request: RequestWithCookies): string | undefined {
    const value: unknown =
      request.cookies?.[
        this.config.get<string>('CART_COOKIE_NAME', 'bootyard_cart')
      ];
    return typeof value === 'string' ? value : undefined;
  }
  private ensureGuest(request: RequestWithCookies, response: Response): string {
    const existing = this.guestId(request);
    if (existing) return existing;
    const value = createOpaqueToken();
    response.cookie(
      this.config.get<string>('CART_COOKIE_NAME', 'bootyard_cart'),
      value,
      {
        httpOnly: true,
        secure: this.config.get<boolean>('COOKIE_SECURE', false),
        sameSite: 'lax',
        path: '/api/v1',
        maxAge: 90 * 86400000,
      },
    );
    return value;
  }
}
