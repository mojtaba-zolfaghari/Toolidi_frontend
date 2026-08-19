import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

export interface CostItem {
  id: string;
  sellerId: string;
  name: string;
  amount: number;
  costType: string;
  description?: string;
  month?: string;
  createdAt: string;
}

export interface CostItemData {
  sellerId: string;
  name: string;
  amount: number;
  costType: string;
  description?: string;
  month?: string;
}

export interface CostShare {
  id: string;
  costItemId: string;
  sellerId: string;
  sellerName: string;
  shareAmount: number;
  sharePercent: number;
  shareDate: string;
  description?: string;
}

export interface SellerMonthlyCost {
  id: string;
  sellerId: string;
  year: number;
  month: number;
  platformCommission: number;
  shippingCost: number;
  advertisingCost: number;
  transactionFees: number;
  otherCosts: number;
  totalCost: number;
}

@Injectable({ providedIn: 'root' })
export class CostService {
  constructor(private readonly api: ApiService) {}

  getCosts(params?: { pageNumber?: number; pageSize?: number; sellerId?: string; costType?: string }): Observable<Result<PagedList<CostItem>>> {
    return this.api.get<Result<PagedList<CostItem>>>(`/admin/costs${buildQueryString(params)}`);
  }

  createCost(data: CostItemData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/admin/costs', data);
  }

  distributeCost(id: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>(`/admin/costs/${id}/distribute`, {});
  }

  getCostShares(id: string): Observable<Result<CostShare[]>> {
    return this.api.get<Result<CostShare[]>>(`/admin/costs/${id}/shares`);
  }

  getSellerCosts(): Observable<Result<SellerMonthlyCost[]>> {
    return this.api.get<Result<SellerMonthlyCost[]>>('/seller/costs');
  }
}
