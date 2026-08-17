import * as z from 'zod/mini';

const positiveInt = z.int().check(z.positive());
const nonNegativeInt = z.int().check(z.nonnegative());
const positiveNumber = z.number().check(z.positive());
const cssColor = z
  .string()
  .check(
    z.regex(
      /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.\s,%/]+\)|hsla?\(\s*[\d.\s,%/deg]+\)|[a-zA-Z]+)$/,
      'must be a CSS color (hex, rgb/rgba, hsl/hsla or a named color)',
    ),
  );
const absoluteUrlWithoutTrailingSlash = z
  .url()
  .check(z.refine((value) => !value.endsWith('/'), 'must not end with a trailing slash'));

const openverseApiConfigSchema = z.readonly(
  z.object({
    baseUrl: absoluteUrlWithoutTrailingSlash,
    pageSize: positiveInt.check(z.maximum(500)),
  }),
);

const httpConfigSchema = z.readonly(
  z.object({
    requestTimeoutMs: positiveInt,
    maxRetryAttempts: nonNegativeInt,
    retryBaseDelayMs: positiveInt,
    retryableStatuses: z.readonly(z.array(nonNegativeInt)),
    idempotentMethods: z.readonly(z.array(z.string().check(z.minLength(1)))),
  }),
);

const searchConfigSchema = z.readonly(
  z.object({
    debounceMs: nonNegativeInt,
    minQueryLength: positiveInt,
    cache: z.readonly(
      z.object({
        maxEntries: positiveInt,
        ttlMs: positiveInt,
      }),
    ),
    results: z.readonly(
      z.object({
        rowHeightPx: positiveInt,
        nearEndPrefetchRows: positiveInt,
      }),
    ),
  }),
);

const queryHistoryConfigSchema = z.readonly(
  z.object({
    maxEntries: positiveInt,
    suggestionLimit: positiveInt,
  }),
);

const imageEditorConfigSchema = z.readonly(
  z.object({
    maxStoredPolygons: positiveInt,
    polygon: z.readonly(
      z.object({
        minPoints: positiveInt.check(z.minimum(3)),
        minScale: positiveNumber,
        maxScale: positiveNumber,
      }),
    ),
    handles: z.readonly(
      z.object({
        rotationOffsetPx: positiveNumber,
        edgeInsetPx: positiveNumber,
        flipTolerancePx: positiveNumber,
        rotationHitRadiusPx: positiveNumber,
        scaleHitRadiusPx: positiveNumber,
        drawCloseHitRadiusPx: positiveNumber,
      }),
    ),
    keyboard: z.readonly(
      z.object({
        nudgeStep: positiveNumber.check(z.maximum(1)),
        rotationStepRadians: positiveNumber,
        scaleStep: z.number().check(z.gt(1)),
      }),
    ),
    render: z.readonly(
      z.object({
        strokeColor: cssColor,
        mutedStrokeColor: cssColor,
        fillColor: cssColor,
        vertexRadius: positiveNumber,
        handleRadius: positiveNumber,
        lineWidth: positiveNumber,
      }),
    ),
  }),
);

const seoConfigSchema = z.readonly(
  z.object({
    siteName: z.string().check(z.minLength(1)),
    siteUrl: absoluteUrlWithoutTrailingSlash,
    description: z.string().check(z.minLength(20)),
    ogImagePath: z.string().check(z.startsWith('/')),
    ogImageWidth: positiveInt,
    ogImageHeight: positiveInt,
    twitterCard: z.enum(['summary', 'summary_large_image']),
    applicationCategory: z.string().check(z.minLength(1)),
    operatingSystem: z.string().check(z.minLength(1)),
  }),
);

export const appConfigSchema = z
  .readonly(
    z.object({
      api: z.readonly(z.object({ openverse: openverseApiConfigSchema })),
      http: httpConfigSchema,
      search: searchConfigSchema,
      queryHistory: queryHistoryConfigSchema,
      imageEditor: imageEditorConfigSchema,
      seo: seoConfigSchema,
    }),
  )
  .check(
    z.refine(
      (config) => config.imageEditor.polygon.minScale < config.imageEditor.polygon.maxScale,
      {
        message: 'minScale must be smaller than maxScale',
        path: ['imageEditor', 'polygon', 'minScale'],
      },
    ),
  );

export type AppConfig = z.infer<typeof appConfigSchema>;

export type OpenverseApiConfig = AppConfig['api']['openverse'];
export type HttpConfig = AppConfig['http'];
export type SearchConfig = AppConfig['search'];
export type QueryHistoryConfig = AppConfig['queryHistory'];
export type ImageEditorConfig = AppConfig['imageEditor'];
export type PolygonRenderOptions = ImageEditorConfig['render'];
export type SeoConfig = AppConfig['seo'];

export type AppConfigOverrides = DeepPartial<AppConfig>;

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
