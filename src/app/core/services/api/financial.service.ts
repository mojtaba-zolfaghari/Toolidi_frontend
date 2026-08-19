import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

export interface CommissionRule {
  id: string;
  sellerId: string;
  categoryId?: string;
  productId?: string;
  commissionRate: number;
  fixedAmount?: number;
  minimumSaleAmount?: number;
  maximumSaleAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface CommissionRuleData {
  sellerId: string;
  categoryId?: string;
  productId?: string;
  commissionRate: number;
  fixedAmount?: number;
  minimumSaleAmount?: number;
  maximumSaleAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface Payout {
  id: string;
  sellerId: string;
  sellerName?: string;
  amount: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  payoutDate?: string;
  totalSales?: number;
  totalCommission?: number;
  totalCosts?: number;
  netAmount?: number;
  paymentReferenceId?: string;
  paymentGateway?: string;
}

export interface CreatePayoutData {
  sellerId: string;
  periodStart: string;
  periodEnd: string;
}

export interface WalletSummary {
  totalBalance: number;
  pendingAmount: number;
  paidAmount: number;
  availableForWithdrawal: number;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  referenceId?: string;
}

export interface WithdrawalData {
  amount: number;
  bankAccount: string;
}

@Injectable({ providedIn: 'root' })
export class FinancialService {
  constructor(private readonly api: ApiService) {}

  getCommissionRules(): Observable<Result<CommissionRule[]>> {
    return this.api.get<Result<CommissionRule[]>>('/admin/commission-rules');
  }

  createCommissionRule(data: CommissionRuleData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/admin/commission-rules', data);
  }

  updateCommissionRule(id: string, data: CommissionRuleData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/commission-rules/${id}`, data);
  }

  deleteCommissionRule(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/admin/commission-rules/${id}`);
  }

  getPayouts(): Observable<Result<Payout[]>> {
    return this.api.get<Result<Payout[]>>('/admin/payouts');
  }

  createPayout(data: CreatePayoutData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/admin/payouts', data);
  }

  updatePayoutStatus(id: string, status: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/payouts/${id}/status`, { status });
  }

  getWallet(): Observable<Result<WalletSummary>> {
    return this.api.get<Result<WalletSummary>>('/seller/wallet');
  }

  requestWithdrawal(data: WithdrawalData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/seller/withdraw', data);
  }

  getTransactions(): Observable<Result<FinancialTransaction[]>> {
    return this.api.get<Result<FinancialTransaction[]>>('/seller/transactions');
  }
}
