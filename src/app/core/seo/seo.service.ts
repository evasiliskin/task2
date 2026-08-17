import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { APP_CONFIG } from '@core/config/app-config.token';

const STRUCTURED_DATA_ID = 'app-structured-data';

@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly config = inject(APP_CONFIG).seo;
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  get canonicalUrl(): string {
    return `${this.config.siteUrl}/`;
  }

  get socialImageUrl(): string {
    return `${this.config.siteUrl}${this.config.ogImagePath}`;
  }

  apply(): void {
    const { siteName, description, twitterCard, ogImageWidth, ogImageHeight } = this.config;

    this.title.setTitle(siteName);
    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:title', content: siteName });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: this.canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: this.socialImageUrl });
    this.meta.updateTag({ property: 'og:image:width', content: String(ogImageWidth) });
    this.meta.updateTag({ property: 'og:image:height', content: String(ogImageHeight) });

    this.meta.updateTag({ name: 'twitter:card', content: twitterCard });
    this.meta.updateTag({ name: 'twitter:title', content: siteName });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: this.socialImageUrl });

    this.applyCanonicalLink();
    this.applyStructuredData();
  }

  private applyCanonicalLink(): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const link = existing ?? this.document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', this.canonicalUrl);
    if (!existing) {
      head.appendChild(link);
    }
  }

  private applyStructuredData(): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLScriptElement>(`script#${STRUCTURED_DATA_ID}`);
    const script = existing ?? this.document.createElement('script');
    script.setAttribute('id', STRUCTURED_DATA_ID);
    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: this.config.siteName,
      description: this.config.description,
      url: this.canonicalUrl,
      applicationCategory: this.config.applicationCategory,
      operatingSystem: this.config.operatingSystem,
    });
    if (!existing) {
      head.appendChild(script);
    }
  }
}
