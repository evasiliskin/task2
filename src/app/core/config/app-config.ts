import { environment } from '@environments/environment';
import { APP_CONFIG_DEFAULTS } from './app-config.defaults';
import { AppConfig, AppConfigOverrides, appConfigSchema } from './app-config.schema';
import { mergeConfigLayers } from './merge-config';

export class AppConfigError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid application configuration:\n${issues.join('\n')}`);
    this.name = 'AppConfigError';
  }
}

export function createAppConfig(overrides: AppConfigOverrides = {}): AppConfig {
  const merged = mergeConfigLayers(
    APP_CONFIG_DEFAULTS as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>,
  );
  const result = appConfigSchema.safeParse(merged);

  if (!result.success) {
    throw new AppConfigError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`),
    );
  }

  return result.data;
}

export const appConfig: AppConfig = createAppConfig(environment);
