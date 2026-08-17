import { TestBed } from '@angular/core/testing';
import { provideState, provideStore } from '@ngrx/store';
import { CLOCK } from '@core/time/clock.token';
import { appConfig } from '@core/config/app-config';
import { POLYGON_ID } from './domain/polygon-id.token';
import { ImageEditorFacade } from './image-editor.facade';
import { imageEditorFeature } from './state/image-editor.reducer';

const { maxStoredPolygons } = appConfig.imageEditor;
const { maxScale } = appConfig.imageEditor.polygon;

const FIRST_IMAGE_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const SECOND_IMAGE_ID = 'b6a1d4e2-9f3c-4a7b-8d21-5c7e0f9a1b34';
const FIRST_POLYGON_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const SECOND_POLYGON_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8';

const TRIANGLE = [
  { x: 0.2, y: 0.2 },
  { x: 0.4, y: 0.2 },
  { x: 0.3, y: 0.4 },
];

function configure(
  ids: string[] = [FIRST_POLYGON_ID],
  now: () => number = () => 0,
): ImageEditorFacade {
  const queue = [...ids];
  TestBed.configureTestingModule({
    providers: [
      provideStore(),
      provideState(imageEditorFeature),
      { provide: POLYGON_ID, useValue: () => queue.shift() ?? 'exhausted' },
      { provide: CLOCK, useValue: now },
    ],
  });

  return TestBed.inject(ImageEditorFacade);
}

describe('ImageEditorFacade', () => {
  it('should expose no polygons, when nothing has been drawn on the image', () => {
    const facade = configure();

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()).toEqual([]);
  });

  it('should expose only the polygons of the requested image, when several images have polygons', () => {
    const facade = configure([FIRST_POLYGON_ID, SECOND_POLYGON_ID]);

    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);
    facade.createPolygon(TRIANGLE, SECOND_IMAGE_ID);

    expect(
      facade
        .polygonsFor(FIRST_IMAGE_ID)()
        .map((polygon) => polygon.id),
    ).toEqual([FIRST_POLYGON_ID]);
  });

  it('should expose both polygons, when one image has two', () => {
    const facade = configure([FIRST_POLYGON_ID, SECOND_POLYGON_ID]);

    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);
    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()).toHaveLength(2);
  });

  it('should expose the newly created polygon as selected, when one is created', () => {
    const facade = configure();

    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    expect(facade.selectedPolygonFor(FIRST_IMAGE_ID)()?.id).toBe(FIRST_POLYGON_ID);
  });

  it('should expose no selection, when the selected polygon belongs to another image', () => {
    const facade = configure([FIRST_POLYGON_ID, SECOND_POLYGON_ID]);

    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);
    facade.createPolygon(TRIANGLE, SECOND_IMAGE_ID);

    expect(facade.selectedPolygonFor(FIRST_IMAGE_ID)()).toBeNull();
  });

  it('should stamp the created polygon with the injected clock value, when a polygon is created', () => {
    const facade = configure([FIRST_POLYGON_ID], () => 42);

    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()[0].createdAt).toBe(42);
  });

  it('should move the polygon, when it is moved through the facade', () => {
    const facade = configure();
    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    facade.movePolygon(FIRST_POLYGON_ID, { x: 0.25, y: 0.75 });

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()[0].position).toEqual({ x: 0.25, y: 0.75 });
  });

  it('should rotate the polygon, when it is rotated through the facade', () => {
    const facade = configure();
    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    facade.rotatePolygon(FIRST_POLYGON_ID, Math.PI / 2);

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()[0].rotationRadians).toBeCloseTo(Math.PI / 2, 9);
  });

  it('should scale the polygon, when it is scaled through the facade', () => {
    const facade = configure();
    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    facade.scalePolygon(FIRST_POLYGON_ID, 2);

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()[0].scale).toBe(2);
  });

  it('should clamp the scale, when it is scaled beyond the allowed maximum', () => {
    const facade = configure();
    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    facade.scalePolygon(FIRST_POLYGON_ID, maxScale + 10);

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()[0].scale).toBe(maxScale);
  });

  it('should remove the polygon, when it is deleted through the facade', () => {
    const facade = configure();
    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    facade.deletePolygon(FIRST_POLYGON_ID);

    expect(facade.polygonsFor(FIRST_IMAGE_ID)()).toEqual([]);
  });

  it('should clear the selection, when it is deselected through the facade', () => {
    const facade = configure();
    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    facade.selectPolygon(null);

    expect(facade.selectedPolygonFor(FIRST_IMAGE_ID)()).toBeNull();
  });

  it('should report at capacity, when the polygon count reaches the storage limit', () => {
    const ids = Array.from(
      { length: maxStoredPolygons },
      (_unused, index) => `${FIRST_POLYGON_ID.slice(0, -3)}${(index + 100).toString(16)}`,
    );
    const facade = configure(ids);

    ids.forEach(() => facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID));

    expect(facade.isAtCapacity()).toBe(true);
  });

  it('should not report at capacity, when the polygon count is below the storage limit', () => {
    const facade = configure();

    facade.createPolygon(TRIANGLE, FIRST_IMAGE_ID);

    expect(facade.isAtCapacity()).toBe(false);
  });
});
