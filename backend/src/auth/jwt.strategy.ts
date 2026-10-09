import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Model, Types } from 'mongoose';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { AuthSession } from '../database/schemas/auth-session.schema';

interface AccessSessionView {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  user: {
    _id: Types.ObjectId;
    email: string;
    role: AuthUser['role'];
    status: string;
  };
}

interface AccessClaims {
  sub: string;
  sid: string;
  role: 'customer' | 'admin';
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(AuthSession.name)
    private readonly sessions: Model<AuthSession>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      algorithms: ['HS256'],
      issuer: 'bootyard-api',
      audience: 'bootyard-client',
    });
  }

  async validate(payload: AccessClaims): Promise<AuthUser> {
    if (
      !Types.ObjectId.isValid(payload.sub) ||
      !Types.ObjectId.isValid(payload.sid)
    ) {
      throw new UnauthorizedException('Invalid access token');
    }
    // A single aggregation command joins the session and user on MongoDB,
    // avoiding two network round-trips for every authenticated request.
    const [session] = await this.sessions.aggregate<AccessSessionView>([
      {
        $match: {
          _id: new Types.ObjectId(payload.sid),
          userId: new Types.ObjectId(payload.sub),
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.status': 'active', 'user.role': payload.role } },
      {
        $project: {
          _id: 1,
          userId: 1,
          'user.email': 1,
          'user.role': 1,
          'user.status': 1,
        },
      },
      { $limit: 1 },
    ]);
    if (!session) {
      throw new UnauthorizedException('Access token is no longer valid');
    }
    return {
      id: session.userId.toString(),
      email: session.user.email,
      role: session.user.role,
      sessionId: payload.sid,
    };
  }
}
