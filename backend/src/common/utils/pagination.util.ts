import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export interface CursorValue {
  id: string;
  sortValue: string | number;
}

export const encodeCursor = (value: CursorValue): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

export const decodeCursor = (cursor?: string): CursorValue | undefined => {
  if (!cursor) return undefined;
  try {
    const value: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    );
    if (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      Types.ObjectId.isValid(value.id) &&
      'sortValue' in value &&
      (typeof value.sortValue === 'string' ||
        typeof value.sortValue === 'number')
    ) {
      return value as CursorValue;
    }
  } catch {
    // Return the same public error for malformed base64 and invalid cursor payloads.
  }
  throw new BadRequestException({
    code: 'INVALID_QUERY',
    message: 'Invalid cursor',
  });
};

export const parseLimit = (value?: number, fallback = 20): number =>
  Math.min(Math.max(value ?? fallback, 1), 100);
