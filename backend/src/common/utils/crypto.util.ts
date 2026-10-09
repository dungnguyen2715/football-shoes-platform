import { createHash, randomBytes } from 'node:crypto';

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
export const createOpaqueToken = (bytes = 32): string =>
  randomBytes(bytes).toString('base64url');
export const createPublicOrderNo = (): string =>
  'BY-' + randomBytes(6).toString('hex').toUpperCase();

export const stableStringify = (value: unknown): string => {
  if (Array.isArray(value))
    return '[' + value.map(stableStringify).join(',') + ']';
  if (typeof value === 'object' && value !== null) {
    return (
      '{' +
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => JSON.stringify(key) + ':' + stableStringify(item))
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value) ?? 'null';
};
