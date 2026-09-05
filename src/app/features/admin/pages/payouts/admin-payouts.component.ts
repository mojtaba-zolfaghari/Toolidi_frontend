import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminSeller, AdminService } from '../../../../core/services/api/admin.service';
import { FinancialService, Payout } from '../../../../core/services/api/financial.service';

@Component({
  selector: 'app-admin-payouts',
  templateUrl: './admin-payouts.component.html'
})
export class AdminPayoutsComponent implements OnInit {
  payouts: Payout[] = [];
  sellers: AdminSeller[] = [];
  form: FormGroup;
  formOpen = false;
  loading = true;
  saving = false;
  busyId = '';
  errorMessage = '';
  successMessage = '';
  formError = '';

  constructor(private readonly fb: FormBuilder, private readonly financialService: FinancialService, private readonly adminService: AdminService) {
    this.form = this.fb.group({ sellerId: ['', Validators.required], period: ['', Validators.required] });
  }

  ngOnInit(): void {
    this.loadPayouts();
    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.sellers = result.data?.items ?? [], error: () => this.sellers = [] });
  }

  loadPayouts(): void {
    this.loading = true;
    this.financialService.getPayouts().subscribe({ next: (result) => { this.payouts = result.data ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } });
  }

  openCreate(): void { this.form.reset({ sellerId: '', period: new Date().toISOString().slice(0, 7) }); this.formError = ''; this.formOpen = true; }
  closeForm(): void { if (!this.saving) this.formOpen = false; }

  createPayout(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid) { this.formError = 'فروشنده و دوره تسویه را انتخاب کنید.'; return; }
    const [year, month] = String(value.period).split('-').map(Number);
    const periodStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
    this.saving = true; this.formError = '';
    this.financialService.createPayout({ sellerId: value.sellerId, periodStart, periodEnd }).subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = 'تسویه با موفقیت ایجاد شد.'; this.loadPayouts(); } else this.formError = result.errorMessage ?? 'ایجاد تسویه انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } });
  }

  changeStatus(payout: Payout, status: string): void {
    if (!status || status === payout.status) return;
    this.busyId = payout.id; this.errorMessage = '';
    this.financialService.updatePayoutStatus(payout.id, status).subscribe({ next: (result) => { this.busyId = ''; if (result.isSuccess) { payout.status = status; this.successMessage = 'وضعیت تسویه به‌روزرسانی شد.'; } else this.errorMessage = result.errorMessage ?? 'تغییر وضعیت انجام نشد.'; }, error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; } });
  }

  sellerName(id: string): string { return this.sellers.find((seller) => seller.id === id)?.companyName ?? id; }
  statusLabel(status: string): string { return ({ Pending: 'در انتظار', Processing: 'در حال پردازش', Completed: 'تکمیل‌شده', Failed: 'ناموفق' } as Record<string, string>)[status] ?? status; }
}
