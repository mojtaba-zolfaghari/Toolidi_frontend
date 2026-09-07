import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { AdminProduct, AdminSeller, AdminService } from '../../../../core/services/api/admin.service';
import { Category, CategoryService } from '../../../../core/services/api/category.service';
import { CommissionRule, CommissionRuleData, FinancialService } from '../../../../core/services/api/financial.service';
import { Result } from '../../../../core/models/api-response.model';
import { ConfirmService } from '../../../../shared/services/confirm.service';

@Component({
    selector: 'app-admin-commission-rules',
    templateUrl: './admin-commission-rules.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AdminCommissionRulesComponent implements OnInit {
  rules: CommissionRule[] = [];
  sellers: AdminSeller[] = [];
  categories: Category[] = [];
  products: AdminProduct[] = [];
  form: FormGroup;
  formOpen = false;
  editingId: string | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';

  constructor(private readonly fb: FormBuilder, private readonly financialService: FinancialService, private readonly adminService: AdminService, private readonly categoryService: CategoryService, private readonly confirm: ConfirmService) {
    this.form = this.fb.group({
      sellerId: ['', Validators.required], categoryId: [''], productId: [''],
      commissionRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]], fixedAmount: [null, Validators.min(0)],
      startDate: [''], endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadRules();
    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.sellers = result.data?.items ?? [], error: () => this.sellers = [] });
    this.adminService.getAdminProducts({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.products = result.data?.items ?? [], error: () => this.products = [] });
    this.categoryService.getCategories().subscribe({ next: (result) => this.categories = result.items ?? [], error: () => this.categories = [] });
  }

  loadRules(): void {
    this.loading = true;
    this.financialService.getCommissionRules().subscribe({ next: (result) => { this.rules = result.data ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } });
  }

  openCreate(): void { this.editingId = null; this.form.reset({ sellerId: '', categoryId: '', productId: '', commissionRate: 0, fixedAmount: null, startDate: '', endDate: '' }); this.formError = ''; this.formOpen = true; }

  openEdit(rule: CommissionRule): void { this.editingId = rule.id; this.form.patchValue({ sellerId: rule.sellerId, categoryId: rule.categoryId ?? '', productId: rule.productId ?? '', commissionRate: rule.commissionRate, fixedAmount: rule.fixedAmount ?? null, startDate: this.dateInput(rule.startDate), endDate: this.dateInput(rule.endDate) }); this.formError = ''; this.formOpen = true; }

  closeForm(): void { if (!this.saving) this.formOpen = false; }

  save(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid) { this.formError = 'فروشنده و نرخ کمیسیون را صحیح وارد کنید.'; return; }
    if (value.startDate && value.endDate && value.endDate < value.startDate) { this.formError = 'تاریخ پایان باید بعد از تاریخ شروع باشد.'; return; }
    const data: CommissionRuleData = { sellerId: value.sellerId, categoryId: value.categoryId || undefined, productId: value.productId || undefined, commissionRate: Number(value.commissionRate), fixedAmount: value.fixedAmount == null ? undefined : Number(value.fixedAmount), startDate: value.startDate ? new Date(`${value.startDate}T00:00:00`).toISOString() : undefined, endDate: value.endDate ? new Date(`${value.endDate}T23:59:59`).toISOString() : undefined };
    const request: Observable<Result<unknown>> = this.editingId ? this.financialService.updateCommissionRule(this.editingId, data) : this.financialService.createCommissionRule(data);
    this.saving = true; this.formError = '';
    request.subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = this.editingId ? 'قانون کمیسیون ویرایش شد.' : 'قانون کمیسیون ایجاد شد.'; this.loadRules(); } else this.formError = result.errorMessage ?? 'ذخیره قانون انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } });
  }

  remove(rule: CommissionRule): void { this.confirm.confirmDanger('آیا از حذف این قانون کمیسیون مطمئن هستید؟').subscribe(ok => { if (!ok) return; this.financialService.deleteCommissionRule(rule.id).subscribe({ next: (result) => { if (result.isSuccess) { this.successMessage = 'قانون کمیسیون حذف شد.'; this.loadRules(); } else this.errorMessage = result.errorMessage ?? 'حذف قانون انجام نشد.'; }, error: (error: Error) => this.errorMessage = error.message }); }); }

  sellerName(id: string): string { return this.sellers.find((seller) => seller.id === id)?.companyName ?? id; }
  categoryName(id?: string): string { return id ? this.categories.find((category) => category.id === id)?.name ?? id : 'همه'; }
  productName(id?: string): string { return id ? this.products.find((product) => product.id === id)?.name ?? id : 'همه'; }
  private dateInput(value?: string): string { return value ? value.slice(0, 10) : ''; }
}
