import {
  KEYBOARD_NUDGE_STEP,
  KEYBOARD_ROTATION_STEP_RADIANS,
  KEYBOARD_SCALE_STEP,
} from '../../interaction/polygon-interaction-controller';
import { toPolygonCommand } from './polygon-keyboard-commands';

describe('toPolygonCommand', () => {
  it('should map ArrowUp to an upward move, when the arrow key is pressed', () => {
    expect(toPolygonCommand('ArrowUp')).toEqual({
      kind: 'move',
      delta: { x: 0, y: -KEYBOARD_NUDGE_STEP },
      direction: 'up',
    });
  });

  it('should map ] to a clockwise rotation, when the bracket key is pressed', () => {
    expect(toPolygonCommand(']')).toEqual({
      kind: 'rotate',
      deltaRadians: KEYBOARD_ROTATION_STEP_RADIANS,
      direction: 'clockwise',
    });
  });

  it('should map both + and = to the same scale-up command, when either key is pressed', () => {
    expect(toPolygonCommand('+')).toEqual({ kind: 'scale', factor: KEYBOARD_SCALE_STEP });
    expect(toPolygonCommand('=')).toEqual(toPolygonCommand('+'));
  });

  it('should map - to a scale-down command, when the minus key is pressed', () => {
    expect(toPolygonCommand('-')).toEqual({ kind: 'scale', factor: 1 / KEYBOARD_SCALE_STEP });
  });

  it('should map both Delete and Backspace to a delete command, when either key is pressed', () => {
    expect(toPolygonCommand('Delete')).toEqual({ kind: 'delete' });
    expect(toPolygonCommand('Backspace')).toEqual({ kind: 'delete' });
  });

  it('should map Escape to a deselect command, when the escape key is pressed', () => {
    expect(toPolygonCommand('Escape')).toEqual({ kind: 'deselect' });
  });

  it('should return null, when the key is not a polygon command', () => {
    expect(toPolygonCommand('a')).toBeNull();
  });
});
