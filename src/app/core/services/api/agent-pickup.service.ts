import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** Ready item for pickup */
export interface ReadyItem {
  orderItemId: string;
  supplierId: string;
  productName: string;
  quantity: number;
  supplierName: string;
  supplierLocation: string;
  estimatedReadyDate: string | null;
  orderNumber: string;
}

/** Pickup schedule */
export interface PickupSchedule {
  id: string;
  agentId: string;
  supplierId: string;
  supplierName?: string;
  scheduledPickupDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Data for creating pickup schedule */
export interface PickupScheduleData {
  supplierId: string;
  scheduledPickupDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  notes?: string;
}

/** Dashboard summary for agent */
export interface AgentDashboard {
  totalPickups: number;
  scheduledPickups: number;
  completedPickups: number;
  pendingReadyItems: number;
}

/** Supplier option for pickup scheduling */
export interface SupplierOption {
  id: string;
  name: string;
  city?: string;
}

/** Earnings summary for the current agent */
export interface AgentEarningsSummary {
  totalEarnings: number;
  availableForWithdrawal: number;
  pendingWithdrawal: number;
  paidAmount: number;
  completedPickups: number;
  availablePickupCount: number;
}

/** Commission record earned by the agent */
export interface AgentCommission {
  id: string;
  agentId: string;
  agentName?: string;
  agentPickupScheduleId?: string | null;
  orderId?: string | null;
  earnings: number;
  commissionRate: number;
  commissionAmount: number;
  isPaid: boolean;
  payoutId?: string | null;
  notes?: string;
  createdAt: string;
}

/** Payout / withdrawal record for the agent */
export interface AgentPayout {
  id: string;
  agentId: string;
  agentName?: string;
  amount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  totalEarnings: number;
  totalCommission: number;
  completedPickups: number;
  paymentReferenceId?: string | null;
  paymentGateway?: string | null;
  processedAt?: string | null;
  notes?: string;
  createdAt: string;
}

/** Withdrawal request payload */
export interface AgentWithdrawalRequest {
  amount: number;
  bankAccount: string;
}

/**
 * سرویس مدیریت زمان‌بندی تحویل کارپخش‌ها
 */
@Injectable({ providedIn: 'root' })
export class AgentPickupService {
  constructor(private readonly api: ApiService) {}

  // ─── Ready Items ──────────────────────────────────────────────

  /** دریافت آیتم‌های آماده تحویل */
  getReadyItems(): Observable<Result<ReadyItem[]>> {
    return this.api.get<Result<ReadyItem[]>>('/v1/agents/pickup-schedules/ready-items');
  }

  // ─── Pickup Schedules ─────────────────────────────────────────

  /** ایجاد زمان‌بندی تحویل */
  createSchedule(data: PickupScheduleData): Observable<Result<PickupSchedule>> {
    return this.api.post<Result<PickupSchedule>>('/v1/agents/pickup-schedules', data);
  }

  /** دریافت لیست زمان‌بندی‌های تحویل */
  getSchedules(): Observable<Result<PickupSchedule[]>> {
    return this.api.get<Result<PickupSchedule[]>>('/v1/agents/pickup-schedules');
  }

  /** به‌روزرسانی وضعیت زمان‌بندی */
  updateStatus(scheduleId: string, status: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/agents/pickup-schedules/${scheduleId}/status`, { status });
  }

  /** دریافت فهرست تأمین‌کنندگان برای انتخاب */
  getSuppliers(): Observable<Result<SupplierOption[]>> {
    return this.api.get<Result<SupplierOption[]>>('/v1/agents/suppliers');
  }

  // ─── Dashboard Summary ────────────────────────────────────────

  /** دریافت خلاصه داشبورد کارپخش */
  getDashboard(): Observable<Result<AgentDashboard>> {
    return this.api.get<Result<AgentDashboard>>('/v1/agents/dashboard/pickup-summary');
  }

  // ─── Earnings & Withdrawals ───────────────────────────────────

  /** دریافت خلاصه درآمد کارپخش */
  getEarningsSummary(): Observable<Result<AgentEarningsSummary>> {
    return this.api.get<Result<AgentEarningsSummary>>('/v1/agents/me/earnings');
  }

  /** دریافت تاریخچه کمیسیون‌های کارپخش */
  getCommissions(): Observable<Result<AgentCommission[]>> {
    return this.api.get<Result<AgentCommission[]>>('/v1/agents/me/commissions');
  }

  /** دریافت تاریخچه تسویه‌ها / برداشت‌ها */
  getPayouts(): Observable<Result<AgentPayout[]>> {
    return this.api.get<Result<AgentPayout[]>>('/v1/agents/me/payouts');
  }

  /** درخواست برداشت وجه */
  requestWithdrawal(data: AgentWithdrawalRequest): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/agents/me/withdrawals', data);
  }
}
