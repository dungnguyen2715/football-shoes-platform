import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ProductPatchDto, ProductWriteDto } from './dto/product-write.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get('facets') async facets(): Promise<Record<string, string[]>> {
    return this.products.facets();
  }
  @Get() async list(@Query() query: ProductsQueryDto): Promise<unknown> {
    return this.products.list(query);
  }
  @Get(':idOrSlug') async get(@Param('idOrSlug') id: string): Promise<unknown> {
    return this.products.related(id);
  }
  @Post(':productId/views')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async view(@Param('productId') id: string): Promise<unknown> {
    return this.products.incrementViews(id);
  }
}

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() async list(@Query() query: ProductsQueryDto): Promise<unknown> {
    return this.products.list(query, true);
  }
  @Post() async create(@Body() body: ProductWriteDto): Promise<unknown> {
    return { product: await this.products.create(body) };
  }
  @Get(':productId') async get(
    @Param('productId') id: string,
  ): Promise<unknown> {
    return { product: await this.products.get(id) };
  }
  @Put(':productId') async replace(
    @Param('productId') id: string,
    @Body() body: ProductWriteDto,
  ): Promise<unknown> {
    return { product: await this.products.update(id, body) };
  }
  @Patch(':productId') async update(
    @Param('productId') id: string,
    @Body() body: ProductPatchDto,
  ): Promise<unknown> {
    return { product: await this.products.update(id, body) };
  }
  @Delete(':productId') async archive(
    @Param('productId') id: string,
  ): Promise<unknown> {
    return this.products.archive(id);
  }
}
