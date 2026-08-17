import { appConfig } from '@core/config/app-config';
import { toPolygonCommand } from './polygon-keyboard-commands';

const { nudgeStep, rotationStepRadians, scaleStep } = appConfig.imageEditor.keyboard;

describe('toPolygonCommand', () => {
  it('should map ArrowUp to an upward move, when the arrow key is pressed', () => {
    expect(toPolygonCommand('ArrowUp')).toEqual({
      kind: 'move',
      delta: { x: 0, y: -nudgeStep },
      direction: 'up',
    });
  });

  it('should map ] to a clockwise rotation, when the bracket key is pressed', () => {
    expect(toPolygonCommand(']')).toEqual({
      kind: 'rotate',
      deltaRadians: rotationStepRadians,
      direction: 'clockwise',
    });
  });

  it('should map both + and = to the same scale-up command, when either key is pressed', () => {
    expect(toPolygonCommand('+')).toEqual({ kind: 'scale', factor: scaleStep });
    expect(toPolygonCommand('=')).toEqual(toPolygonCommand('+'));
  });

  it('should map - to a scale-down command, when the minus key is pressed', () => {
    expect(toPolygonCommand('-')).toEqual({ kind: 'scale', factor: 1 / scaleStep });
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
