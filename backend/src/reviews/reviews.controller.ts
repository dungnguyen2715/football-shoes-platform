import { Controller, Get, Query } from '@nestjs/common';
import { ReviewsQueryDto } from './reviews-query.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}
  @Get() list(@Query() query: ReviewsQueryDto): Promise<unknown> {
    return this.reviews.list(query);
  }
}
