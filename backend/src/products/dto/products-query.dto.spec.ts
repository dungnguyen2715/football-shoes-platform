import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductsQueryDto } from './products-query.dto';

describe('ProductsQueryDto array query transforms', () => {
  it('normalizes a single filter value to an array', async () => {
    const query = plainToInstance(ProductsQueryDto, {
      brand: 'Nike',
      size: '9',
      surface: 'TF',
      availability: 'available',
    });

    expect(query.brand).toEqual(['Nike']);
    expect(query.size).toEqual(['9']);
    expect(query.surface).toEqual(['TF']);
    expect(query.availability).toEqual(['available']);
    expect(await validate(query)).toEqual([]);
  });

  it('normalizes comma-separated, repeated, and whitespace-only values', async () => {
    const query = plainToInstance(ProductsQueryDto, {
      brand: ' Nike, Adidas, ',
      color: [' Blue ', 'Black'],
      surface: 'TF,, FG',
    });

    expect(query.brand).toEqual(['Nike', 'Adidas']);
    expect(query.color).toEqual([' Blue ', 'Black']);
    expect(query.surface).toEqual(['TF', 'FG']);
    expect(await validate(query)).toEqual([]);
  });
});
