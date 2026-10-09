import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { Category } from '../database/schemas/category.schema';
import { Product } from '../database/schemas/product.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categories: Model<Category>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
  ) {}

  async list(
    activeOnly = true,
    parentId?: string,
  ): Promise<{ items: unknown[] }> {
    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.isActive = true;
    if (parentId && Types.ObjectId.isValid(parentId))
      filter.parentId = new Types.ObjectId(parentId);
    const items = await this.categories
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
    return {
      items: items.map((row) => ({
        ...row,
        id: String(row._id),
        _id: undefined,
      })),
    };
  }

  async create(input: CreateCategoryDto): Promise<unknown> {
    const slug = this.slugify(input.slug ?? input.name);
    await this.assertParentAllowed(input.parentId);
    if (await this.categories.exists({ slug }))
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: 'Category slug already exists',
      });
    const category = await this.categories.create({
      ...input,
      slug,
      parentId: input.parentId ? new Types.ObjectId(input.parentId) : undefined,
    });
    return { ...category.toObject(), id: String(category._id), _id: undefined };
  }

  async update(id: string, input: UpdateCategoryDto): Promise<unknown> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Category not found',
      });
    const updates: Record<string, unknown> = { ...input };
    await this.assertParentAllowed(input.parentId, id);
    if (input.slug || input.name)
      updates.slug = this.slugify(input.slug ?? input.name ?? '');
    if (input.parentId) updates.parentId = new Types.ObjectId(input.parentId);
    try {
      const row = await this.categories
        .findByIdAndUpdate(
          id,
          { $set: updates },
          { returnDocument: 'after', runValidators: true },
        )
        .lean()
        .exec();
      if (!row)
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Category not found',
        });
      return { ...row, id: String(row._id), _id: undefined };
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000)
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: 'Category slug already exists',
        });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Category not found',
      });
    if (
      await this.products.exists({
        categoryIds: new Types.ObjectId(id),
        archivedAt: null,
      })
    )
      throw new ConflictException({
        code: 'CATEGORY_IN_USE',
        message: 'Category is assigned to products',
      });
    if (await this.categories.exists({ parentId: new Types.ObjectId(id) }))
      throw new ConflictException({
        code: 'CATEGORY_IN_USE',
        message: 'Category has child categories',
      });
    const result = await this.categories.deleteOne({ _id: id });
    if (!result.deletedCount)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Category not found',
      });
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async assertParentAllowed(
    parentId?: string,
    categoryId?: string,
  ): Promise<void> {
    if (!parentId) return;
    if (parentId === categoryId)
      throw new BadRequestException({
        code: 'INVALID_CATEGORY_PARENT',
        message: 'A category cannot be its own parent',
      });
    const parent = await this.categories
      .findById(parentId)
      .select('parentId')
      .lean()
      .exec();
    if (!parent)
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Parent category not found',
      });
    if (parent.parentId)
      throw new BadRequestException({
        code: 'INVALID_CATEGORY_PARENT',
        message: 'Only one parent category level is supported',
      });
  }
}
