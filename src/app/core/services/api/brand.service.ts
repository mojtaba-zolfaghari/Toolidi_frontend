import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

/** برند محصول */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** پارامترهای لیست برندها */
export interface BrandQueryParams {
  pageNumber?: number;
  pageSize?: number;
}

/** سرویس برندها؛ دریافت لیست برندهای فعال */
@Injectable({ providedIn: 'root' })
export class BrandService {
  constructor(private readonly api: ApiService) {}

  /** دریافت لیست برندها */
  getBrands(params?: BrandQueryParams): Observable<Result<PagedList<Brand>>> {
    return this.api.get<Result<PagedList<Brand>>>(`/Brand${buildQueryString(params)}`);
  }
}
