import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { BlogPost, BlogService } from '../../core/services/api/blog.service';
import { SeoService } from '../../core/services/seo.service';

/** دسته‌بندی وبلاگ */
interface BlogCategory {
  slug: string;
  name: string;
  icon: string;
}

/** دسته‌بندی‌های وبلاگ */
const BLOG_CATEGORIES: BlogCategory[] = [
  { slug: '', name: 'همه', icon: '📰' },
  { slug: 'buying-guide', name: 'راهنمای خرید', icon: '🛒' },
  { slug: 'market-news', name: 'اخبار بازار', icon: '📊' },
  { slug: 'tips-tricks', name: 'نکات و ترفندها', icon: '💡' },
  { slug: 'product-review', name: 'معرفی محصول', icon: '💎' },
  { slug: 'tutorial', name: 'آموزش', icon: '🎓' },
];

/**
 * صفحه فهرست وبلاگ
 * شامل: پست ویژه، دسته‌بندی‌ها، کارت‌های زیبا
 */
@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  posts: BlogPost[] = [];
  categories = BLOG_CATEGORIES;
  selectedCategory = '';
  page = 1;
  pageSize = 9;
  totalPages = 1;
  totalCount = 0;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly blogService: BlogService,
    private readonly router: Router,
    private readonly seo: SeoService
  ) {}

  ngOnInit(): void {
    this.seo.setPage({
      title: 'وبلاگ تولیدی',
      description: 'آخرین اخبار بازار، راهنمای خرید عمده، نکات و ترفندهای فروش و معرفی محصولات در وبلاگ تولیدی',
      url: 'https://toolidi.ir/blog',
      type: 'website',
    });
    this.seo.setJsonLd(this.seo.breadcrumbJsonLd([
      { name: 'خانه', url: 'https://toolidi.ir' },
      { name: 'وبلاگ', url: 'https://toolidi.ir/blog' },
    ]));
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.seo.removeJsonLd();
  }

  /** بارگذاری پست‌ها */
  loadPosts(): void {
    this.loading = true;
    this.blogService.getPosts({ pageNumber: this.page, pageSize: this.pageSize }).subscribe({
      next: (result) => {
        const paged = result.data;
        let allPosts = paged?.items ?? [];
        this.totalCount = paged?.totalCount ?? 0;

        // فیلتر بر اساس دسته‌بندی (ساعتی)
        if (this.selectedCategory) {
          allPosts = allPosts.filter(p => (p as any).categorySlug === this.selectedCategory || this.matchCategory(p));
        }

        this.posts = allPosts;
        this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        this.loading = false;
      },
      error: (err: Error) => {
        this.posts = [];
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  /** تطابق پست با دسته‌بندی */
  private matchCategory(post: BlogPost): boolean {
    // فعلاً همه پست‌ها نمایش داده می‌شوند چون API category slug برنمی‌گرداند
    return true;
  }

  /** پست ویژه (اولین پست با بیشترین بازدید) */
  get featuredPost(): BlogPost | null {
    if (!this.posts.length) return null;
    return [...this.posts].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0];
  }

  /** پست‌های معمولی (به جز ویژه) */
  get regularPosts(): BlogPost[] {
    const featured = this.featuredPost;
    if (!featured) return this.posts;
    return this.posts.filter(p => p.id !== featured.id);
  }

  /** انتخاب دسته‌بندی */
  selectCategory(slug: string): void {
    this.selectedCategory = slug;
    this.page = 1;
    this.loadPosts();
  }

  /** رفتن به جزئیات پست */
  openPost(id: string): void {
    this.router.navigate(['/blog', id]);
  }

  /** تغییر صفحه */
  onPageChange(page: number): void {
    this.page = page;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** خلاصه متن */
  excerpt(text: string, maxLen = 120): string {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
  }
}
