import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

/** پست وبلاگ */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  content: string;
  featuredImage?: string;
  categoryId: string;
  authorId: string;
  isPublished: boolean;
  viewCount: number;
  publishedAt?: string;
}

/** پارامترهای لیست پست‌های وبلاگ */
export interface BlogQueryParams {
  pageNumber?: number;
  pageSize?: number;
}

/**
 * سرویس وبلاگ؛ دریافت لیست و جزئیات پست‌ها.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  constructor(private readonly api: ApiService) {}

  /** دریافت لیست پست‌های منتشرشده */
  getPosts(params?: BlogQueryParams): Observable<Result<PagedList<BlogPost>>> {
    return this.api.get<Result<PagedList<BlogPost>>>(`/Blog${buildQueryString(params)}`);
  }

  /** دریافت یک پست با شناسه */
  getPostById(id: string): Observable<Result<BlogPost>> {
    return this.api.get<Result<BlogPost>>(`/Blog/${id}`);
  }

  /**
   * دریافت یک پست با اسلاگ.
   * بک‌اند مسیر مستقیم اسلاگ ندارد؛ پست از میان لیست پیدا می‌شود.
   */
  getPostBySlug(slug: string): Observable<Result<BlogPost>> {
    return this.getPosts().pipe(
      map((result) => {
        const post = result.data?.items.find((item) => item.slug === slug);
        if (!post) {
          return { isSuccess: false, errorMessage: 'پست موردنظر یافت نشد.' };
        }
        return { isSuccess: true, data: post };
      })
    );
  }
}
