import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { ImageEditorFacade } from '../../image-editor.facade';
import { ImagePreviewTarget } from '../../domain/image-preview-target.model';
import { NormalizedPoint } from '../../domain/normalized-point.model';
import { Polygon } from '../../domain/polygon.model';
import { ImagePreviewDialog } from './image-preview-dialog.component';

@Component({ selector: 'app-polygon-canvas', template: '' })
class FakePolygonCanvas {
  readonly imageUrl = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly imageWidth = input(0);
  readonly imageHeight = input(0);
  readonly polygons = input.required<readonly Polygon[]>();
  readonly selectedPolygon = input<Polygon | null>(null);
  readonly isAtCapacity = input(false);
  readonly polygonDrawn = output<readonly NormalizedPoint[]>();
  readonly polygonMoved = output<{ polygonId: string; position: NormalizedPoint }>();
  readonly polygonRotated = output<{ polygonId: string; rotationRadians: number }>();
  readonly polygonScaled = output<{ polygonId: string; scale: number }>();
  readonly polygonDeleted = output<string>();
  readonly polygonSelected = output<string | null>();
}

function squarePolygon(id: string): Polygon {
  return {
    id,
    imageId: 'image-1',
    position: { x: 0.5, y: 0.5 },
    rotationRadians: 0,
    scale: 1,
    createdAt: 0,
    points: [
      { x: -0.1, y: -0.1 },
      { x: 0.1, y: -0.1 },
      { x: 0.1, y: 0.1 },
      { x: -0.1, y: 0.1 },
    ],
  };
}

describe('ImagePreviewDialog', () => {
  const target: ImagePreviewTarget = {
    imageId: 'image-1',
    imageUrl: 'https://example.test/full.jpg',
    title: 'A mountain',
    width: 1600,
    height: 900,
  };

  function renderDialog(
    options: {
      polygons?: readonly Polygon[];
      selectedPolygon?: Polygon | null;
      isAtCapacity?: boolean;
    } = {},
  ) {
    const facade = {
      polygonsFor: vi.fn().mockReturnValue(signal(options.polygons ?? [])),
      selectedPolygonFor: vi.fn().mockReturnValue(signal(options.selectedPolygon ?? null)),
      isAtCapacity: signal(options.isAtCapacity ?? false),
      createPolygon: vi.fn(),
      movePolygon: vi.fn(),
      rotatePolygon: vi.fn(),
      scalePolygon: vi.fn(),
      deletePolygon: vi.fn(),
      selectPolygon: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [ImagePreviewDialog],
      providers: [
        { provide: NZ_MODAL_DATA, useValue: target },
        { provide: ImageEditorFacade, useValue: facade },
      ],
    }).overrideComponent(ImagePreviewDialog, { set: { imports: [FakePolygonCanvas] } });

    const fixture = TestBed.createComponent(ImagePreviewDialog);
    fixture.detectChanges();

    return { fixture, facade };
  }

  function canvasOf(fixture: ReturnType<typeof renderDialog>['fixture']) {
    return fixture.debugElement.query(By.directive(FakePolygonCanvas))
      .componentInstance as FakePolygonCanvas;
  }

  it('should pass the target image details down to the canvas', () => {
    const { fixture } = renderDialog();

    const canvas = canvasOf(fixture);

    expect(canvas.imageUrl()).toBe(target.imageUrl);
    expect(canvas.imageAlt()).toBe(target.title);
    expect(canvas.imageWidth()).toBe(target.width);
    expect(canvas.imageHeight()).toBe(target.height);
  });

  it('should pass every polygon of the target image to the canvas, when the image has two', () => {
    const { fixture } = renderDialog({ polygons: [squarePolygon('p1'), squarePolygon('p2')] });

    expect(canvasOf(fixture).polygons()).toHaveLength(2);
  });

  it('should pass the selected polygon from the facade down to the canvas', () => {
    const selectedPolygon = squarePolygon('p1');
    const { fixture } = renderDialog({ polygons: [selectedPolygon], selectedPolygon });

    expect(canvasOf(fixture).selectedPolygon()).toEqual(selectedPolygon);
  });

  it('should pass the capacity flag from the facade down to the canvas, when at capacity', () => {
    const { fixture } = renderDialog({ isAtCapacity: true });

    expect(canvasOf(fixture).isAtCapacity()).toBe(true);
  });

  it('should create a polygon via the facade, when the canvas emits polygonDrawn', () => {
    const { fixture, facade } = renderDialog();
    const points: NormalizedPoint[] = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.1 },
      { x: 0.15, y: 0.2 },
    ];

    canvasOf(fixture).polygonDrawn.emit(points);

    expect(facade.createPolygon).toHaveBeenCalledWith(points, 'image-1');
  });

  it('should move the polygon via the facade, when the canvas emits polygonMoved', () => {
    const { fixture, facade } = renderDialog();

    canvasOf(fixture).polygonMoved.emit({ polygonId: 'p1', position: { x: 0.4, y: 0.4 } });

    expect(facade.movePolygon).toHaveBeenCalledWith('p1', { x: 0.4, y: 0.4 });
  });

  it('should rotate the polygon via the facade, when the canvas emits polygonRotated', () => {
    const { fixture, facade } = renderDialog();

    canvasOf(fixture).polygonRotated.emit({ polygonId: 'p1', rotationRadians: Math.PI / 4 });

    expect(facade.rotatePolygon).toHaveBeenCalledWith('p1', Math.PI / 4);
  });

  it('should scale the polygon via the facade, when the canvas emits polygonScaled', () => {
    const { fixture, facade } = renderDialog();

    canvasOf(fixture).polygonScaled.emit({ polygonId: 'p1', scale: 2 });

    expect(facade.scalePolygon).toHaveBeenCalledWith('p1', 2);
  });

  it('should delete the polygon via the facade, when the canvas emits polygonDeleted', () => {
    const { fixture, facade } = renderDialog();

    canvasOf(fixture).polygonDeleted.emit('p1');

    expect(facade.deletePolygon).toHaveBeenCalledWith('p1');
  });

  it('should select the polygon via the facade, when the canvas emits polygonSelected', () => {
    const { fixture, facade } = renderDialog();

    canvasOf(fixture).polygonSelected.emit('p1');

    expect(facade.selectPolygon).toHaveBeenCalledWith('p1');
  });

  it('should deselect the polygon via the facade, when the canvas emits polygonSelected with null', () => {
    const { fixture, facade } = renderDialog();

    canvasOf(fixture).polygonSelected.emit(null);

    expect(facade.selectPolygon).toHaveBeenCalledWith(null);
  });
});
