import { NormalizedPoint } from '../normalized-point.model';
import { addPoints, rotatePointAspectCorrected, scalePoint, subtractPoints } from './point-math';

describe('addPoints', () => {
  const cases: [NormalizedPoint, NormalizedPoint, NormalizedPoint][] = [
    [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 4, y: 6 },
    ],
    [
      { x: -1, y: 0.5 },
      { x: 1, y: -0.5 },
      { x: 0, y: 0 },
    ],
  ];

  it.each(cases)('should add %j and %j to get %j, when combining two points', (a, b, expected) => {
    expect(addPoints(a, b)).toEqual(expected);
  });
});

describe('subtractPoints', () => {
  const cases: [NormalizedPoint, NormalizedPoint, NormalizedPoint][] = [
    [
      { x: 4, y: 6 },
      { x: 3, y: 4 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    [
      { x: 1, y: 1 },
      { x: 2, y: 3 },
      { x: -1, y: -2 },
    ],
  ];

  it.each(cases)(
    'should subtract %j from %j to get %j, when computing the difference',
    (a, b, expected) => {
      expect(subtractPoints(a, b)).toEqual(expected);
    },
  );
});

describe('rotatePointAspectCorrected', () => {
  it('should match the hand-computed rotation, when aspectRatio is 1', () => {
    const point: NormalizedPoint = { x: 1, y: 0 };
    const radians = Math.PI / 2;

    const result = rotatePointAspectCorrected(point, radians, 1);

    expect(result.x).toBeCloseTo(point.x * Math.cos(radians) - point.y * Math.sin(radians), 9);
    expect(result.y).toBeCloseTo(point.x * Math.sin(radians) + point.y * Math.cos(radians), 9);
  });

  it('should apply the aspect correction and differ from the aspectRatio=1 result, when aspectRatio is 2', () => {
    const result = rotatePointAspectCorrected({ x: 1, y: 0 }, Math.PI / 2, 2);

    expect(result.x).toBeCloseTo(0, 9);
    expect(result.y).toBeCloseTo(2, 9);
  });
});

describe('scalePoint', () => {
  it('should multiply both axes by the scale, when scaling a local point', () => {
    expect(scalePoint({ x: 0.2, y: -0.1 }, 2)).toEqual({ x: 0.4, y: -0.2 });
  });

  it('should return the origin unchanged, when scaling the local origin', () => {
    expect(scalePoint({ x: 0, y: 0 }, 3)).toEqual({ x: 0, y: 0 });
  });
});
