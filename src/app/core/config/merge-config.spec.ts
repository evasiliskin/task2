import { mergeConfigLayers } from './merge-config';

describe('mergeConfigLayers', () => {
  it('should keep every base value, when the override layer is empty', () => {
    const base = { a: 1, nested: { b: 2 } };

    expect(mergeConfigLayers(base, {})).toEqual({ a: 1, nested: { b: 2 } });
  });

  it('should replace only the overridden leaf, when a nested value is overridden', () => {
    const base = { nested: { kept: 'base', replaced: 'base' } };

    const merged = mergeConfigLayers(base, { nested: { replaced: 'override' } });

    expect(merged).toEqual({ nested: { kept: 'base', replaced: 'override' } });
  });

  it('should replace an array wholesale, when the override lists one', () => {
    const merged = mergeConfigLayers({ statuses: [1, 2, 3] }, { statuses: [500] });

    expect(merged).toEqual({ statuses: [500] });
  });

  it('should ignore an explicit undefined, when an override key is not set', () => {
    const merged = mergeConfigLayers({ a: 1 }, { a: undefined });

    expect(merged).toEqual({ a: 1 });
  });

  it('should not mutate the base layer, when an override is applied', () => {
    const base = { nested: { value: 'base' } };

    mergeConfigLayers(base, { nested: { value: 'override' } });

    expect(base.nested.value).toBe('base');
  });
});
