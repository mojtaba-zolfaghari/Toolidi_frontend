import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly siteName = 'تولیدی';
  private readonly baseUrl = 'https://toolidi.ir';

  /** تصویر پیش‌فرض اشتراک‌گذاری (Open Graph) — در src/assets تولید شده است */
  private readonly defaultImage = `${this.baseUrl}/assets/og-default.png`;

  /** لوگوی سازمان برای JSON-LD — در src/assets تولید شده است */
  private readonly defaultLogo = `${this.baseUrl}/assets/logo.png`;

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly doc: Document
  ) {}

  /** Set page title + meta description + OG tags + canonical + Twitter cards */
  setPage(opts: {
    title: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
  }): void {
    const fullTitle = opts.title
      ? `${opts.title} | ${this.siteName}`
      : this.siteName;

    this.title.setTitle(fullTitle);

    if (opts.description) {
      this.meta.updateTag({ name: 'description', content: opts.description });
      this.meta.updateTag({ property: 'og:description', content: opts.description });
      this.meta.updateTag({ name: 'twitter:description', content: opts.description });
    }

    const image = opts.image || this.defaultImage;

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({ property: 'og:type', content: opts.type || 'website' });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: 'fa_IR' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    if (opts.url) {
      this.setCanonical(opts.url);
      this.meta.updateTag({ property: 'og:url', content: opts.url });
    }
  }

  /**
   * تنظیم URL متعارف صفحه با <link rel="canonical">.
   * (برخلاف <meta name="canonical">، این الگوی استانداردِ شناخته‌شده توسط گوگل است.)
   * hreflang نیز با همان URL تنظیم می‌شود (fa-IR + x-default).
   */
  setCanonical(url: string): void {
    const absolute = this.absoluteUrl(url);

    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', absolute);

    this.setHreflang(absolute);
  }

  /**
   * تنظیم تگ‌های hreflang صفحه: زبان اصلی فارسی و مقدار x-default.
   * (سایت تک‌زبانه است؛ این تگ‌ها به موتور جستجو نسخه زبانی صحیح را معرفی می‌کنند.)
   */
  setHreflang(url: string): void {
    const absolute = this.absoluteUrl(url);
    for (const lang of ['fa-IR', 'x-default']) {
      let link = this.doc.head.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!link) {
        link = this.doc.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        this.doc.head.appendChild(link);
      }
      link.setAttribute('href', absolute);
    }
  }

  /** hreflang و canonical باید مطلق باشند؛ مسیرهای نسبی را با دامنه پایه کامل می‌کند */
  private absoluteUrl(url: string): string {
    return url.startsWith('http://') || url.startsWith('https://') ? url : `${this.baseUrl}${url}`;
  }

  /** Inject JSON-LD structured data into <head> */
  setJsonLd(data: Record<string, any>): void {
    this.removeJsonLd();
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-jsonld';
    script.text = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }

  /** Remove previous JSON-LD script */
  removeJsonLd(): void {
    const existing = this.doc.getElementById('seo-jsonld');
    if (existing) existing.remove();
  }

  /** Build Product JSON-LD schema */
  productJsonLd(p: {
    name: string;
    description?: string;
    image?: string;
    price: number;
    currency?: string;
    url?: string;
    rating?: number;
    reviewCount?: number;
    brand?: string;
    sku?: string;
    availability?: string;
  }): Record<string, any> {
    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      image: p.image || this.defaultImage,
      description: p.description || p.name,
      sku: p.sku || undefined,
      brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: p.currency || 'IRR',
        availability: p.availability || 'https://schema.org/InStock',
        url: p.url || this.baseUrl,
      },
    };

    if (p.rating && p.reviewCount) {
      schema['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: p.rating,
        reviewCount: p.reviewCount,
        bestRating: 5,
        worstRating: 1,
      };
    }

    return schema;
  }

  /** Build BreadcrumbList JSON-LD */
  breadcrumbJsonLd(items: { name: string; url: string }[]): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  /** Build Organization JSON-LD */
  organizationJsonLd(): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: this.baseUrl,
      logo: this.defaultLogo,
    };
  }

  /**
   * Build an AggregateOffer JSON-LD for a deals page.
   * 此屏障适用于 DealsComponent — نمایش تخفیف‌های گروهی در گوگل.
   */
  aggregateOfferJsonLd(offerPool: {
    name: string;
    description?: string;
    url: string;
    image?: string;
    offers: Array<{
      price: number;
      priceCurrency?: string;
      priceValidUntil?: string;
      discountPercent?: number;
      url: string;
    }>;
    rating?: number;
    reviewCount?: number;
  }): Record<string, any> {
    const offers = offerPool.offers.map((o, i) => ({
      '@type': 'Offer',
      price: o.price,
      priceCurrency: o.priceCurrency || 'IRR',
      priceValidUntil: o.priceValidUntil || undefined,
      url: o.url || `${this.baseUrl}/${o.url || ''}`,
      ...(o.discountPercent != null ? { discountPercentage: Math.round(o.discountPercent * 100) / 100 } : {}),
    }));

    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'AggregateOffer',
      name: offerPool.name,
      description: offerPool.description || offerPool.name,
      url: offerPool.url,
      image: offerPool.image || this.defaultImage,
      lowPrice: Math.min(...offers.map(o => o.price)),
      highPrice: Math.max(...offers.map(o => o.price)),
      priceCurrency: 'IRR',
      offerCount: offers.length,
      offers,
    };

    if (offerPool.rating && offerPool.reviewCount) {
      schema['aggregateRating'] = {
        '@type': 'AggregateRating',
        ratingValue: offerPool.rating,
        reviewCount: offerPool.reviewCount,
        bestRating: 5,
        worstRating: 1,
      };
    }

    return schema;
  }
}
