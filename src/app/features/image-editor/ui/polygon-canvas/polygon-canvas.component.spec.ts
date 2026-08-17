import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PixelPoint } from '../../domain/geometry/coordinate-mapping.model';
import { Polygon } from '../../domain/polygon.model';
import { PolygonInteractionController } from '../../interaction/polygon-interaction-controller';
import { POLYGON_INTERACTION_CONTROLLER } from '../../interaction/polygon-interaction.token';
import { POLYGON_CANVAS_RENDERER } from '../../rendering/polygon-renderer.token';
import { PolygonCanvas } from './polygon-canvas.component';

const IMAGE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const POLYGON_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const SECOND_POLYGON_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

Object.defineProperty(PointerEvent.prototype, 'offsetX', {
  configurable: true,
  get(this: PointerEvent): number {
    return this.clientX;
  },
});
Object.defineProperty(PointerEvent.prototype, 'offsetY', {
  configurable: true,
  get(this: PointerEvent): number {
    return this.clientY;
  },
});

let resizeObserverInstances: FakeResizeObserver[] = [];

class FakeResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObserverInstances.push(this);
  }

  observe(): void {
    this.trigger(400, 400);
  }

  trigger(width: number, height: number): void {
    const contentRect = { width, height } as DOMRectReadOnly;
    this.callback([{ contentRect } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect(): void {}
}

let mediaQueryChangeListeners: (() => void)[] = [];

class FakeMediaQueryList {
  addEventListener(_type: string, listener: () => void): void {
    mediaQueryChangeListeners.push(listener);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  removeEventListener(): void {}
}

function setDevicePixelRatio(ratio: number): void {
  vi.stubGlobal('devicePixelRatio', ratio);
}

function squarePolygon(id: string): Polygon {
  return {
    id,
    imageId: IMAGE_ID,
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0.1, y: 0.1 },
      { x: -0.1, y: 0.1 },
    ],
    position: { x: 0.5, y: 0.5 },
    rotationRadians: 0,
    scale: 1,
    createdAt: 0,
  };
}

function scaleHandlePixel(polygon: Polygon): PixelPoint {
  return {
    x: (polygon.position.x + polygon.points[0].x) * 400,
    y: (polygon.position.y + polygon.points[0].y) * 400,
  };
}

function fireKey(element: Element, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

function findButtonByText(
  fixture: ComponentFixture<PolygonCanvas>,
  text: string,
): HTMLButtonElement {
  const buttons: HTMLButtonElement[] = Array.from(
    fixture.nativeElement.querySelectorAll('button'),
  ) as HTMLButtonElement[];
  const button = buttons.find((candidate) => candidate.textContent?.trim() === text);
  if (!button) {
    throw new Error(`Button "${text}" not found`);
  }
  return button;
}

function drawButton(fixture: ComponentFixture<PolygonCanvas>): HTMLButtonElement {
  return findButtonByText(fixture, 'Draw polygon');
}

function nextButton(fixture: ComponentFixture<PolygonCanvas>): HTMLButtonElement {
  return findButtonByText(fixture, 'Next');
}

function previousButton(fixture: ComponentFixture<PolygonCanvas>): HTMLButtonElement {
  return findButtonByText(fixture, 'Previous');
}

function finishButton(fixture: ComponentFixture<PolygonCanvas>): HTMLButtonElement {
  return findButtonByText(fixture, 'Finish polygon');
}

function cancelButton(fixture: ComponentFixture<PolygonCanvas>): HTMLButtonElement {
  return findButtonByText(fixture, 'Cancel');
}

function deleteButton(fixture: ComponentFixture<PolygonCanvas>): HTMLButtonElement {
  return findButtonByText(fixture, 'Delete polygon');
}

function canvasElement(fixture: ComponentFixture<PolygonCanvas>): HTMLCanvasElement {
  return fixture.nativeElement.querySelector('canvas');
}

function loadImage(fixture: ComponentFixture<PolygonCanvas>): void {
  const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
  img.dispatchEvent(new Event('load'));
  fixture.detectChanges();
}

function dragFrom(
  fixture: ComponentFixture<PolygonCanvas>,
  from: PixelPoint,
  to: PixelPoint,
): void {
  const canvas = canvasElement(fixture);
  canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: from.x, clientY: from.y }));
  canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: to.x, clientY: to.y }));
  canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: to.x, clientY: to.y }));
  fixture.detectChanges();
}

function startDrawing(fixture: ComponentFixture<PolygonCanvas>): void {
  loadImage(fixture);
  drawButton(fixture).click();
  fixture.detectChanges();
}

describe('PolygonCanvas', () => {
  let liveAnnouncerSpy: { announce: ReturnType<typeof vi.fn> };

  function renderCanvas(props: {
    polygons: readonly Polygon[];
    selectedPolygon: Polygon | null;
    isAtCapacity?: boolean;
    controller?: PolygonInteractionController;
  }): ComponentFixture<PolygonCanvas> {
    TestBed.configureTestingModule({
      imports: [PolygonCanvas],
      providers: [
        { provide: LiveAnnouncer, useValue: liveAnnouncerSpy },
        ...(props.controller
          ? [{ provide: POLYGON_INTERACTION_CONTROLLER, useValue: props.controller }]
          : []),
      ],
    });
    const fixture = TestBed.createComponent(PolygonCanvas);
    fixture.componentRef.setInput('imageUrl', 'https://example.test/image.jpg');
    fixture.componentRef.setInput('imageAlt', 'A test image');
    fixture.componentRef.setInput('polygons', props.polygons);
    fixture.componentRef.setInput('selectedPolygon', props.selectedPolygon);
    if (props.isAtCapacity !== undefined) {
      fixture.componentRef.setInput('isAtCapacity', props.isAtCapacity);
    }
    fixture.detectChanges();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    resizeObserverInstances = [];
    mediaQueryChangeListeners = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => new FakeMediaQueryList()),
    );
    liveAnnouncerSpy = { announce: vi.fn().mockResolvedValue(undefined) };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the image with the given url and alt text, when the canvas is rendered', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.src).toBe('https://example.test/image.jpg');
    expect(img.alt).toBe('A test image');
  });

  it('should render intrinsic width and height attributes, when the image dimensions are known', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    fixture.componentRef.setInput('imageWidth', 1600);
    fixture.componentRef.setInput('imageHeight', 900);
    fixture.detectChanges();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('width')).toBe('1600');
    expect(img.getAttribute('height')).toBe('900');
  });

  it('should not place draw points, when draw mode has not been entered', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('point(s) placed');
  });

  it('should disable the draw button, when the image has not loaded', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });

    expect(drawButton(fixture).disabled).toBe(true);
  });

  it('should enter draw mode and accept points, when the draw button is clicked after the image loads', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    loadImage(fixture);

    drawButton(fixture).click();
    fixture.detectChanges();
    canvasElement(fixture).dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('1 point(s) placed');
  });

  it('should emit polygonDrawn with the placed points, when Finish polygon is clicked after 3+ points', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    loadImage(fixture);
    drawButton(fixture).click();
    fixture.detectChanges();

    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 10 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 30, clientY: 50 }));
    fixture.detectChanges();

    expect(finishButton(fixture).disabled).toBe(false);
    finishButton(fixture).click();

    expect(drawnSpy).toHaveBeenCalledWith([
      { x: 0.025, y: 0.025 },
      { x: 0.125, y: 0.025 },
      { x: 0.075, y: 0.125 },
    ]);
  });

  it('should revert to idle mode, when Cancel is clicked after placing points', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    loadImage(fixture);
    drawButton(fixture).click();
    fixture.detectChanges();

    canvasElement(fixture).dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }),
    );
    fixture.detectChanges();

    cancelButton(fixture).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('point(s) placed');
    expect(drawButton(fixture)).not.toBeNull();
  });

  it('should ignore the pointer event, when a non-primary button starts it in draw mode', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    startDrawing(fixture);

    canvasElement(fixture).dispatchEvent(
      new PointerEvent('pointerdown', { button: 2, clientX: 10, clientY: 10, bubbles: true }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Click the image to place the first point.',
    );
  });

  it('should finish the polygon, when clicking near the first placed vertex', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    loadImage(fixture);
    drawButton(fixture).click();
    fixture.detectChanges();

    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 10 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 30, clientY: 50 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 12, clientY: 12 }));
    fixture.detectChanges();

    expect(drawnSpy).toHaveBeenCalledWith([
      { x: 0.025, y: 0.025 },
      { x: 0.125, y: 0.025 },
      { x: 0.075, y: 0.125 },
    ]);
  });

  it('should finish the polygon without a duplicate point, when the last point is double-clicked', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    loadImage(fixture);
    drawButton(fixture).click();
    fixture.detectChanges();

    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 50, clientY: 10 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 30, clientY: 50 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 30, clientY: 50 }));
    canvas.dispatchEvent(new Event('dblclick'));
    fixture.detectChanges();

    expect(drawnSpy).toHaveBeenCalledWith([
      { x: 0.025, y: 0.025 },
      { x: 0.125, y: 0.025 },
      { x: 0.075, y: 0.125 },
    ]);
  });

  it('should emit polygonSelected with null, when clicking empty canvas while a polygon is selected', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const emitted: (string | null)[] = [];
    fixture.componentInstance.polygonSelected.subscribe((id) => emitted.push(id));

    canvasElement(fixture).dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 1, clientY: 1 }),
    );

    expect(emitted).toEqual([null]);
  });

  it('should not emit polygonSelected, when clicking empty canvas while nothing is selected', () => {
    const fixture = renderCanvas({ polygons: [squarePolygon(POLYGON_ID)], selectedPolygon: null });
    loadImage(fixture);
    const emitted: (string | null)[] = [];
    fixture.componentInstance.polygonSelected.subscribe((id) => emitted.push(id));

    canvasElement(fixture).dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 1, clientY: 1 }),
    );

    expect(emitted).toEqual([]);
  });

  it('should emit polygonSelected with the polygon id, when clicking an unselected polygon body', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: null });
    loadImage(fixture);
    const emitted: (string | null)[] = [];
    fixture.componentInstance.polygonSelected.subscribe((id) => emitted.push(id));

    canvasElement(fixture).dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }),
    );

    expect(emitted).toEqual([POLYGON_ID]);
  });

  it('should emit polygonMoved with the new position, when dragging the selected polygon body and releasing the pointer', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    dragFrom(fixture, { x: 200, y: 200 }, { x: 210, y: 200 });

    expect(movedSpy).toHaveBeenCalledWith({
      polygonId: POLYGON_ID,
      position: { x: 0.525, y: 0.5 },
    });
  });

  it('should emit polygonRotated with the new rotation, when dragging the rotation handle and releasing the pointer', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const rotatedSpy = vi.fn();
    fixture.componentInstance.polygonRotated.subscribe(rotatedSpy);

    dragFrom(fixture, { x: 200, y: 132 }, { x: 300, y: 200 });

    expect(rotatedSpy).toHaveBeenCalledTimes(1);
    expect(rotatedSpy.mock.calls[0][0].polygonId).toBe(POLYGON_ID);
    expect(rotatedSpy.mock.calls[0][0].rotationRadians).toBeCloseTo(Math.PI / 2, 6);
  });

  it('should emit polygonScaled with the polygon id, when a scale handle is dragged and released', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const emitted: { polygonId: string; scale: number }[] = [];
    fixture.componentInstance.polygonScaled.subscribe((event) => emitted.push(event));

    dragFrom(fixture, scaleHandlePixel(polygon), { x: 40, y: 40 });

    expect(emitted).toHaveLength(1);
    expect(emitted[0].polygonId).toBe(POLYGON_ID);
  });

  it('should ignore a second pointerdown and keep tracking the first gesture, when it arrives before the first gesture ends', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 205, clientY: 205 }));
    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 210, clientY: 200 }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: 210, clientY: 200 }));

    expect(movedSpy).toHaveBeenCalledTimes(1);
    expect(movedSpy).toHaveBeenCalledWith({
      polygonId: POLYGON_ID,
      position: { x: 0.525, y: 0.5 },
    });
  });

  it('should abort the gesture without throwing and without emitting, when the box size becomes zero mid-drag', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    resizeObserverInstances[0].trigger(0, 0);
    fixture.detectChanges();

    expect(() =>
      canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 210, clientY: 200 })),
    ).not.toThrow();
    expect(movedSpy).not.toHaveBeenCalled();

    canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: 210, clientY: 200 }));
    expect(movedSpy).not.toHaveBeenCalled();
  });

  it('should end the gesture without emitting, when pointer capture is lost mid-drag', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const emitted: unknown[] = [];
    fixture.componentInstance.polygonMoved.subscribe((event) => emitted.push(event));
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    canvas.dispatchEvent(new PointerEvent('lostpointercapture'));
    canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 260, clientY: 260 }));

    expect(emitted).toEqual([]);
  });

  it('should release a gesture, when the pointer is released outside the canvas', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const selectedSpy = vi.fn();
    fixture.componentInstance.polygonSelected.subscribe(selectedSpy);
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    globalThis.dispatchEvent(new PointerEvent('pointerup', { clientX: 400, clientY: 400 }));

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 1, clientY: 1 }));

    expect(selectedSpy).toHaveBeenCalledWith(null);
  });

  it('should not release pointer capture, when the canvas does not hold it', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const canvas = canvasElement(fixture);
    const release = vi.fn();
    canvas.hasPointerCapture = vi.fn(() => false);
    canvas.releasePointerCapture = release;

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200 }));
    canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: 200, clientY: 200 }));

    expect(release).not.toHaveBeenCalled();
  });

  it('should emit polygonSelected with the next polygon id, when Next is clicked', () => {
    const first = squarePolygon(POLYGON_ID);
    const second = squarePolygon(SECOND_POLYGON_ID);
    const fixture = renderCanvas({ polygons: [first, second], selectedPolygon: first });
    loadImage(fixture);
    const emitted: (string | null)[] = [];
    fixture.componentInstance.polygonSelected.subscribe((id) => emitted.push(id));

    nextButton(fixture).click();

    expect(emitted).toEqual([SECOND_POLYGON_ID]);
  });

  it('should emit polygonSelected with the previous polygon id, when Previous is clicked', () => {
    const first = squarePolygon(POLYGON_ID);
    const second = squarePolygon(SECOND_POLYGON_ID);
    const fixture = renderCanvas({ polygons: [first, second], selectedPolygon: second });
    loadImage(fixture);
    const emitted: (string | null)[] = [];
    fixture.componentInstance.polygonSelected.subscribe((id) => emitted.push(id));

    previousButton(fixture).click();

    expect(emitted).toEqual([POLYGON_ID]);
  });

  it('should announce the new selection, when Next is clicked', () => {
    const first = squarePolygon(POLYGON_ID);
    const second = squarePolygon(SECOND_POLYGON_ID);
    const fixture = renderCanvas({ polygons: [first, second], selectedPolygon: first });
    loadImage(fixture);

    nextButton(fixture).click();

    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon 2 of 2 selected.');
  });

  it('should not duplicate the polygon counter as a live region, when a polygon is selected', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });

    const liveRegions = [...fixture.nativeElement.querySelectorAll('[aria-live]')].map(
      (element: Element) => element.textContent?.trim(),
    );

    expect(liveRegions.some((text) => text?.includes('Polygon 1 of 1'))).toBe(false);
  });

  it('should emit polygonDeleted with the polygon id, when Delete polygon is clicked', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const deletedSpy = vi.fn();
    fixture.componentInstance.polygonDeleted.subscribe(deletedSpy);

    deleteButton(fixture).click();
    fixture.detectChanges();

    expect(deletedSpy).toHaveBeenCalledWith(POLYGON_ID);
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon deleted.');
  });

  it('should move focus to the canvas, when the last polygon is deleted from the toolbar', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });

    const deleteBtn: HTMLButtonElement = deleteButton(fixture);
    deleteBtn.focus();
    deleteBtn.click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(canvasElement(fixture));
  });

  it('should show the capacity hint, when isAtCapacity is true', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null, isAtCapacity: true });

    expect(fixture.nativeElement.textContent).toContain('Polygon limit reached');
  });

  it('should not show the capacity hint, when isAtCapacity is false', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null, isAtCapacity: false });

    expect(fixture.nativeElement.textContent).not.toContain('Polygon limit reached');
  });

  it('should be keyboard-focusable with an accessible name describing how to start drawing, when no polygon exists yet', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    const canvas = canvasElement(fixture);

    expect(canvas.getAttribute('tabindex')).toBe('0');
    expect(canvas.getAttribute('role')).toBe('application');
    expect(canvas.getAttribute('aria-label')).toContain('Draw polygon');
  });

  it('should be keyboard-focusable with an accessible label mentioning arrow keys, when a polygon is selected', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const canvas = canvasElement(fixture);

    expect(canvas.getAttribute('tabindex')).toBe('0');
    expect(canvas.getAttribute('role')).toBe('application');
    expect(canvas.getAttribute('aria-label')).toContain('Arrow keys');
  });

  it('should emit polygonMoved and announce the direction, when ArrowRight is pressed on the selected polygon', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    fireKey(canvasElement(fixture), 'ArrowRight');
    fixture.detectChanges();

    expect(movedSpy).toHaveBeenCalledWith({ polygonId: POLYGON_ID, position: { x: 0.52, y: 0.5 } });
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon moved right.');
  });

  it('should emit polygonRotated and announce the degrees, when ] is pressed on the selected polygon', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const rotatedSpy = vi.fn();
    fixture.componentInstance.polygonRotated.subscribe(rotatedSpy);

    fireKey(canvasElement(fixture), ']');
    fixture.detectChanges();

    expect(rotatedSpy).toHaveBeenCalled();
    expect(rotatedSpy.mock.calls[0][0].polygonId).toBe(POLYGON_ID);
    expect(rotatedSpy.mock.calls[0][0].rotationRadians).toBeCloseTo(Math.PI / 12, 12);
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon rotated 15° clockwise.');
  });

  it('should emit polygonRotated in the opposite direction and announce it, when [ is pressed on the selected polygon', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const rotatedSpy = vi.fn();
    fixture.componentInstance.polygonRotated.subscribe(rotatedSpy);

    fireKey(canvasElement(fixture), '[');
    fixture.detectChanges();

    expect(rotatedSpy).toHaveBeenCalled();
    expect(rotatedSpy.mock.calls[0][0].rotationRadians).toBeCloseTo(Math.PI * 2 - Math.PI / 12, 12);
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon rotated 15° counterclockwise.');
  });

  it('should emit polygonScaled, when + is pressed on the selected polygon', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const emitted: { polygonId: string; scale: number }[] = [];
    fixture.componentInstance.polygonScaled.subscribe((event) => emitted.push(event));

    canvasElement(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: '+' }));

    expect(emitted[0].scale).toBeGreaterThan(1);
    expect(emitted[0].polygonId).toBe(POLYGON_ID);
  });

  it('should emit polygonScaled with a smaller scale, when - is pressed on the selected polygon', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const emitted: { polygonId: string; scale: number }[] = [];
    fixture.componentInstance.polygonScaled.subscribe((event) => emitted.push(event));

    canvasElement(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: '-' }));

    expect(emitted[0].scale).toBeLessThan(1);
  });

  it('should emit polygonSelected with null, when Escape is pressed on the selected polygon', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const emitted: (string | null)[] = [];
    fixture.componentInstance.polygonSelected.subscribe((id) => emitted.push(id));

    canvasElement(fixture).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(emitted).toEqual([null]);
  });

  it('should emit polygonDeleted and announce the deletion, when Delete is pressed on the selected polygon', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    const deletedSpy = vi.fn();
    fixture.componentInstance.polygonDeleted.subscribe(deletedSpy);

    fireKey(canvasElement(fixture), 'Delete');
    fixture.detectChanges();

    expect(deletedSpy).toHaveBeenCalledWith(POLYGON_ID);
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Polygon deleted.');
  });

  it('should ignore keyboard input, when no polygon is selected', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    const movedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);

    fireKey(canvasElement(fixture), 'ArrowRight');

    expect(movedSpy).not.toHaveBeenCalled();
  });

  function fakeCanvasContext(setTransform: ReturnType<typeof vi.fn>): CanvasRenderingContext2D {
    return {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setTransform,
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;
  }

  async function renderAtDevicePixelRatio(
    ratio: number,
    setTransform: ReturnType<typeof vi.fn>,
  ): Promise<{ fixture: ComponentFixture<PolygonCanvas>; canvas: HTMLCanvasElement }> {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const canvas = canvasElement(fixture);
    vi.spyOn(canvas, 'getContext').mockReturnValue(fakeCanvasContext(setTransform));
    setDevicePixelRatio(ratio);
    mediaQueryChangeListeners.forEach((listener) => listener());
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    return { fixture, canvas };
  }

  it('should size the backing store by the device pixel ratio, when the ratio changes', async () => {
    const setTransform = vi.fn();

    const { canvas } = await renderAtDevicePixelRatio(2, setTransform);

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(800);
    expect(setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  });

  it('should leave the backing store untouched, when a repaint happens at an unchanged size', async () => {
    const { fixture, canvas } = await renderAtDevicePixelRatio(2, vi.fn());

    const widthSpy = vi.spyOn(canvas, 'width', 'set');
    dragFrom(fixture, { x: 200, y: 200 }, { x: 210, y: 200 });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(widthSpy).not.toHaveBeenCalled();
  });

  it('should redraw at the new backing resolution, when the device pixel ratio changes', async () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    loadImage(fixture);
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    const canvas = canvasElement(fixture);
    const before = canvas.width;

    setDevicePixelRatio(2);
    mediaQueryChangeListeners.forEach((listener) => listener());
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(canvas.width).toBeGreaterThan(before);
  });

  it('should announce that the canvas is unavailable, when a 2D context cannot be obtained', async () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Polygon drawing is unavailable');
  });

  it('should show an error message, when the image fails to load', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The image could not be loaded');
    expect(drawButton(fixture).disabled).toBe(true);
  });

  it('should clear the loading state, when the image loads', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    loadImage(fixture);

    expect(fixture.nativeElement.textContent).not.toContain('Loading image');
  });

  it('should not place draw points, when the canvas receives pointerdown after the image failed to load', () => {
    const fixture = renderCanvas({ polygons: [], selectedPolygon: null });
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const drawnSpy = vi.fn();
    fixture.componentInstance.polygonDrawn.subscribe(drawnSpy);
    const canvas = canvasElement(fixture);

    canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    fixture.detectChanges();

    expect(drawnSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('point(s) placed');
  });

  it('should still render existing polygons underneath the draw preview, when entering draw mode with polygons already present', async () => {
    const fakeContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      rect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D;

    const existing = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [existing], selectedPolygon: null });
    loadImage(fixture);
    vi.spyOn(canvasElement(fixture), 'getContext').mockReturnValue(fakeContext);
    const renderer = TestBed.inject(POLYGON_CANVAS_RENDERER);
    const renderSpy = vi.spyOn(renderer, 'render');
    const previewSpy = vi.spyOn(renderer, 'renderDrawPreview');

    drawButton(fixture).click();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    expect(renderSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ id: POLYGON_ID })]),
      null,
      expect.anything(),
    );
    expect(previewSpy).toHaveBeenCalled();
  });

  it('should emit nothing, when the pointer moves without an active gesture', () => {
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({ polygons: [polygon], selectedPolygon: polygon });
    loadImage(fixture);
    const movedSpy = vi.fn();
    const selectedSpy = vi.fn();
    fixture.componentInstance.polygonMoved.subscribe(movedSpy);
    fixture.componentInstance.polygonSelected.subscribe(selectedSpy);

    canvasElement(fixture).dispatchEvent(
      new PointerEvent('pointermove', { clientX: 210, clientY: 200 }),
    );
    fixture.detectChanges();

    expect(movedSpy).not.toHaveBeenCalled();
    expect(selectedSpy).not.toHaveBeenCalled();
  });

  it('should drive the gesture through the injected interaction controller, when a polygon is dragged', () => {
    const controller = new PolygonInteractionController();
    const updateDrag = vi.spyOn(controller, 'updateDrag');
    const polygon = squarePolygon(POLYGON_ID);
    const fixture = renderCanvas({
      polygons: [polygon],
      selectedPolygon: polygon,
      controller,
    });
    loadImage(fixture);

    dragFrom(fixture, { x: 200, y: 200 }, { x: 210, y: 200 });

    expect(updateDrag).toHaveBeenCalled();
  });
});
