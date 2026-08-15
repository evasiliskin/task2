export const NO_ACTIVE_SUGGESTION = -1;

/** Wrapping index arithmetic for `aria-activedescendant` navigation over a suggestion list. */
export function nextActiveIndex(current: number, count: number, delta: number): number {
  if (count <= 0) {
    return NO_ACTIVE_SUGGESTION;
  }
  if (current < 0) {
    return delta > 0 ? 0 : count - 1;
  }
  return (current + delta + count) % count;
}
