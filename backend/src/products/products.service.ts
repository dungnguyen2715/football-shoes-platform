import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { Product } from '../database/schemas/product.schema';
import {
  decodeCursor,
  encodeCursor,
  parseLimit,
} from '../common/utils/pagination.util';
import { ProductPatchDto, ProductWriteDto } from './dto/product-write.dto';
import { ProductsQueryDto } from './dto/products-query.dto';

type ProductRecord = Product & {
  _id: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};
type Page<T> = {
  items: T[];
  pageInfo: { nextCursor: string | null; hasNext: boolean };
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
  ) {}

  async list(
    query: ProductsQueryDto,
    admin = false,
  ): Promise<Page<Record<string, unknown>>> {
    const filter: QueryFilter<Product> = { archivedAt: null };
    if (admin && query.includeArchived) delete filter.archivedAt;
    if (!admin && query.availability) {
      // Public catalog can explicitly request inventory states for storefront filters.
    } else if (!admin) filter.availability = 'available';
    this.addFilter(filter, 'brand', query.brand);
    this.addFilter(filter, 'size', query.size);
    this.addFilter(filter, 'surface', query.surface);
    this.addFilter(filter, 'color', query.color);
    this.addFilter(filter, 'availability', query.availability);
    if (query.categoryId && Types.ObjectId.isValid(query.categoryId))
      filter.categoryIds = new Types.ObjectId(query.categoryId);
    if (
      query.minPriceMinor !== undefined ||
      query.maxPriceMinor !== undefined
    ) {
      filter['pricing.priceMinor'] = {
        ...(query.minPriceMinor !== undefined
          ? { $gte: query.minPriceMinor }
          : {}),
        ...(query.maxPriceMinor !== undefined
          ? { $lte: query.maxPriceMinor }
          : {}),
      };
    }
    if (query.minCondition !== undefined)
      filter.conditionScore = { $gte: query.minCondition };
    if (query.q?.trim()) filter.$text = { $search: query.q.trim() };

    const sort = this.sortSpec(query.sort);
    const cursor = decodeCursor(query.cursor);
    if (cursor) {
      const direction = Object.values(sort)[0] ?? -1;
      const field = Object.keys(sort)[0] ?? 'listedAt';
      const rangeOperator = direction === 1 ? '$gt' : '$lt';
      const range: Record<string, unknown> = {
        [field]: { [rangeOperator]: cursor.sortValue },
      };
      filter.$and = [
        ...(filter.$and ?? []),
        {
          $or: [
            range,
            {
              [field]: cursor.sortValue,
              _id: { [rangeOperator]: new Types.ObjectId(cursor.id) },
            },
          ],
        },
      ];
    }
    const limit = parseLimit(query.limit);
    const rows = await this.products
      .find(filter)
      .sort(sort)
      .limit(limit + 1)
      .lean<ProductRecord[]>()
      .exec();
    const hasNext = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    const last = pageRows.at(-1);
    const sortField = Object.keys(sort)[0] ?? 'listedAt';
    const rawSortValue = last
      ? (last as unknown as Record<string, unknown>)[sortField]
      : undefined;
    const sortValue =
      rawSortValue instanceof Date ? rawSortValue.toISOString() : rawSortValue;
    return {
      items: pageRows.map((row) => this.toDto(row)),
      pageInfo: {
        hasNext,
        nextCursor:
          hasNext &&
          last &&
          (typeof sortValue === 'number' || typeof sortValue === 'string')
            ? encodeCursor({ id: String(last._id), sortValue })
            : null,
      },
    };
  }

  async get(idOrSlug: string): Promise<Record<string, unknown>> {
    const query = Types.ObjectId.isValid(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: idOrSlug.toLowerCase() };
    const product = await this.products
      .findOne({ ...query, archivedAt: null })
      .lean<ProductRecord>()
      .exec();
    if (!product)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    return this.toDto(product);
  }

  async related(idOrSlug: string): Promise<{
    product: Record<string, unknown>;
    related: Record<string, unknown>[];
  }> {
    const product = await this.products
      .findOne(
        Types.ObjectId.isValid(idOrSlug)
          ? { _id: idOrSlug, archivedAt: null }
          : { slug: idOrSlug.toLowerCase(), archivedAt: null },
      )
      .lean<ProductRecord>()
      .exec();
    if (!product)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    const related = await this.products
      .find({
        archivedAt: null,
        availability: 'available',
        _id: { $ne: product._id },
        $or: [{ brand: product.brand }, { surface: product.surface }],
      })
      .sort({ listedAt: -1 })
      .limit(4)
      .lean<ProductRecord[]>()
      .exec();
    return {
      product: this.toDto(product),
      related: related.map((item) => this.toDto(item)),
    };
  }

  async facets(): Promise<Record<string, string[]>> {
    const [brands, sizes, surfaces, colors] = await Promise.all([
      this.products.distinct('brand', {
        archivedAt: null,
        availability: 'available',
      }),
      this.products.distinct('size', {
        archivedAt: null,
        availability: 'available',
      }),
      this.products.distinct('surface', {
        archivedAt: null,
        availability: 'available',
      }),
      this.products.distinct('color', {
        archivedAt: null,
        availability: 'available',
      }),
    ]);
    return {
      brands,
      sizes,
      surfaces,
      colors,
    };
  }

  async incrementViews(id: string): Promise<{ accepted: true }> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    const result = await this.products.updateOne(
      { _id: id, archivedAt: null },
      { $inc: { viewsTotal: 1 } },
    );
    if (!result.matchedCount)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    return { accepted: true };
  }

  async create(input: ProductWriteDto): Promise<Record<string, unknown>> {
    const slug = this.slugify(input.name);
    if (await this.products.exists({ slug }))
      throw new ConflictException({
        code: 'SLUG_ALREADY_EXISTS',
        message: 'A product with this name already exists',
      });
    const product = new this.products();
    product.set({
      ...input,
      slug,
      listedAt: input.listedAt ? new Date(input.listedAt) : new Date(),
      categoryIds: input.categoryIds?.map((id) => new Types.ObjectId(id)) ?? [],
    });
    await product.save();
    return this.toDto(product.toObject());
  }

  async update(
    id: string,
    input: ProductWriteDto | ProductPatchDto,
  ): Promise<Record<string, unknown>> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    const update: Record<string, unknown> = { ...input };
    if (input.listedAt) update.listedAt = new Date(input.listedAt);
    if (input.categoryIds)
      update.categoryIds = input.categoryIds.map(
        (categoryId) => new Types.ObjectId(categoryId),
      );
    if (input.name) update.slug = this.slugify(input.name);
    try {
      const product = await this.products
        .findOneAndUpdate(
          { _id: id, archivedAt: null },
          { $set: update },
          { returnDocument: 'after', runValidators: true },
        )
        .lean<ProductRecord>()
        .exec();
      if (!product)
        throw new NotFoundException({
          code: 'PRODUCT_NOT_FOUND',
          message: 'Product not found',
        });
      return this.toDto(product);
    } catch (error) {
      if (this.isDuplicateKey(error))
        throw new ConflictException({
          code: 'SLUG_ALREADY_EXISTS',
          message: 'A product with this name already exists',
        });
      throw error;
    }
  }

  async archive(
    id: string,
  ): Promise<{ product: Record<string, unknown>; archived: true }> {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    const product = await this.products
      .findOneAndUpdate(
        { _id: id, archivedAt: null },
        { $set: { archivedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .lean<ProductRecord>()
      .exec();
    if (!product)
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found',
      });
    return { product: this.toDto(product), archived: true };
  }

  private addFilter(
    filter: QueryFilter<Product>,
    key: string,
    value?: string | string[],
  ): void {
    if (!value) return;
    filter[key] = Array.isArray(value) ? { $in: value } : value;
  }
  private sortSpec(sort?: string): Record<string, 1 | -1> {
    switch (sort) {
      case 'price_asc':
        return { 'pricing.priceMinor': 1, _id: 1 };
      case 'price_desc':
        return { 'pricing.priceMinor': -1, _id: -1 };
      case 'condition':
        return { conditionScore: -1, _id: -1 };
      case 'views':
        return { viewsTotal: -1, _id: -1 };
      default:
        return { listedAt: -1, _id: -1 };
    }
  }
  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  private isDuplicateKey(error: unknown): boolean {
    return error instanceof MongoServerError && error.code === 11000;
  }
  private toDto(product: ProductRecord): Record<string, unknown> {
    return {
      ...product,
      id: String(product._id),
      _id: undefined,
      __v: undefined,
      conditionLabel:
        product.conditionScore >= 9
          ? 'Like new'
          : product.conditionScore >= 7
            ? 'Very good'
            : product.conditionScore >= 5
              ? 'Good'
              : 'Fair',
      legacyId: product.legacyId,
    };
  }
}
