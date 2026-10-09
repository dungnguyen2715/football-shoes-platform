import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import type { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}
  @Get('live') live(): { status: 'ok' } {
    return { status: 'ok' };
  }
  @Get('ready') ready(): { status: 'ready'; database: 'connected' } {
    if (this.connection.readyState !== mongoose.ConnectionStates.connected) {
      throw new ServiceUnavailableException({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is not connected',
      });
    }
    return { status: 'ready', database: 'connected' };
  }
}
