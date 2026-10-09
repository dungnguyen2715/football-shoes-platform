import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { HydratedDocument, Model, Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { ApiException } from '../common/api-exception';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { createOpaqueToken, sha256 } from '../common/utils/crypto.util';
import { AuthSession } from '../database/schemas/auth-session.schema';
import { PasswordResetToken } from '../database/schemas/password-reset-token.schema';
import { User } from '../database/schemas/user.schema';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';

interface RefreshClaims {
  sub: string;
  sid: string;
  familyId: string;
  jti: string;
  typ: 'refresh';
}

export interface TokenBundle {
  user: Record<string, unknown>;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(AuthSession.name)
    private readonly sessions: Model<AuthSession>,
    @InjectModel(PasswordResetToken.name)
    private readonly resetTokens: Model<PasswordResetToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenBundle> {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.users.exists({ email });
    if (exists)
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });

    const passwordHash = await bcrypt.hash(
      this.passwordDigest(dto.password),
      this.config.get<number>('BCRYPT_ROUNDS', 12),
    );
    try {
      const user = await this.users.create({
        email,
        passwordHash,
        role: 'customer',
        status: 'active',
        profile: { name: dto.name.trim(), phone: dto.phone?.trim() },
      });
      return this.createSession(user);
    } catch (error) {
      if (this.isDuplicateKey(error)) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email is already registered',
        });
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<TokenBundle> {
    const user = await this.users
      .findOne({ email: dto.email.trim().toLowerCase() })
      .select('+passwordHash');
    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(
        this.passwordDigest(dto.password),
        user.passwordHash,
      ))
    ) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }
    if (user.status !== 'active') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'This account is disabled',
      });
    }
    return this.createSession(user);
  }

  async getCurrentUser(userId: string): Promise<Record<string, unknown>> {
    const user = await this.users.findById(userId);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Account is no longer available',
      });
    }
    return this.toPublicUser(user);
  }

  async refresh(rawToken?: string): Promise<TokenBundle> {
    if (!rawToken)
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is missing',
      });

    let claims: RefreshClaims;
    try {
      claims = await this.jwt.verifyAsync<RefreshClaims>(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        algorithms: ['HS256'],
        issuer: 'bootyard-api',
        audience: 'bootyard-client',
      });
    } catch {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is invalid or expired',
      });
    }

    if (
      claims.typ !== 'refresh' ||
      !Types.ObjectId.isValid(claims.sub) ||
      !Types.ObjectId.isValid(claims.sid)
    ) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token is invalid',
      });
    }

    const session = await this.sessions
      .findById(claims.sid)
      .select('+refreshTokenHash');
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.userId.toString() !== claims.sub ||
      session.familyId !== claims.familyId
    ) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh session is no longer active',
      });
    }

    const presentedHash = sha256(rawToken);
    if (!this.constantTimeEqual(session.refreshTokenHash, presentedHash)) {
      await this.sessions.updateMany(
        { familyId: session.familyId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
      this.logger.warn(
        'Refresh token reuse detected for session family ' + session.familyId,
      );
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token reuse detected',
      });
    }

    const user = await this.users.findById(session.userId);
    if (!user || user.status !== 'active') {
      await this.sessions.updateOne(
        { _id: session._id },
        { $set: { revokedAt: new Date() } },
      );
      throw new UnauthorizedException({
        code: 'ACCOUNT_DISABLED',
        message: 'This account is disabled',
      });
    }

    return this.issueTokens(user, session, presentedHash);
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;
    try {
      const claims = await this.jwt.verifyAsync<RefreshClaims>(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
        algorithms: ['HS256'],
        issuer: 'bootyard-api',
        audience: 'bootyard-client',
      });
      if (Types.ObjectId.isValid(claims.sid)) {
        await this.sessions.updateOne(
          { _id: claims.sid, revokedAt: null },
          { $set: { revokedAt: new Date() } },
        );
      }
    } catch {
      // Logout is intentionally idempotent even for an invalid or expired cookie.
    }
  }

  async requestPasswordReset(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const generic = {
      message: 'If the account exists, reset instructions will be sent.',
    };
    const user = await this.users.findOne({
      email: dto.email.trim().toLowerCase(),
    });
    if (!user || user.status !== 'active') return generic;

    const token = createOpaqueToken();
    await this.resetTokens.deleteMany({ userId: user._id, usedAt: null });
    await this.resetTokens.create({
      userId: user._id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      usedAt: null,
    });
    try {
      await this.mail.sendPasswordReset(user.email, token);
    } catch (error) {
      this.logger.error('Password reset email could not be delivered', error);
    }
    return generic;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = sha256(dto.token);
    const reset = await this.resetTokens
      .findOne({ tokenHash, usedAt: null, expiresAt: { $gt: new Date() } })
      .select('+tokenHash');
    if (!reset)
      throw new ApiException(
        400,
        'RESET_TOKEN_INVALID',
        'Reset token is invalid or expired',
      );

    const claimed = await this.resetTokens.findOneAndUpdate(
      { _id: reset._id, usedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (!claimed)
      throw new ApiException(
        400,
        'RESET_TOKEN_INVALID',
        'Reset token is invalid or expired',
      );

    const passwordHash = await bcrypt.hash(
      this.passwordDigest(dto.password),
      this.config.get<number>('BCRYPT_ROUNDS', 12),
    );
    await this.users.updateOne(
      { _id: reset.userId },
      { $set: { passwordHash } },
    );
    await this.sessions.updateMany(
      { userId: reset.userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  async revokeUserSessions(userId: Types.ObjectId): Promise<void> {
    await this.sessions.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
  }

  private async createSession(
    user: HydratedDocument<User>,
  ): Promise<TokenBundle> {
    const refreshSeconds = this.config.get<number>(
      'JWT_REFRESH_TTL_SECONDS',
      2592000,
    );
    const session = new this.sessions({
      userId: user._id,
      familyId: randomUUID(),
      expiresAt: new Date(Date.now() + refreshSeconds * 1000),
      revokedAt: null,
      refreshTokenHash: sha256(createOpaqueToken()),
    });
    await session.save();
    return this.issueTokens(user, session);
  }

  private async issueTokens(
    user: HydratedDocument<User>,
    session: HydratedDocument<AuthSession>,
    expectedRefreshHash?: string,
  ): Promise<TokenBundle> {
    const accessSeconds = this.config.get<number>(
      'JWT_ACCESS_TTL_SECONDS',
      900,
    );
    const refreshToken = await this.jwt.signAsync(
      {
        sub: user._id.toString(),
        sid: session._id.toString(),
        familyId: session.familyId,
        jti: randomUUID(),
        typ: 'refresh',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: Math.max(
          1,
          Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
        ),
        issuer: 'bootyard-api',
        audience: 'bootyard-client',
      },
    );
    const nextRefreshHash = sha256(refreshToken);
    if (expectedRefreshHash) {
      const rotated = await this.sessions.updateOne(
        {
          _id: session._id,
          refreshTokenHash: expectedRefreshHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        },
        { $set: { refreshTokenHash: nextRefreshHash } },
      );
      if (rotated.matchedCount !== 1) {
        // A concurrent refresh with the same token is treated as reuse. Revoke
        // the family so neither competing refresh response remains usable.
        await this.sessions.updateMany(
          { familyId: session.familyId, revokedAt: null },
          { $set: { revokedAt: new Date() } },
        );
        throw new UnauthorizedException({
          code: 'REFRESH_TOKEN_INVALID',
          message: 'Refresh token reuse detected',
        });
      }
    } else {
      session.refreshTokenHash = nextRefreshHash;
      await session.save();
    }

    const accessToken = await this.jwt.signAsync(
      {
        sub: user._id.toString(),
        role: user.role,
        sid: session._id.toString(),
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessSeconds,
        issuer: 'bootyard-api',
        audience: 'bootyard-client',
      },
    );
    return {
      user: this.toPublicUser(user),
      accessToken,
      expiresIn: accessSeconds,
      refreshToken,
    };
  }

  private toPublicUser(user: HydratedDocument<User>): Record<string, unknown> {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      profile: user.profile,
      preferences: user.preferences,
      addresses: user.addresses,
      createdAt: (user as unknown as { createdAt?: Date }).createdAt,
    };
  }

  private constantTimeEqual(first: string, second: string): boolean {
    const firstBuffer = Buffer.from(first);
    const secondBuffer = Buffer.from(second);
    return (
      firstBuffer.length === secondBuffer.length &&
      timingSafeEqual(firstBuffer, secondBuffer)
    );
  }

  private passwordDigest(password: string): string {
    // Bound the input passed to bcrypt while retaining bcrypt's per-password salt and cost.
    return sha256('bootyard-password:' + password);
  }

  private isDuplicateKey(error: unknown): boolean {
    return error instanceof MongoServerError && error.code === 11000;
  }

  toAuthUser(
    user: User & { _id: Types.ObjectId },
    sessionId: string,
  ): AuthUser {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionId,
    };
  }
}
