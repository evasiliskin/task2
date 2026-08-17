import { appConfig } from '@core/config/app-config';
import { NormalizedPoint } from '../../domain/normalized-point.model';

const { nudgeStep, rotationStepRadians, scaleStep } = appConfig.imageEditor.keyboard;

export type PolygonCommand =
  | { readonly kind: 'move'; readonly delta: NormalizedPoint; readonly direction: string }
  | { readonly kind: 'rotate'; readonly deltaRadians: number; readonly direction: string }
  | { readonly kind: 'scale'; readonly factor: number }
  | { readonly kind: 'deselect' }
  | { readonly kind: 'delete' };

const COMMANDS: Readonly<Record<string, PolygonCommand>> = {
  ArrowUp: { kind: 'move', delta: { x: 0, y: -nudgeStep }, direction: 'up' },
  ArrowDown: { kind: 'move', delta: { x: 0, y: nudgeStep }, direction: 'down' },
  ArrowLeft: { kind: 'move', delta: { x: -nudgeStep, y: 0 }, direction: 'left' },
  ArrowRight: { kind: 'move', delta: { x: nudgeStep, y: 0 }, direction: 'right' },
  '[': {
    kind: 'rotate',
    deltaRadians: -rotationStepRadians,
    direction: 'counterclockwise',
  },
  ']': { kind: 'rotate', deltaRadians: rotationStepRadians, direction: 'clockwise' },
  '+': { kind: 'scale', factor: scaleStep },
  '=': { kind: 'scale', factor: scaleStep },
  '-': { kind: 'scale', factor: 1 / scaleStep },
  Escape: { kind: 'deselect' },
  Delete: { kind: 'delete' },
  Backspace: { kind: 'delete' },
};

export function toPolygonCommand(key: string): PolygonCommand | null {
  return COMMANDS[key] ?? null;
}
