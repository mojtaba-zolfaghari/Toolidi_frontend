import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';

/** دسته‌بندی محصولات */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  displayOrder: number;
  parentId?: string;
  sellerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** گره‌ی درخت دسته‌بندی (ساختار سلسله‌مراتبی) */
export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  isActive: boolean;
  displayOrder: number;
  children: CategoryTreeNode[];
}

/**
 * سرویس دسته‌بندی‌ها؛ دریافت لیست و درخت دسته‌بندی محصولات.
 */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  /** درخت دسته‌بندی کش می‌شود؛ در سراسر اپلیکیشن (هدر، مگامنو، فروشگاه) ساختار یکسان است. */
  private readonly categoryTree$ = this.api
    .get<Result<CategoryTreeNode[]>>('/Category/tree')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  constructor(private readonly api: ApiService) {}

  /** دریافت لیست صفحه‌بندی‌شده‌ی دسته‌بندی‌ها */
  getCategories(): Observable<PagedList<Category>> {
    return this.api.get<PagedList<Category>>('/Category');
  }

  /**
   * دریافت درخت سلسله‌مراتبی دسته‌بندی‌ها.
   * پاسخ در طول عمر اپلیکیشن کش می‌شود (shareReplay) تا مگامنو، صفحه فروشگاه و
   * صفحه اصلی هر کدام درخواست جداگانه نزنند.
   */
  getCategoryTree(): Observable<Result<CategoryTreeNode[]>> {
    return this.categoryTree$;
  }
}
