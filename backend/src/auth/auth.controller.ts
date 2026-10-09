import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService, TokenBundle } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<TokenBundle, 'refreshToken'>> {
    return this.setRefreshCookie(response, await this.auth.register(dto));
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<TokenBundle, 'refreshToken'>> {
    return this.setRefreshCookie(response, await this.auth.login(dto));
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<TokenBundle, 'refreshToken' | 'user'>> {
    const cookieName = this.config.get<string>(
      'REFRESH_COOKIE_NAME',
      'bootyard_refresh',
    );
    const result = await this.auth.refresh(
      request.cookies?.[cookieName] as string | undefined,
    );
    response.cookie(
      cookieName,
      result.refreshToken,
      this.refreshCookieOptions(),
    );
    return { accessToken: result.accessToken, expiresIn: result.expiresIn };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const cookieName = this.config.get<string>(
      'REFRESH_COOKIE_NAME',
      'bootyard_refresh',
    );
    await this.auth.logout(request.cookies?.[cookieName] as string | undefined);
    response.clearCookie(cookieName, this.refreshCookieOptions());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() user: AuthUser,
  ): Promise<{ user: Record<string, unknown> }> {
    return { user: await this.auth.getCurrentUser(user.id) };
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.auth.requestPasswordReset(dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto);
  }

  private setRefreshCookie(
    response: Response,
    result: TokenBundle,
  ): Omit<TokenBundle, 'refreshToken'> {
    const cookieName = this.config.get<string>(
      'REFRESH_COOKIE_NAME',
      'bootyard_refresh',
    );
    response.cookie(
      cookieName,
      result.refreshToken,
      this.refreshCookieOptions(),
    );
    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  private refreshCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
    domain?: string;
  } {
    const domain = this.config.get<string>('COOKIE_DOMAIN');
    return {
      httpOnly: true,
      secure: this.config.get<boolean>('COOKIE_SECURE', false),
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge:
        this.config.get<number>('JWT_REFRESH_TTL_SECONDS', 2592000) * 1000,
      ...(domain ? { domain } : {}),
    };
  }
}
