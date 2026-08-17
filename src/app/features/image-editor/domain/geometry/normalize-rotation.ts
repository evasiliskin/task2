const FULL_TURN_RADIANS = Math.PI * 2;

export function normalizeRotation(radians: number): number {
  return ((radians % FULL_TURN_RADIANS) + FULL_TURN_RADIANS) % FULL_TURN_RADIANS;
}
