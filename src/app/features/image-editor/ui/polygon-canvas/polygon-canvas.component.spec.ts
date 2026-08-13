import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Polygon } from '../../domain/polygon.model';
import { PolygonCanvas } from './polygon-canvas.component';

class FakeResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(): void {
    const contentRect = { width: 100, height: 100 } as DOMRectReadOnly;
    this.callback([{ contentRect } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }

  disconnect(): void {
    // no-op fake: nothing to release
  }
}

function firePointer(element: Element, type: string, offsetX: number, offsetY: number): void {
  const event = new Event(type) as unknown as PointerEvent;
  Object.defineProperty(event, 'offsetX', { value: offsetX });
  Object.defineProperty(event, 'offsetY', { value: offsetY });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  element.dispatchEvent(event);
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

  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);

    TestBed.configureTestingModule({ imports: [PolygonCanvas] });
    fixture = TestBed.createComponent(PolygonCanvas);
    fixture.componentRef.setInput('imageUrl', 'https://example.test/image.jpg');
    fixture.componentRef.setInput('imageAlt', 'A test image');
    fixture.detectChanges();
    fixture.detectChanges();

    canvas = fixture.nativeElement.querySelector('canvas');
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
});
