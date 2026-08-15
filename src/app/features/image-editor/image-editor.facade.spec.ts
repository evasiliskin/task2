import { TestBed } from '@angular/core/testing';
import { provideState, provideStore, Store } from '@ngrx/store';
import { describe, expect, it } from 'vitest';
import { CLOCK } from '@core/time/clock.token';
import { POLYGON_ID } from './domain/polygon-id.token';
import { ImageEditorFacade } from './image-editor.facade';
import { ImageEditorActions } from './state/image-editor.actions';
import { imageEditorFeature, MAX_STORED_POLYGONS } from './state/image-editor.reducer';

const TRIANGLE = [
  { x: 0.2, y: 0.2 },
  { x: 0.4, y: 0.2 },
  { x: 0.3, y: 0.4 },
];

function configure(ids: string[] = ['generated-id'], now: () => number = () => 0) {
  const queue = [...ids];
  TestBed.configureTestingModule({
    providers: [
      provideStore(),
      provideState(imageEditorFeature),
      { provide: POLYGON_ID, useValue: () => queue.shift() ?? 'exhausted' },
      { provide: CLOCK, useValue: now },
    ],
  });
  return { facade: TestBed.inject(ImageEditorFacade), store: TestBed.inject(Store) };
}

describe('ImageEditorFacade', () => {
  it('should expose only the polygons of the requested image, when several images have polygons', () => {
    const { facade } = configure(['a1', 'b1']);

    facade.createPolygon(TRIANGLE, 'image-a');
    facade.createPolygon(TRIANGLE, 'image-b');

    expect(
      facade
        .polygonsFor('image-a')()
        .map((polygon) => polygon.id),
    ).toEqual(['a1']);
  });

  it('should expose both polygons, when one image has two', () => {
    const { facade } = configure(['a1', 'a2']);

    facade.createPolygon(TRIANGLE, 'image-a');
    facade.createPolygon(TRIANGLE, 'image-a');

    expect(facade.polygonsFor('image-a')()).toHaveLength(2);
  });

  it('should expose the newly created polygon as selected, when one is created', () => {
    const { facade } = configure(['a1']);

    facade.createPolygon(TRIANGLE, 'image-a');

    expect(facade.selectedPolygonFor('image-a')()?.id).toBe('a1');
  });

  it('should expose no selection, when the selected polygon belongs to another image', () => {
    const { facade } = configure(['a1', 'b1']);

    facade.createPolygon(TRIANGLE, 'image-a');
    facade.createPolygon(TRIANGLE, 'image-b');

    expect(facade.selectedPolygonFor('image-a')()).toBeNull();
  });

  it('should dispatch a clamped scale, when scalePolygon is called', () => {
    const { facade, store } = configure(['a1']);
    facade.createPolygon(TRIANGLE, 'image-a');

    store.dispatch(ImageEditorActions.polygonScaled({ polygonId: 'a1', scale: 2 }));

    expect(facade.polygonsFor('image-a')()[0].scale).toBe(2);
  });

  it('should stamp the created polygon with the injected clock value, when a polygon is created', () => {
    const { facade } = configure(['a1'], () => 42);

    facade.createPolygon(TRIANGLE, 'image-a');

    expect(facade.polygonsFor('image-a')()[0].createdAt).toBe(42);
  });

  it('should report at capacity, when the polygon count reaches the storage limit', () => {
    const ids = Array.from({ length: MAX_STORED_POLYGONS }, (_unused, index) => `p${index}`);
    const { facade } = configure(ids);

    ids.forEach(() => facade.createPolygon(TRIANGLE, 'image-a'));

    expect(facade.isAtCapacity()).toBe(true);
  });

  it('should not report at capacity, when the polygon count is below the storage limit', () => {
    const { facade } = configure(['a1']);

    facade.createPolygon(TRIANGLE, 'image-a');

    expect(facade.isAtCapacity()).toBe(false);
  });
});
