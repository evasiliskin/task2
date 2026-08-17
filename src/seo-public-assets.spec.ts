import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppConfig } from './app/core/config/app-config';
import { environment as productionEnvironment } from './environments/environment.production';

function readPublicFile(name: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../public', name), 'utf-8');
}

const productionSiteUrl = createAppConfig(productionEnvironment).seo.siteUrl;

describe('public/robots.txt', () => {
  it('should allow indexing and point to the sitemap, when crawlers read robots.txt', () => {
    const robotsTxt = readPublicFile('robots.txt');
    expect(robotsTxt).toMatch(/User-agent:\s*\*/);
    expect(robotsTxt).toMatch(/Allow:\s*\//);
    expect(robotsTxt).toContain(`Sitemap: ${productionSiteUrl}/sitemap.xml`);
  });
});

describe('public/sitemap.xml', () => {
  it("should list exactly the app's one real URL, when crawlers read the sitemap", () => {
    const sitemapXml = readPublicFile('sitemap.xml');
    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    expect(locs).toEqual([`${productionSiteUrl}/`]);
  });
});
