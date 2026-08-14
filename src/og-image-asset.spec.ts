import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('public/og-image.png', () => {
  it('is a 1200x630 PNG', () => {
    const buf = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../public/og-image.png'),
    );
    expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);
  });
});
