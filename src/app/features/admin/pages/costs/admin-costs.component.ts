import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminSeller, AdminService } from '../../../../core/services/api/admin.service';
import { CostItem, CostItemData, CostService } from '../../../../core/services/api/cost.service';

@Component({
  selector: 'app-admin-costs',
  templateUrl: './admin-costs.component.html'
})
export class AdminCostsComponent implements OnInit {
  costs: CostItem[] = [];
  sellers: AdminSeller[] = [];
  form: FormGroup;
  formOpen = false;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';

  constructor(private readonly fb: FormBuilder, private readonly costService: CostService, private readonly adminService: AdminService) {
    this.form = this.fb.group({ name: ['', Validators.required], amount: [null, [Validators.required, Validators.min(1)]], costType: ['Other', Validators.required], costDate: ['', Validators.required], description: [''] });
  }

  ngOnInit(): void { this.loadCosts(); this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.sellers = result.data?.items ?? [], error: () => this.sellers = [] }); }
  loadCosts(): void { this.loading = true; this.costService.getCosts({ pageNumber: 1, pageSize: 100 }).subscribe({ next: (result) => { this.costs = result.data?.items ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } }); }
  openCreate(): void { this.form.reset({ name: '', amount: null, costType: 'Other', costDate: new Date().toISOString().slice(0, 10), description: '' }); this.formError = ''; this.formOpen = true; }
  closeForm(): void { if (!this.saving) this.formOpen = false; }

  save(): void {
    this.form.markAllAsTouched(); const value = this.form.getRawValue(); if (this.form.invalid) { this.formError = 'عنوان، مبلغ و تاریخ هزینه را تکمیل کنید.'; return; }
    const data: CostItemData = { sellerId: this.sellers[0]?.id ?? '00000000-0000-0000-0000-000000000000', name: value.name.trim(), amount: Number(value.amount), costType: value.costType, description: value.description || undefined, month: value.costDate.slice(0, 7) };
    this.saving = true; this.formError = ''; this.costService.createCost(data).subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = 'هزینه ثبت و توزیع شد.'; this.loadCosts(); } else this.formError = result.errorMessage ?? 'ثبت هزینه انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } });
  }

  distribute(cost: CostItem): void { this.costService.distributeCost(cost.id).subscribe({ next: (result) => { if (result.isSuccess) this.successMessage = 'توزیع هزینه انجام شد.'; else this.errorMessage = result.errorMessage ?? 'توزیع هزینه انجام نشد.'; }, error: (error: Error) => this.errorMessage = error.message }); }
  costTypeLabel(type: string): string { return ({ Server: 'سرور', SMS: 'پیامک', Advertising: 'تبلیغات', Other: 'سایر' } as Record<string, string>)[type] ?? type; }
}
