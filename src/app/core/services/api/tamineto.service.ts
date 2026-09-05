import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Result } from '../../models/api-response.model';

export interface TaminetoConnection {
  isConnected: boolean;
  siteName?: string;
  siteUrl?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}

export interface TaminetoProductLog {
  id: string;
  taminetoProductId: string;
  productName: string;
  sku?: string;
  operationType: string;
  status: string;
  priceAtImport?: number;
  createdAt: string;
}

export interface TaminetoOrderLog {
  id: string;
  orderNumber: string;
  eventType: string;
  status: string;
  sentAt?: string;
  createdAt: string;
}

export interface ImportProductRequest {
  taminetoProductId: string;
  productName: string;
  sku?: string;
  price?: number;
}

export interface ImportBatchItem {
  taminetoProductId: string;
  productName: string;
  sku?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class TaminetoService {
  private readonly baseUrl = `${environment.apiUrl}/v1/tamineto`;

  constructor(private readonly http: HttpClient) {}

  // Connection
  getConnection(): Observable<Result<TaminetoConnection>> {
    return this.http.get<Result<TaminetoConnection>>(`${this.baseUrl}/connection`);
  }

  connect(connectionCode: string): Observable<any> {
    const payload = {
      connectionCode,
      siteUrl: environment.publicSiteUrl,
      siteName: environment.siteName
    };
    return this.http.post<any>(`${this.baseUrl}/connect`, payload);
  }

  disconnect(): Observable<Result<{ message: string }>> {
    return this.http.post<Result<{ message: string }>>(`${this.baseUrl}/disconnect`, {});
  }

  // Products
  importProduct(request: ImportProductRequest): Observable<Result<{ message: string; productId: string }>> {
    return this.http.post<Result<{ message: string; productId: string }>>(
      `${this.baseUrl}/products/import`, request
    );
  }

  importProductsBatch(items: ImportBatchItem[]): Observable<Result<{ message: string; total: number; success: number; failed: number }>> {
    return this.http.post<Result<{ message: string; total: number; success: number; failed: number }>>(
      `${this.baseUrl}/products/import-batch`, { items }
    );
  }

  syncProduct(productId: string): Observable<Result<{ message: string }>> {
    return this.http.post<Result<{ message: string }>>(`${this.baseUrl}/products/${productId}/sync`, {});
  }

  // Logs
  getProductLogs(page = 1, pageSize = 20): Observable<Result<{ items: TaminetoProductLog[] }>> {
    return this.http.get<Result<{ items: TaminetoProductLog[] }>>(
      `${this.baseUrl}/logs/products`, { params: { page: page.toString(), pageSize: pageSize.toString() } }
    );
  }

  getOrderLogs(page = 1, pageSize = 20): Observable<Result<{ items: TaminetoOrderLog[] }>> {
    return this.http.get<Result<{ items: TaminetoOrderLog[] }>>(
      `${this.baseUrl}/logs/orders`, { params: { page: page.toString(), pageSize: pageSize.toString() } }
    );
  }
}
