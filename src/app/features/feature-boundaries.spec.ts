import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const FEATURES_ROOT = join(dirname(fileURLToPath(import.meta.url)));
const FEATURE_BARRELS = ['@search', '@query-history', '@image-editor'];
const IMPORT_PATTERN = /from\s+'([^']+)'/g;

function typeScriptFilesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return typeScriptFilesUnder(path);
    }
    return path.endsWith('.ts') ? [path] : [];
  });
}

function importSpecifiersIn(path: string): string[] {
  return [...readFileSync(path, 'utf-8').matchAll(IMPORT_PATTERN)].map((match) => match[1]);
}

function ownFeatureOf(path: string): string | null {
  const relativePath = relative(FEATURES_ROOT, dirname(path));
  const [firstSegment] = relativePath.split(sep);
  return firstSegment && firstSegment !== '..' ? firstSegment : null;
}

function featureReachedBy(path: string, specifier: string): string | null {
  const resolved = resolve(dirname(path), specifier);
  const relativePath = relative(FEATURES_ROOT, resolved);
  if (relativePath.startsWith('..')) {
    return null;
  }
  const [firstSegment] = relativePath.split(sep);
  return firstSegment ?? null;
}

describe('feature boundaries', () => {
  const files = typeScriptFilesUnder(FEATURES_ROOT);

  it('should find feature source files, when the features tree is scanned', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('should have no barrel import of another feature, when a file lives inside a feature', () => {
    const offenders = files.filter((path) =>
      importSpecifiersIn(path).some((specifier) => FEATURE_BARRELS.includes(specifier)),
    );
    expect(offenders).toEqual([]);
  });

  it('should have no relative import reaching another feature, when a file lives inside a feature', () => {
    const offenders = files.filter((path) => {
      const ownFeature = ownFeatureOf(path);
      if (!ownFeature) {
        return false;
      }
      return importSpecifiersIn(path)
        .filter((specifier) => specifier.startsWith('./') || specifier.startsWith('../'))
        .some((specifier) => {
          const reachedFeature = featureReachedBy(path, specifier);
          return reachedFeature !== null && reachedFeature !== ownFeature;
        });
    });
    expect(offenders).toEqual([]);
  });
});
