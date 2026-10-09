import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model, QueryFilter, Types } from 'mongoose';
import { Order } from '../database/schemas/order.schema';
import { Product } from '../database/schemas/product.schema';

interface ExpiredOrderRecord {
  _id: Types.ObjectId;
  items: Array<{ productId: Types.ObjectId }>;
}

@Injectable()
export class ExpiredOrderCleanupService {
  private readonly logger = new Logger(ExpiredOrderCleanupService.name);
  private isRunning = false;

  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cancelExpiredReservations(): Promise<number> {
    if (this.isRunning) return 0;
    this.isRunning = true;
    const timeoutHours = this.config.get<number>(
      'ORDER_RESERVATION_TTL_HOURS',
      48,
    );
    const expiresBefore = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);
    let cancelledCount = 0;

    try {
      // Work in bounded batches so a large backlog never accumulates in memory.
      for (let batch = 0; batch < 10; batch += 1) {
        const expired = await this.orders
          .find({
            status: 'pending',
            createdAt: { $lte: expiresBefore },
          } as QueryFilter<Order>)
          .select('_id items.productId')
          .sort({ createdAt: 1, _id: 1 })
          .limit(100)
          .lean<ExpiredOrderRecord[]>()
          .exec();
        if (expired.length === 0) break;

        for (const candidate of expired) {
          // Recheck the state atomically: an admin may have changed it after
          // the batch was read, or another application instance may be cleaning it.
          const cancelled = await this.orders
            .findOneAndUpdate(
              {
                _id: candidate._id,
                status: 'pending',
                createdAt: { $lte: expiresBefore },
              } as QueryFilter<Order>,
              {
                $set: { status: 'cancelled' },
                $push: {
                  statusHistory: {
                    $each: [
                      {
                        status: 'cancelled',
                        changedAt: new Date(),
                        note: 'Automatically cancelled after reservation timeout',
                      },
                    ],
                    $slice: -20,
                  },
                },
              },
              { returnDocument: 'after' },
            )
            .select('_id items.productId')
            .lean<ExpiredOrderRecord>()
            .exec();
          if (!cancelled) continue;

          await this.products.updateMany(
            {
              _id: { $in: cancelled.items.map((item) => item.productId) },
              availability: 'reserved',
            },
            { $set: { availability: 'available' } },
          );
          cancelledCount += 1;
        }
        if (expired.length < 100) break;
      }

      if (cancelledCount > 0)
        this.logger.log(`Cancelled ${cancelledCount} expired pending order(s)`);
      return cancelledCount;
    } catch (error) {
      this.logger.error('Expired order cleanup failed', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
}
