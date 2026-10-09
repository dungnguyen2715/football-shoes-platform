import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review } from '../database/schemas/review.schema';
import {
  decodeCursor,
  encodeCursor,
  parseLimit,
} from '../common/utils/pagination.util';
import { ReviewsQueryDto } from './reviews-query.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
  ) {}
  async list(query: ReviewsQueryDto): Promise<{
    items: unknown[];
    pageInfo: { nextCursor: string | null; hasNext: boolean };
  }> {
    const kind = query.kind ?? 'store';
    const filter: Record<string, unknown> = { kind, status: 'published' };
    if (kind === 'product') {
      if (!query.productId)
        return { items: [], pageInfo: { nextCursor: null, hasNext: false } };
      filter.productId = new Types.ObjectId(query.productId);
    }
    const cursor = decodeCursor(query.cursor);
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor.id) };
    const limit = parseLimit(query.limit);
    const rows = await this.reviews
      .find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();
    const hasNext = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    const last = pageRows.at(-1);
    return {
      items: pageRows.map((row) => ({
        ...row,
        id: String(row._id),
        _id: undefined,
      })),
      pageInfo: {
        hasNext,
        nextCursor:
          hasNext && last
            ? encodeCursor({
                id: String(last._id),
                sortValue: String(last._id),
              })
            : null,
      },
    };
  }
}
