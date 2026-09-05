import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';

/** Health check response */
export interface HealthStatus {
  status: string;
  database: string;
  timestamp: string;
  version: string;
  counts?: { products: number; users: number; orders: number };
  uptime?: number;
}

/** سرویس وضعیت سلامت سیستم */
@Injectable({ providedIn: 'root' })
export class HealthService {
  constructor(private readonly api: ApiService) {}

  /** دریافت وضعیت سلامت سیستم (عمومی) */
  getHealth(): Observable<{ status: string; data: HealthStatus }> {
    return this.api.get<{ status: string; data: HealthStatus }>('/v1/health');
  }

  /** دریافت وضعیت سلامت دقیق (admin) */
  getDetailedHealth(): Observable<{ status: string; data: any }> {
    return this.api.get<{ status: string; data: any }>('/v1/health/detailed');
  }
}
