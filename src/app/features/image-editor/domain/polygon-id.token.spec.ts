import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { POLYGON_ID } from './polygon-id.token';

describe('POLYGON_ID', () => {
  it('should provide a factory returning a non-empty unique id, when injected with no override', () => {
    const generate = TestBed.inject(POLYGON_ID);

    const first = generate();
    const second = generate();

    expect(first).not.toBe('');
    expect(first).not.toBe(second);
  });

  it('should be overridable in tests, when a deterministic factory is provided', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: POLYGON_ID, useValue: () => 'fixed-id' }],
    });

    expect(TestBed.inject(POLYGON_ID)()).toBe('fixed-id');
  });

  it('should still produce a unique id, when crypto.randomUUID is unavailable', () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });

    try {
      const factory = TestBed.inject(POLYGON_ID);
      expect(factory()).not.toBe(factory());
      expect(factory()).toMatch(/\S/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});
