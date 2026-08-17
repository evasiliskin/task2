import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppConfig } from './app/core/config/app-config';
import { environment as productionEnvironment } from './environments/environment.production';

function readRepositoryFile(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), relativePath), 'utf-8');
}

const html = readRepositoryFile('index.html');
const { seo, api } = createAppConfig(productionEnvironment);
const canonicalUrl = `${seo.siteUrl}/`;
const socialImageUrl = `${seo.siteUrl}${seo.ogImagePath}`;

describe('index.html — static document skeleton', () => {
  it('should declare an English lang attribute, when the document loads', () => {
    expect(html).toMatch(/<html lang="en">/);
  });

  it('should declare the UTF-8 charset, when the document loads', () => {
    expect(html).toContain('<meta charset="utf-8" />');
  });

  it('should allow indexing, when crawlers read the robots meta tag', () => {
    expect(html).toContain('<meta name="robots" content="index, follow" />');
  });

  it('should preconnect to the configured Openverse API origin, when the document loads', () => {
    expect(html).toContain(
      `<link rel="preconnect" href="${new URL(api.openverse.baseUrl).origin}" />`,
    );
  });
});

describe('index.html — static SEO metadata', () => {
  it('should carry the configured site name as the title, when the document loads', () => {
    expect(html).toContain(`<title>${seo.siteName}</title>`);
  });

  it('should carry the configured description, when the document loads', () => {
    expect(html).toContain(`content="${seo.description}"`);
  });

  it('should declare the configured canonical URL, when the document loads', () => {
    expect(html).toContain(`<link rel="canonical" href="${canonicalUrl}" />`);
  });

  it('should declare the Open Graph tags from the configuration, when the page is shared', () => {
    expect(html).toContain(`property="og:title" content="${seo.siteName}"`);
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toContain(`property="og:url" content="${canonicalUrl}"`);
    expect(html).toContain(`property="og:image" content="${socialImageUrl}"`);
    expect(html).toContain(`property="og:image:width" content="${seo.ogImageWidth}"`);
    expect(html).toContain(`property="og:image:height" content="${seo.ogImageHeight}"`);
  });

  it('should declare the Twitter card from the configuration, when the page is shared', () => {
    expect(html).toContain(`name="twitter:card" content="${seo.twitterCard}"`);
    expect(html).toContain(`name="twitter:title" content="${seo.siteName}"`);
    expect(html).toContain(`name="twitter:image" content="${socialImageUrl}"`);
  });

  it('should declare exactly one WebApplication JSON-LD block matching the configuration, when the document loads', () => {
    const matches = [...html.matchAll(/<script[^>]*application\/ld\+json">([\s\S]*?)<\/script>/g)];
    expect(matches).toHaveLength(1);

    const json = JSON.parse(matches[0][1]);
    expect(json['@type']).toBe('WebApplication');
    expect(json.name).toBe(seo.siteName);
    expect(json.description).toBe(seo.description);
    expect(json.url).toBe(canonicalUrl);
    expect(json.applicationCategory).toBe(seo.applicationCategory);
    expect(json.operatingSystem).toBe(seo.operatingSystem);
  });

  it('should give the JSON-LD block the id the SEO service updates, so it is not duplicated at runtime', () => {
    expect(html).toContain('<script id="app-structured-data" type="application/ld+json">');
  });
});
