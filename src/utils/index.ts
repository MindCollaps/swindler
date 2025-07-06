import { randomBytes } from 'crypto';

export function createToken(length = 8): string {
  return randomBytes(length).toString('hex');
}