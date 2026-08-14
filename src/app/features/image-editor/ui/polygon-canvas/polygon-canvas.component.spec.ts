import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Polygon } from '../../domain/polygon.model';
import { PolygonCanvas } from './polygon-canvas.component';

let resizeObserverInstances: FakeResizeObserver[] = [];

class FakeResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObserverInstances.push(this);
  }

  observe(): void {
    this.trigger(100, 100);
  }

  trigger(width: number, height: number): void {
    const contentRect = { width, height } as DOMRectReadOnly;
    this.callback([{ contentRect } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect(): void {}
}

function firePointer(element: Element, type: string, offsetX: number, offsetY: number): void {
  const event = new Event(type) as unknown as PointerEvent;
  Object.defineProperty(event, 'offsetX', { value: offsetX });
  Object.defineProperty(event, 'offsetY', { value: offsetY });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  element.dispatchEvent(event);
}

function fireKey(element: Element, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

const square: Polygon = {
  id: 'image-1',
  imageId: 'image-1',
  points: [
    { x: -0.1, y: -0.1 },
    { x: 0.1, y: -0.1 },
    { x: 0.1, y: 0.1 },
    { x: -0.1, y: 0.1 },
  ],
  position: { x: 0.5, y: 0.5 },
  rotationRadians: 0,
};

describe('PolygonCanvas', () => {
  let fixture: ComponentFixture<PolygonCanvas>;
  let canvas: HTMLElement;
  let liveAnnouncerSpy: { announce: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    resizeObserverInstances = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    liveAnnouncerSpy = { announce: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      imports: [PolygonCanvas],
      providers: [{ provide: LiveAnnouncer, useValue: liveAnnouncerSpy }],
    });
    fixture = TestBed.createComponent(PolygonCanvas);
    fixture.componentRef.setInput('imageUrl', 'https://example.test/image.jpg');
    fixture.componentRef.setInput('imageAlt', 'A test image');
    fixture.detectChanges();
    fixture.detectChanges();

    canvas = fixture.nativeElement.querySelector('canvas');

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('load'));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the image with the given url and alt text', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://example.test/image.jpg');
    expect(img.alt).toBe('A test image');
  });

  it('should show the initial draw hint and a disabled Finish button, when no polygon exists and no points are placed', () => {
    const finishButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[0];
    expect(fixture.nativeElement.textContent).toContain('Click the image to start drawing');
    expect(finishButton.disabled).toBe(true);
  });

  it('should update the draw hint with the placed point count, when the canvas is clicked while drawing', () => {
    firePointer(canvas, 'pointerdown', 20, 30);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 point');
  });

  it('should emit polygonDrawn with the placed points, when Finish polygon is clicked after 3+ points', () => {
    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);

    firePointer(canvas, 'pointerdown', 10, 10);
    firePointer(canvas, 'pointerdown', 50, 10);
    firePointer(canvas, 'pointerdown', 30, 50);
    fixture.detectChanges();

    const finishButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[0];
    expect(finishButton.disabled).toBe(false);
    finishButton.click();

    expect(drawnSpy).toHaveBeenCalledWith([
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.3, y: 0.5 },
    ]);
  });

  it('should revert to the initial hint, when Clear points is clicked after placing points', () => {
    firePointer(canvas, 'pointerdown', 10, 10);
    fixture.detectChanges();

    const clearButton: HTMLButtonElement = fixture.nativeElement.querySelectorAll('button')[1];
    clearButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Click the image to start drawing');
  });

  it('should finish the polygon, when clicking near the first placed vertex', () => {
    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);

    firePointer(canvas, 'pointerdown', 10, 10);
    firePointer(canvas, 'pointerdown', 50, 10);
    firePointer(canvas, 'pointerdown', 30, 50);
    firePointer(canvas, 'pointerdown', 12, 12);
    fixture.detectChanges();

    expect(drawnSpy).toHaveBeenCalledWith([
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.3, y: 0.5 },
    ]);
  });

  it('should finish the polygon on double-click, discarding the duplicate point added by the second click', () => {
    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);

    firePointer(canvas, 'pointerdown', 10, 10);
    firePointer(canvas, 'pointerdown', 50, 10);
    firePointer(canvas, 'pointerdown', 30, 50);
    firePointer(canvas, 'pointerdown', 30, 50);
    canvas.dispatchEvent(new Event('dblclick'));
    fixture.detectChanges();

    expect(drawnSpy).toHaveBeenCalledWith([
      { x: 0.1, y: 0.1 },
      { x: 0.5, y: 0.1 },
      { x: 0.3, y: 0.5 },
    ]);
  });

  it('should emit polygonMoved with the new position, when dragging an existing polygon body and releasing the pointer', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    firePointer(canvas, 'pointerdown', 50, 50);
    firePointer(canvas, 'pointermove', 60, 50);
    firePointer(canvas, 'pointerup', 60, 50);

    expect(movedSpy).toHaveBeenCalledWith({ x: 0.6, y: 0.5 });
  });

  it('should emit polygonRotated with the new rotation, when dragging the rotation handle and releasing the pointer', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    const rotatedSpy = vi.fn();
    fixture.componentInstance.polygonRotated.subscribe(rotatedSpy);

    firePointer(canvas, 'pointerdown', 50, 30);
    firePointer(canvas, 'pointermove', 70, 50);
    firePointer(canvas, 'pointerup', 70, 50);

    expect(rotatedSpy).toHaveBeenCalledTimes(1);
    expect(rotatedSpy.mock.calls[0][0]).toBeCloseTo(Math.PI / 2, 9);
  });

  it('should ignore a second pointerdown and keep tracking the first gesture, when it arrives before the first gesture ends', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    firePointer(canvas, 'pointerdown', 50, 50);
    firePointer(canvas, 'pointerdown', 55, 55);
    firePointer(canvas, 'pointermove', 60, 50);
    firePointer(canvas, 'pointerup', 60, 50);

    expect(movedSpy).toHaveBeenCalledTimes(1);
    expect(movedSpy).toHaveBeenCalledWith({ x: 0.6, y: 0.5 });
  });

  it('should abort the gesture without throwing and without emitting, when the box size becomes zero mid-drag', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    firePointer(canvas, 'pointerdown', 50, 50);
    resizeObserverInstances[0].trigger(0, 0);
    fixture.detectChanges();

    expect(() => firePointer(canvas, 'pointermove', 60, 50)).not.toThrow();
    expect(movedSpy).not.toHaveBeenCalled();

    firePointer(canvas, 'pointerup', 60, 50);
    expect(movedSpy).not.toHaveBeenCalled();
  });

  it('should hide the draw controls, when a polygon already exists', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.polygon-canvas__draw-controls')).toBeNull();
  });

  it('should clear stale draw points, when polygon input transitions from null to non-null and back to null', () => {
    firePointer(canvas, 'pointerdown', 20, 30);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 point');

    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    fixture.componentRef.setInput('polygon', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Click the image to start drawing');
  });

  it('should be keyboard-focusable with an accessible name describing how to start drawing, when no polygon exists yet', () => {
    expect(canvas.getAttribute('tabindex')).toBe('0');
    expect(canvas.getAttribute('role')).toBe('group');
    expect(canvas.getAttribute('aria-label')).toContain('start drawing');
  });

  it('should be keyboard-focusable with an accessible label mentioning arrow keys, when a polygon exists', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    expect(canvas.getAttribute('tabindex')).toBe('0');
    expect(canvas.getAttribute('role')).toBe('group');
    expect(canvas.getAttribute('aria-label')).toContain('arrow keys');
  });

  it('should emit polygonMoved and announce the direction, when ArrowRight is pressed on an existing polygon', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();
    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    fireKey(canvas, 'ArrowRight');
    fixture.detectChanges();

    expect(movedSpy).toHaveBeenCalledWith({ x: 0.52, y: 0.5 });
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon moved right.');
  });

  it('should emit polygonRotated and announce the degrees, when ] is pressed on an existing polygon', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();
    const rotatedSpy = vi.fn();
    fixture.componentInstance.polygonRotated.subscribe(rotatedSpy);

    fireKey(canvas, ']');
    fixture.detectChanges();

    expect(rotatedSpy).toHaveBeenCalled();
    expect(rotatedSpy.mock.calls[0][0]).toBeCloseTo(Math.PI / 12, 12);
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon rotated 15° clockwise.');
  });

  it('should emit polygonRotated in the opposite direction and announce it, when [ is pressed on an existing polygon', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();
    const rotatedSpy = vi.fn();
    fixture.componentInstance.polygonRotated.subscribe(rotatedSpy);

    fireKey(canvas, '[');
    fixture.detectChanges();

    expect(rotatedSpy).toHaveBeenCalled();
    expect(rotatedSpy.mock.calls[0][0]).toBeCloseTo(Math.PI * 2 - Math.PI / 12, 12);
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon rotated 15° counterclockwise.');
  });

  it('should emit polygonDeleted and announce the deletion, when Delete is pressed on an existing polygon', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();
    const deletedSpy = vi.fn();
    fixture.componentInstance.polygonDeleted.subscribe(deletedSpy);

    fireKey(canvas, 'Delete');
    fixture.detectChanges();

    expect(deletedSpy).toHaveBeenCalled();
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon deleted.');
  });

  it('should announce the deletion and keep the canvas focusable, when Delete triggers a synchronous polygon removal', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    // Simulates the real flow: polygonDeleted -> facade -> store -> selector emits null,
    // all within the same synchronous change-detection pass.
    fixture.componentInstance.polygonDeleted.subscribe(() => {
      fixture.componentRef.setInput('polygon', null);
      fixture.detectChanges();
    });

    canvas.focus();
    fireKey(canvas, 'Delete');
    fixture.detectChanges();

    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon deleted.');
    expect(canvas.getAttribute('tabindex')).toBe('0');
  });

  it('should ignore keyboard input, when no polygon exists yet', () => {
    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    fireKey(canvas, 'ArrowRight');

    expect(movedSpy).not.toHaveBeenCalled();
  });

  it('should size the backing store by the device pixel ratio and only when the size actually changes', async () => {
    const setTransform = vi.fn();
    const context = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setTransform,
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;

    const canvasElement = canvas as HTMLCanvasElement;
    vi.spyOn(canvasElement, 'getContext').mockReturnValue(context);
    vi.stubGlobal('devicePixelRatio', 2);

    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(canvasElement.width).toBe(200);
    expect(canvasElement.height).toBe(200);
    expect(setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);

    const widthSpy = vi.spyOn(canvasElement, 'width', 'set');
    firePointer(canvas, 'pointerdown', 50, 50);
    firePointer(canvas, 'pointermove', 55, 50);
    firePointer(canvas, 'pointermove', 60, 50);
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(widthSpy).not.toHaveBeenCalled();
  });

  it('should announce that the canvas is unavailable, when a 2D context cannot be obtained', async () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Polygon drawing is unavailable');
  });

  it('should emit polygonDeleted and announce it, when the visible delete button is clicked', () => {
    fixture.componentRef.setInput('polygon', square);
    fixture.detectChanges();

    const deletedSpy = vi.fn();
    fixture.componentInstance.polygonDeleted.subscribe(deletedSpy);

    const deleteButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.polygon-canvas__edit-controls button',
    );
    expect(deleteButton).not.toBeNull();
    deleteButton.click();
    fixture.detectChanges();

    expect(deletedSpy).toHaveBeenCalled();
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon deleted.');
  });

  it('should not render the edit controls, when no polygon exists', () => {
    expect(fixture.nativeElement.querySelector('.polygon-canvas__edit-controls')).toBeNull();
  });

  it('should render intrinsic width and height attributes, when the image dimensions are known', () => {
    fixture.componentRef.setInput('imageWidth', 1600);
    fixture.componentRef.setInput('imageHeight', 900);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('width')).toBe('1600');
    expect(img.getAttribute('height')).toBe('900');
  });

  it('should show an error message and hide the draw controls, when the image fails to load', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The image could not be loaded');
    expect(fixture.nativeElement.querySelector('.polygon-canvas__draw-controls')).toBeNull();
  });

  it('should clear the loading state, when the image loads', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Loading image');
  });

  it('should not place draw points or commit a polygon, when the canvas receives pointerdown and dblclick after the image failed to load', () => {
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);

    firePointer(canvas, 'pointerdown', 10, 10);
    firePointer(canvas, 'pointerdown', 50, 10);
    firePointer(canvas, 'pointerdown', 30, 50);
    firePointer(canvas, 'pointerdown', 30, 50);
    canvas.dispatchEvent(new Event('dblclick'));
    fixture.detectChanges();

    expect(drawnSpy).not.toHaveBeenCalled();
  });

  it('should not bind pointermove in the template, so idle pointer motion cannot schedule change detection', () => {
    const template = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'polygon-canvas.component.html'),
      'utf-8',
    );

    expect(template).not.toContain('(pointermove)');
    expect(template).not.toContain('(pointerup)');
    expect(template).not.toContain('(pointercancel)');
    expect(template).toContain('(pointerdown)');
  });

  it('should obtain its collaborators by injection, not by construction', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'polygon-canvas.component.ts'),
      'utf-8',
    );

    expect(source).not.toContain('new PolygonCanvasRenderer(');
    expect(source).not.toContain('new PolygonInteractionController(');
    expect(source).toContain('inject(POLYGON_CANVAS_RENDERER)');
    expect(source).toContain('inject(POLYGON_INTERACTION_CONTROLLER)');
  });
});
