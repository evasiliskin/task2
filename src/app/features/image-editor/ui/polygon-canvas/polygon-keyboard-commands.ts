import { NormalizedPoint } from '../../domain/normalized-point.model';
import {
  KEYBOARD_NUDGE_STEP,
  KEYBOARD_ROTATION_STEP_RADIANS,
  KEYBOARD_SCALE_STEP,
} from '../../interaction/polygon-interaction-controller';

export type PolygonCommand =
  | { readonly kind: 'move'; readonly delta: NormalizedPoint; readonly direction: string }
  | { readonly kind: 'rotate'; readonly deltaRadians: number; readonly direction: string }
  | { readonly kind: 'scale'; readonly factor: number }
  | { readonly kind: 'deselect' }
  | { readonly kind: 'delete' };

const COMMANDS: Readonly<Record<string, PolygonCommand>> = {
  ArrowUp: { kind: 'move', delta: { x: 0, y: -KEYBOARD_NUDGE_STEP }, direction: 'up' },
  ArrowDown: { kind: 'move', delta: { x: 0, y: KEYBOARD_NUDGE_STEP }, direction: 'down' },
  ArrowLeft: { kind: 'move', delta: { x: -KEYBOARD_NUDGE_STEP, y: 0 }, direction: 'left' },
  ArrowRight: { kind: 'move', delta: { x: KEYBOARD_NUDGE_STEP, y: 0 }, direction: 'right' },
  '[': {
    kind: 'rotate',
    deltaRadians: -KEYBOARD_ROTATION_STEP_RADIANS,
    direction: 'counterclockwise',
  },
  ']': { kind: 'rotate', deltaRadians: KEYBOARD_ROTATION_STEP_RADIANS, direction: 'clockwise' },
  '+': { kind: 'scale', factor: KEYBOARD_SCALE_STEP },
  '=': { kind: 'scale', factor: KEYBOARD_SCALE_STEP },
  '-': { kind: 'scale', factor: 1 / KEYBOARD_SCALE_STEP },
  Escape: { kind: 'deselect' },
  Delete: { kind: 'delete' },
  Backspace: { kind: 'delete' },
};

export function toPolygonCommand(key: string): PolygonCommand | null {
  return COMMANDS[key] ?? null;
}
