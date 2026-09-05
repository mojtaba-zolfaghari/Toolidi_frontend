import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { fadeIn } from '../../shared/animations';
import { BlogPost, BlogService } from '../../core/services/api/blog.service';
import { SeoService } from '../../core/services/seo.service';

/** صفحه جزئیات پست وبلاگ */
@Component({
  selector: 'app-blog-detail',
  templateUrl: './blog-detail.component.html',
  styleUrls: ['./blog-detail.component.scss'],
  animations: [fadeIn]
})
export class BlogDetailComponent implements OnInit {
  post: BlogPost | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly blogService: BlogService,
    private readonly seo: SeoService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'شناسه پست معتبر نیست.';
      this.loading = false;
      return;
    }

    this.blogService.getPostById(id).subscribe({
      next: (result) => {
        this.post = result.data ?? null;
        this.loading = false;
        if (this.post) this.applySeo(this.post);
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.seo.removeJsonLd();
  }

  private applySeo(post: BlogPost): void {
    const url = `https://toolidi.ir/blog/${post.id}`;
    this.seo.setPage({
      title: post.title,
      description: post.shortDescription || post.content?.substring(0, 160) || post.title,
      image: post.featuredImage || undefined,
      url,
      type: 'article',
    });
    this.seo.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.shortDescription || post.content?.substring(0, 200),
      image: post.featuredImage || undefined,
      url,
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      author: { '@type': 'Organization', name: 'تولیدی' },
      publisher: {
        '@type': 'Organization',
        name: 'تولیدی',
        logo: { '@type': 'ImageObject', url: 'https://toolidi.ir/logo.png' },
      },
    });
  }
}
