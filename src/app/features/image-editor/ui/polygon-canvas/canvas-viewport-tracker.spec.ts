import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanvasViewportTracker } from './canvas-viewport-tracker';

describe('CanvasViewportTracker', () => {
  let observedElements: HTMLElement[];
  let resizeCallbacks: ResizeObserverCallback[];
  let disconnectCount: number;
  let mediaQueries: FakeMediaQueryList[];

  class FakeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      resizeCallbacks.push(callback);
    }

    observe(element: HTMLElement): void {
      observedElements.push(element);
    }

    disconnect(): void {
      disconnectCount += 1;
    }
  }

  class FakeMediaQueryList {
    readonly listeners: (() => void)[] = [];
    removedListeners: (() => void)[] = [];

    constructor(readonly query: string) {
      mediaQueries.push(this);
    }

    addEventListener(_type: string, listener: () => void): void {
      this.listeners.push(listener);
    }

    removeEventListener(_type: string, listener: () => void): void {
      this.removedListeners.push(listener);
    }
  }

  function resize(width: number, height: number): void {
    const entry = { contentRect: { width, height } as DOMRectReadOnly } as ResizeObserverEntry;
    resizeCallbacks.forEach((callback) => callback([entry], {} as ResizeObserver));
  }

  function createTracker(element: HTMLElement): CanvasViewportTracker {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const tracker = TestBed.runInInjectionContext(() => new CanvasViewportTracker(() => element));
    TestBed.tick();

    return tracker;
  }

  beforeEach(() => {
    observedElements = [];
    resizeCallbacks = [];
    disconnectCount = 0;
    mediaQueries = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('devicePixelRatio', 1);
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => new FakeMediaQueryList(query)),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should report a zero box, when nothing has been measured yet', () => {
    const tracker = createTracker(document.createElement('div'));

    expect(tracker.boxSize()).toEqual({ width: 0, height: 0 });
  });

  it('should observe the given element, when the tracker is created', () => {
    const element = document.createElement('div');

    createTracker(element);

    expect(observedElements).toEqual([element]);
  });

  it('should report the measured box, when the element is resized', () => {
    const tracker = createTracker(document.createElement('div'));

    resize(320, 240);

    expect(tracker.boxSize()).toEqual({ width: 320, height: 240 });
  });

  it('should report the current device pixel ratio, when the tracker is created', () => {
    vi.stubGlobal('devicePixelRatio', 3);

    const tracker = createTracker(document.createElement('div'));

    expect(tracker.pixelRatio()).toBe(3);
  });

  it('should report a ratio of 1, when the environment exposes no device pixel ratio', () => {
    vi.stubGlobal('devicePixelRatio', 0);

    const tracker = createTracker(document.createElement('div'));

    expect(tracker.pixelRatio()).toBe(1);
  });

  it('should report the new ratio, when the resolution media query changes', () => {
    const tracker = createTracker(document.createElement('div'));

    vi.stubGlobal('devicePixelRatio', 2);
    mediaQueries[0].listeners.forEach((listener) => listener());

    expect(tracker.pixelRatio()).toBe(2);
  });

  it('should watch the new resolution, when the ratio has changed', () => {
    createTracker(document.createElement('div'));

    vi.stubGlobal('devicePixelRatio', 2);
    mediaQueries[0].listeners.forEach((listener) => listener());
    TestBed.tick();

    expect(mediaQueries[0].removedListeners).toHaveLength(1);
    expect(mediaQueries[1].query).toBe('(resolution: 2dppx)');
  });

  it('should stop observing, when the injection context is destroyed', () => {
    createTracker(document.createElement('div'));

    TestBed.resetTestingModule();

    expect(disconnectCount).toBe(1);
  });
});
