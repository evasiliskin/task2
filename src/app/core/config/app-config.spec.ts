import { AppConfigError, appConfig, createAppConfig } from './app-config';
import { APP_CONFIG_DEFAULTS } from './app-config.defaults';
import { appConfigSchema } from './app-config.schema';

describe('createAppConfig', () => {
  it('should resolve to the defaults, when the environment overrides nothing', () => {
    expect(createAppConfig({})).toEqual(APP_CONFIG_DEFAULTS);
  });

  it('should keep sibling defaults, when an environment overrides one leaf', () => {
    const config = createAppConfig({ api: { openverse: { pageSize: 42 } } });

    expect(config.api.openverse.pageSize).toBe(42);
    expect(config.api.openverse.baseUrl).toBe(APP_CONFIG_DEFAULTS.api.openverse.baseUrl);
    expect(config.search.debounceMs).toBe(APP_CONFIG_DEFAULTS.search.debounceMs);
  });

  it('should freeze the resolved config, when it is created', () => {
    const config = createAppConfig({});

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.search.cache)).toBe(true);
  });

  it.each([
    ['a non-URL base URL', { api: { openverse: { baseUrl: 'not-a-url' } } }],
    ['a base URL with a trailing slash', { api: { openverse: { baseUrl: 'https://x.test/' } } }],
    ['a fractional page size', { api: { openverse: { pageSize: 1.5 } } }],
    ['a negative retry count', { http: { maxRetryAttempts: -1 } }],
    ['a zero cache TTL', { search: { cache: { ttlMs: 0 } } }],
    ['fewer than three polygon points', { imageEditor: { polygon: { minPoints: 2 } } }],
    ['a scale range that is inverted', { imageEditor: { polygon: { minScale: 9 } } }],
    ['a shrinking keyboard scale step', { imageEditor: { keyboard: { scaleStep: 0.9 } } }],
    ['a nudge step outside the normalized range', { imageEditor: { keyboard: { nudgeStep: 2 } } }],
    ['an unusable stroke color', { imageEditor: { render: { strokeColor: '!!!' } } }],
    ['a too-short SEO description', { seo: { description: 'short' } }],
    ['a relative Open Graph image path', { seo: { ogImagePath: 'og-image.png' } }],
  ])('should reject the configuration, when the environment supplies %s', (_case, overrides) => {
    expect(() => createAppConfig(overrides)).toThrow(AppConfigError);
  });

  it('should name the offending path, when validation fails', () => {
    expect(() => createAppConfig({ search: { debounceMs: -1 } })).toThrow(/search\.debounceMs/);
  });

  it('should drop unknown keys, when an environment sets a value the schema does not declare', () => {
    const config = createAppConfig({ unknownSection: { value: 1 } } as never);

    expect(config).not.toHaveProperty('unknownSection');
  });
});

describe('appConfig', () => {
  it('should satisfy the schema, when the application imports it', () => {
    expect(appConfigSchema.safeParse(appConfig).success).toBe(true);
  });
});

describe('APP_CONFIG_DEFAULTS', () => {
  it('should satisfy the schema, when used as the base layer', () => {
    expect(appConfigSchema.safeParse(APP_CONFIG_DEFAULTS).success).toBe(true);
  });
});
