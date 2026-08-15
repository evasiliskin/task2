import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('public/og-image.png', () => {
  it('should exist and be a PNG, when the Open Graph metadata references it', () => {
    const buffer = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../public/og-image.png'),
    );

    expect(buffer.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  });
});
