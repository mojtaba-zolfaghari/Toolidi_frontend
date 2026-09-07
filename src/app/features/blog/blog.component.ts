import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

/** نقاط شکست شبکه ریسپانسیو */
const GRID_COLS_BY_MEDIA: Record<'mobile' | 'tablet' | 'desktop', number> = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
};

/**
 * صفحه فهرست وبلاگ
 * شامل: پست ویژه، دسته‌بندی‌ها، شبکه ریسپانسیو کارت‌های Material، صفحه‌بندی MatPaginator
 */
@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit, OnDestroy {
  posts: BlogPost[] = [];
  categories = BLOG_CATEGORIES;
  selectedCategory = '';
  page = 1;
  pageSize = 9;
  totalPages = 1;
  totalCount = 0;
  loading = true;
  errorMessage = '';

  /** تعداد ستون‌های شبکه بر اساس عرض صفحه */
  gridCols = GRID_COLS_BY_MEDIA.desktop;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly blogService: BlogService,
    private readonly router: Router,
    private readonly seo: SeoService,
    private readonly breakpointObserver: BreakpointObserver
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

    // شبکه ریسپانسیو: 1 / 2 / 3 ستون
    this.breakpointObserver
      .observe(['(max-width: 599px)', '(min-width: 600px) and (max-width: 959px)', '(min-width: 960px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.breakpoints['(max-width: 599px)']) {
          this.gridCols = GRID_COLS_BY_MEDIA.mobile;
        } else if (state.breakpoints['(min-width: 600px) and (max-width: 959px)']) {
          this.gridCols = GRID_COLS_BY_MEDIA.tablet;
        } else {
          this.gridCols = GRID_COLS_BY_MEDIA.desktop;
        }
      });

    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.seo.removeJsonLd();
    this.destroy$.next();
    this.destroy$.complete();
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

  /** پست ویژه (فقط در صفحه اول؛ بیشترین بازدید) */
  get featuredPost(): BlogPost | null {
    if (!this.posts.length || this.page !== 1) return null;
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

  /** رویداد صفحه‌بندی MatPaginator */
  onPageEvent(event: PageEventLike): void {
    this.pageSize = event.pageSize;
    this.page = event.pageIndex + 1;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** خلاصه متن */
  excerpt(text: string, maxLen = 120): string {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '…' : text;
  }
}

/** حداقل شکل رویداد MatPageEvent (بدون وابستگی به import نوع در قالب) */
interface PageEventLike {
  pageIndex: number;
  pageSize: number;
  length: number;
}
