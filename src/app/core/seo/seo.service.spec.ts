import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '@core/config/app-config.token';
import { createAppConfig } from '@core/config/app-config';
import { Seo } from './seo.service';

const config = createAppConfig({
  seo: { siteName: 'Test Site', siteUrl: 'https://test.example.com' },
});

describe('Seo', () => {
  let document: Document;

  function applySeo(): void {
    TestBed.configureTestingModule({ providers: [{ provide: APP_CONFIG, useValue: config }] });
    document = TestBed.inject(DOCUMENT);
    TestBed.inject(Seo).apply();
  }

  function metaContent(selector: string): string | null {
    return document.head.querySelector(selector)?.getAttribute('content') ?? null;
  }

  afterEach(() => {
    document.head
      .querySelectorAll(
        'meta[name], meta[property], link[rel="canonical"], script#app-structured-data',
      )
      .forEach((element) => element.remove());
  });

  it('should set the document title from the configured site name, when applied', () => {
    applySeo();

    expect(document.title).toBe('Test Site');
  });

  it('should describe the page from the configured description, when applied', () => {
    applySeo();

    expect(metaContent('meta[name="description"]')).toBe(config.seo.description);
  });

  it('should point the canonical link at the configured origin, when applied', () => {
    applySeo();

    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://test.example.com/',
    );
  });

  it('should build the Open Graph card from the configuration, when applied', () => {
    applySeo();

    expect(metaContent('meta[property="og:title"]')).toBe('Test Site');
    expect(metaContent('meta[property="og:url"]')).toBe('https://test.example.com/');
    expect(metaContent('meta[property="og:image"]')).toBe(
      `https://test.example.com${config.seo.ogImagePath}`,
    );
    expect(metaContent('meta[property="og:image:width"]')).toBe(String(config.seo.ogImageWidth));
  });

  it('should build the Twitter card from the configuration, when applied', () => {
    applySeo();

    expect(metaContent('meta[name="twitter:card"]')).toBe(config.seo.twitterCard);
    expect(metaContent('meta[name="twitter:image"]')).toBe(
      `https://test.example.com${config.seo.ogImagePath}`,
    );
  });

  it('should publish one WebApplication JSON-LD block, when applied', () => {
    applySeo();

    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);

    const json = JSON.parse(scripts[0].textContent ?? '{}');
    expect(json['@type']).toBe('WebApplication');
    expect(json.name).toBe('Test Site');
    expect(json.url).toBe('https://test.example.com/');
    expect(json.applicationCategory).toBe(config.seo.applicationCategory);
  });

  it('should not duplicate the canonical link or structured data, when applied twice', () => {
    applySeo();
    TestBed.inject(Seo).apply();

    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  });
});
