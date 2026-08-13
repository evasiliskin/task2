import { NormalizedPoint } from '../normalized-point.model';
import { addPoints, rotatePoint, rotatePointAspectCorrected, subtractPoints } from './point-math';

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

describe('rotatePoint', () => {
  const cases: [NormalizedPoint, number, NormalizedPoint][] = [
    [{ x: 1, y: 0 }, 0, { x: 1, y: 0 }],
    [{ x: 1, y: 0 }, Math.PI / 2, { x: 0, y: 1 }],
    [{ x: 1, y: 0 }, Math.PI, { x: -1, y: 0 }],
    [{ x: 0, y: 1 }, Math.PI / 2, { x: -1, y: 0 }],
    [{ x: 0, y: 0 }, Math.PI / 2, { x: 0, y: 0 }],
  ];

  it.each(cases)(
    'should rotate %j by %j radians around the origin to ~%j, when applying the rotation matrix',
    (point, radians, expected) => {
      const result = rotatePoint(point, radians);
      expect(result.x).toBeCloseTo(expected.x, 9);
      expect(result.y).toBeCloseTo(expected.y, 9);
    },
  );
});

describe('rotatePointAspectCorrected', () => {
  it('should match rotatePoint exactly, when aspectRatio is 1', () => {
    const result = rotatePointAspectCorrected({ x: 1, y: 0 }, Math.PI / 2, 1);

    expect(result.x).toBeCloseTo(0, 9);
    expect(result.y).toBeCloseTo(1, 9);
  });

  it('should apply the aspect correction and differ from the aspectRatio=1 result, when aspectRatio is 2', () => {
    const result = rotatePointAspectCorrected({ x: 1, y: 0 }, Math.PI / 2, 2);

    expect(result.x).toBeCloseTo(0, 9);
    expect(result.y).toBeCloseTo(2, 9);
  });
});
