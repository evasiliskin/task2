import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function readRepositoryFile(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), relativePath), 'utf-8');
}

const html = readRepositoryFile('index.html');

describe('index.html — static SEO metadata', () => {
  it('sets an English lang attribute', () => {
    expect(html).toMatch(/<html lang="en">/);
  });

  it('has a non-empty meta description', () => {
    expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]{20,}"\s*\/>/);
  });

  it('allows indexing via a robots meta tag', () => {
    expect(html).toContain('<meta name="robots" content="index, follow" />');
  });

  it('declares an absolute canonical URL', () => {
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+"\s*\/>/);
  });

  it('declares Open Graph title, description, type, url and image', () => {
    expect(html).toContain('property="og:title" content="Image Search"');
    expect(html).toMatch(/property="og:description"\s+content="[^"]{20,}"/);
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toMatch(/property="og:url" content="https:\/\/[^"]+"/);
    expect(html).toMatch(/property="og:image"\s+content="https:\/\/[^"]+\.png"/);
  });

  it('declares a Twitter summary_large_image card', () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it('declares exactly one WebApplication JSON-LD block', () => {
    const matches = [
      ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ];
    expect(matches).toHaveLength(1);
    const json = JSON.parse(matches[0][1]);
    expect(json['@type']).toBe('WebApplication');
    expect(json.name).toBe('Image Search');
    expect(typeof json.description).toBe('string');
    expect(json.description.length).toBeGreaterThan(20);
  });

  it('preconnects to the Openverse API origin', () => {
    expect(html).toContain('<link rel="preconnect" href="https://api.openverse.org" />');
  });
});
