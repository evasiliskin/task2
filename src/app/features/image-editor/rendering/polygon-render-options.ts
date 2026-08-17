import { appConfig } from '@core/config/app-config';
import { PolygonRenderOptions } from '@core/config/app-config.schema';

export type { PolygonRenderOptions };

export const DEFAULT_POLYGON_RENDER_OPTIONS: PolygonRenderOptions = appConfig.imageEditor.render;
