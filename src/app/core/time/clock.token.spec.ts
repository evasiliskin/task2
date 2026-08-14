import { TestBed } from '@angular/core/testing';
import { CLOCK } from './clock.token';

describe('CLOCK', () => {
  it('should return the current epoch milliseconds, when no override is provided', () => {
    const before = Date.now();
    const now = TestBed.inject(CLOCK)();
    expect(now).toBeGreaterThanOrEqual(before);
  });

  it('should return the overridden value, when a test provides a fixed clock', () => {
    TestBed.configureTestingModule({ providers: [{ provide: CLOCK, useValue: () => 42 }] });
    expect(TestBed.inject(CLOCK)()).toBe(42);
  });
});
