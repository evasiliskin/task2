import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function readRepositoryFile(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), relativePath), 'utf-8');
}

const html = readRepositoryFile('index.html');

describe('index.html — static SEO metadata', () => {
  it('should declare an English lang attribute, when the document loads', () => {
    expect(html).toMatch(/<html lang="en">/);
  });

  it('should declare a descriptive meta description, when the document loads', () => {
    expect(html).toMatch(/<meta\s+name="description"\s+content="[^"]{20,}"\s*\/>/);
  });

  it('should allow indexing, when crawlers read the robots meta tag', () => {
    expect(html).toContain('<meta name="robots" content="index, follow" />');
  });

  it('should declare an absolute canonical URL, when the document loads', () => {
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+"\s*\/>/);
  });

  it('should declare the Open Graph tags, when the page is shared', () => {
    expect(html).toContain('property="og:title" content="Image Search"');
    expect(html).toMatch(/property="og:description"\s+content="[^"]{20,}"/);
    expect(html).toContain('property="og:type" content="website"');
    expect(html).toMatch(/property="og:url" content="https:\/\/[^"]+"/);
    expect(html).toMatch(/property="og:image"\s+content="https:\/\/[^"]+\.png"/);
  });

  it('should declare a large-image Twitter card, when the page is shared', () => {
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
  });

  it('should declare exactly one WebApplication JSON-LD block, when the document loads', () => {
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

  it('should preconnect to the Openverse API origin, when the document loads', () => {
    expect(html).toContain('<link rel="preconnect" href="https://api.openverse.org" />');
  });
});
