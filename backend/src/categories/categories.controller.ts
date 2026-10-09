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
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get() list(
    @Query('active') active?: string,
    @Query('parentId') parentId?: string,
  ): Promise<{ items: unknown[] }> {
    return this.categories.list(active !== 'false', parentId);
  }
}

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get() list(): Promise<{ items: unknown[] }> {
    return this.categories.list(false);
  }
  @Post() async create(
    @Body() body: CreateCategoryDto,
  ): Promise<{ category: unknown }> {
    return { category: await this.categories.create(body) };
  }
  @Patch(':categoryId') async update(
    @Param('categoryId') id: string,
    @Body() body: UpdateCategoryDto,
  ): Promise<{ category: unknown }> {
    return { category: await this.categories.update(id, body) };
  }
  @Delete(':categoryId') @HttpCode(HttpStatus.NO_CONTENT) async remove(
    @Param('categoryId') id: string,
  ): Promise<void> {
    await this.categories.remove(id);
  }
}
