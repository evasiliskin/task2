type UnknownRecord = Record<string, unknown>;

function isMergeableRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeConfigLayers(base: UnknownRecord, overrides: UnknownRecord): UnknownRecord {
  const merged: UnknownRecord = { ...base };

  for (const [key, overrideValue] of Object.entries(overrides)) {
    if (overrideValue === undefined) {
      continue;
    }
    const baseValue = base[key];
    merged[key] =
      isMergeableRecord(baseValue) && isMergeableRecord(overrideValue)
        ? mergeConfigLayers(baseValue, overrideValue)
        : overrideValue;
  }

  return merged;
}
