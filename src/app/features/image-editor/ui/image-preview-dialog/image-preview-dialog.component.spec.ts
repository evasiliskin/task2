import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import { ImageEditorFacade } from '../../image-editor.facade';
import { ImagePreviewTarget } from '../../domain/image-preview-target.model';
import { NormalizedPoint } from '../../domain/normalized-point.model';
import { Polygon } from '../../domain/polygon.model';
import { ImagePreviewDialog } from './image-preview-dialog.component';

@Component({ selector: 'app-polygon-canvas', template: '' })
class FakePolygonCanvas {
  readonly imageUrl = input.required<string>();
  readonly imageAlt = input.required<string>();
  readonly polygon = input<Polygon | null>(null);
  readonly polygonDrawn = output<readonly NormalizedPoint[]>();
  readonly polygonMoved = output<NormalizedPoint>();
  readonly polygonRotated = output<number>();
}

describe('ImagePreviewDialog', () => {
  const target: ImagePreviewTarget = {
    imageId: 'image-1',
    imageUrl: 'https://example.test/full.jpg',
    title: 'A mountain',
  };

  function configure(polygon: Polygon | null = null) {
    const facade = {
      polygonFor$: vi.fn().mockReturnValue(of(polygon)),
      createPolygon: vi.fn(),
      movePolygon: vi.fn(),
      rotatePolygon: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [ImagePreviewDialog],
      providers: [
        { provide: NZ_MODAL_DATA, useValue: target },
        { provide: ImageEditorFacade, useValue: facade },
      ],
    }).overrideComponent(ImagePreviewDialog, { set: { imports: [FakePolygonCanvas] } });

    return facade;
  }

  it('should pass the target image and the polygon from the facade down to the canvas', () => {
    const polygon = { id: 'image-1' } as unknown as Polygon;
    configure(polygon);
    const fixture = TestBed.createComponent(ImagePreviewDialog);
    fixture.detectChanges();

    const canvas = fixture.debugElement.query(By.directive(FakePolygonCanvas))
      .componentInstance as FakePolygonCanvas;

    expect(canvas.imageUrl()).toBe(target.imageUrl);
    expect(canvas.imageAlt()).toBe(target.title);
    expect(canvas.polygon()).toEqual(polygon);
  });

  it('should create a polygon via the facade, when the canvas emits polygonDrawn', () => {
    const facade = configure();
    const fixture = TestBed.createComponent(ImagePreviewDialog);
    fixture.detectChanges();

    const canvas = fixture.debugElement.query(By.directive(FakePolygonCanvas))
      .componentInstance as FakePolygonCanvas;
    const points: NormalizedPoint[] = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.1 },
      { x: 0.15, y: 0.2 },
    ];
    canvas.polygonDrawn.emit(points);

    expect(facade.createPolygon).toHaveBeenCalledWith(points, 'image-1');
  });

  it('should move the polygon via the facade, when the canvas emits polygonMoved', () => {
    const facade = configure();
    const fixture = TestBed.createComponent(ImagePreviewDialog);
    fixture.detectChanges();

    const canvas = fixture.debugElement.query(By.directive(FakePolygonCanvas))
      .componentInstance as FakePolygonCanvas;
    canvas.polygonMoved.emit({ x: 0.4, y: 0.4 });

    expect(facade.movePolygon).toHaveBeenCalledWith('image-1', { x: 0.4, y: 0.4 });
  });

  it('should rotate the polygon via the facade, when the canvas emits polygonRotated', () => {
    const facade = configure();
    const fixture = TestBed.createComponent(ImagePreviewDialog);
    fixture.detectChanges();

    const canvas = fixture.debugElement.query(By.directive(FakePolygonCanvas))
      .componentInstance as FakePolygonCanvas;
    canvas.polygonRotated.emit(Math.PI / 4);

    expect(facade.rotatePolygon).toHaveBeenCalledWith('image-1', Math.PI / 4);
  });
});
