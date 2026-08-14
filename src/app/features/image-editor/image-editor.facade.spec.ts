import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ImageEditorActions } from './state/image-editor.actions';
import { ImageEditorFacade } from './image-editor.facade';
import { Polygon } from './domain/polygon.model';
import { imageEditorFeature, initialState, polygonAdapter } from './state/image-editor.reducer';

const POLYGON: Polygon = {
  id: 'image-1',
  imageId: 'image-1',
  points: [
    { x: 0, y: 0 },
    { x: 0.4, y: 0 },
    { x: 0.2, y: 0.6 },
  ],
  position: { x: 0.2, y: 0.2 },
  rotationRadians: 0,
};

describe('ImageEditorFacade', () => {
  let facade: ImageEditorFacade;
  let dispatchSpy: ReturnType<typeof vi.fn>;
  let selectSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    dispatchSpy = vi.fn();
    selectSpy = vi.fn().mockReturnValue(of(null));

    TestBed.configureTestingModule({
      providers: [
        ImageEditorFacade,
        { provide: Store, useValue: { select: selectSpy, dispatch: dispatchSpy } },
      ],
    });
    facade = TestBed.inject(ImageEditorFacade);
  });

  it('should dispatch polygonCreated with a polygon derived from the raw points, when createPolygon() is called', () => {
    facade.createPolygon(
      [
        { x: 0, y: 0 },
        { x: 0.4, y: 0 },
        { x: 0.2, y: 0.6 },
      ],
      'image-1',
    );

    const call = dispatchSpy.mock.calls[0][0];
    expect(call.type).toBe('[Image Editor] Polygon Created');
    expect(call.polygon.id).toBe('image-1');
    expect(call.polygon.imageId).toBe('image-1');
    expect(call.polygon.points[0].x).toBeCloseTo(-0.2);
    expect(call.polygon.points[0].y).toBeCloseTo(-0.2);
    expect(call.polygon.points[1].x).toBeCloseTo(0.2);
    expect(call.polygon.points[1].y).toBeCloseTo(-0.2);
    expect(call.polygon.points[2].x).toBeCloseTo(0);
    expect(call.polygon.points[2].y).toBeCloseTo(0.4);
    expect(call.polygon.position.x).toBeCloseTo(0.2);
    expect(call.polygon.position.y).toBeCloseTo(0.2);
    expect(call.polygon.rotationRadians).toBe(0);
  });

  it('should dispatch polygonMoved with the imageId and position, when movePolygon() is called', () => {
    facade.movePolygon('image-1', { x: 0.4, y: 0.4 });

    expect(dispatchSpy).toHaveBeenCalledWith(
      ImageEditorActions.polygonMoved({ imageId: 'image-1', position: { x: 0.4, y: 0.4 } }),
    );
  });

  it('should dispatch polygonRotated with the imageId and rotation, when rotatePolygon() is called', () => {
    facade.rotatePolygon('image-1', Math.PI / 2);

    expect(dispatchSpy).toHaveBeenCalledWith(
      ImageEditorActions.polygonRotated({ imageId: 'image-1', rotationRadians: Math.PI / 2 }),
    );
  });

  it('should expose the stored polygon as a signal, when one exists for the image', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideMockStore({
          initialState: {
            [imageEditorFeature.name]: polygonAdapter.setAll([POLYGON], initialState),
          },
        }),
      ],
    });

    TestBed.runInInjectionContext(() => {
      const facade = TestBed.inject(ImageEditorFacade);
      expect(facade.polygonFor('image-1')()).toEqual(POLYGON);
    });
  });

  it('should dispatch polygonDeleted with the imageId, when deletePolygon() is called', () => {
    facade.deletePolygon('image-1');

    expect(dispatchSpy).toHaveBeenCalledWith(
      ImageEditorActions.polygonDeleted({ imageId: 'image-1' }),
    );
  });
});
