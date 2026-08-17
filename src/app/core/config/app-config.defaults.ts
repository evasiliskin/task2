import { AppConfig } from './app-config.schema';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  api: {
    openverse: {
      baseUrl: 'https://api.openverse.org/v1',
      pageSize: 20,
    },
  },
  http: {
    requestTimeoutMs: 15_000,
    maxRetryAttempts: 2,
    retryBaseDelayMs: 500,
    retryableStatuses: [0, 429, 500, 502, 503, 504],
    idempotentMethods: ['GET', 'HEAD'],
  },
  search: {
    debounceMs: 300,
    minQueryLength: 2,
    cache: {
      maxEntries: 30,
      ttlMs: 5 * 60 * 1000,
    },
    results: {
      rowHeightPx: 96,
      nearEndPrefetchRows: 8,
    },
  },
  queryHistory: {
    maxEntries: 50,
    suggestionLimit: 5,
  },
  imageEditor: {
    maxStoredPolygons: 200,
    polygon: {
      minPoints: 3,
      minScale: 0.1,
      maxScale: 5,
    },
    handles: {
      rotationOffsetPx: 28,
      edgeInsetPx: 6,
      flipTolerancePx: 0.5,
      rotationHitRadiusPx: 12,
      scaleHitRadiusPx: 10,
      drawCloseHitRadiusPx: 10,
    },
    keyboard: {
      nudgeStep: 0.02,
      rotationStepRadians: Math.PI / 12,
      scaleStep: 1.1,
    },
    render: {
      strokeColor: '#1677ff',
      mutedStrokeColor: 'rgba(22, 119, 255, 0.45)',
      fillColor: 'rgba(22, 119, 255, 0.15)',
      vertexRadius: 5,
      handleRadius: 6,
      lineWidth: 2,
    },
  },
  seo: {
    siteName: 'Image Search',
    siteUrl: 'https://image-search.example.com',
    description:
      'Typeahead search over millions of openly-licensed images from Openverse, with a Canvas-based polygon editor for annotating results.',
    ogImagePath: '/og-image.png',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any (runs in a web browser)',
  },
};
