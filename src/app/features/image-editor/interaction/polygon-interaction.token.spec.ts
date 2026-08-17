import { TestBed } from '@angular/core/testing';
import { PolygonInteractionController } from './polygon-interaction-controller';
import { POLYGON_INTERACTION_CONTROLLER } from './polygon-interaction.token';

describe('POLYGON_INTERACTION_CONTROLLER', () => {
  it('should resolve a PolygonInteractionController, when no override is provided', () => {
    expect(TestBed.inject(POLYGON_INTERACTION_CONTROLLER)).toBeInstanceOf(
      PolygonInteractionController,
    );
  });

  it('should resolve the override, when a test replaces the controller', () => {
    const replacement = new PolygonInteractionController();
    TestBed.configureTestingModule({
      providers: [{ provide: POLYGON_INTERACTION_CONTROLLER, useValue: replacement }],
    });

    expect(TestBed.inject(POLYGON_INTERACTION_CONTROLLER)).toBe(replacement);
  });
});
