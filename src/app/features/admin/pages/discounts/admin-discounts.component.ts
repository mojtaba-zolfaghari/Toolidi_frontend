import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { ConfirmService } from '../../../../shared/services/confirm.service';
import { Discount, DiscountData, DiscountService } from '../../../../core/services/api/discount.service';
import { Result } from '../../../../core/models/api-response.model';
import { TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';

/** اعتبارسنجی بازه تاریخ: پایان باید بعد از شروع باشد (REDESIGN-007) */
function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  if (start && end && new Date(end) < new Date(start)) {
    return { dateRange: true };
  }
  return null;
}

@Component({
  selector: 'app-admin-discounts',
  templateUrl: './admin-discounts.component.html'
})
export class AdminDiscountsComponent implements OnInit {
  discounts: Discount[] = [];
  form: FormGroup;
  formOpen = false;
  editingId: string | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';

  activeDiscounts = 0;

  headerActions = [
    { label: 'افزودن تخفیف', icon: '🏷️', color: 'primary', click: () => this.openCreate() },
    { label: 'بازخوانی', icon: '🔄', color: 'ghost', click: () => this.loadDiscounts() }
  ];

  /** امروز برای حداقلِ تاریخ شروع */
  readonly today = new Date().toISOString().slice(0, 10);

  /** حداقل تاریخ پایان = تاریخ شروع انتخابی */
  get minEndDate(): string {
    const start = this.form?.get('startDate')?.value;
    return start ? String(start) : this.today;
  }

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'کد', sortable: true },
    { key: 'type', label: 'نوع', type: 'badge', badgeMap: {
      'percentage': { label: 'درصدی', color: 'data-table__badge--info' },
      'fixed': { label: 'مبلغ ثابت', color: 'data-table__badge--info' }
    }},
    { key: 'value', label: 'مقدار', type: 'number' },
    { key: 'startDate', label: 'شروع', type: 'date' },
    { key: 'endDate', label: 'پایان', type: 'date' },
    { key: 'isActive', label: 'وضعیت', type: 'badge', badgeMap: {
      'true': { label: 'فعال', color: 'data-table__badge--success' },
      'false': { label: 'غیرفعال', color: 'data-table__badge--danger' }
    }}
  ];

  tableActions: TableAction[] = [
    { label: 'ویرایش', icon: '✏️', color: 'primary', click: (row) => this.openEdit(row) },
    { label: 'حذف', icon: '🗑️', color: 'danger', click: (row) => this.remove(row) }
  ];

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  constructor(private readonly fb: FormBuilder, private readonly discountService: DiscountService, private readonly confirm: ConfirmService) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['percentage', Validators.required],
      value: [null, [Validators.required, Validators.min(0)]],
      minOrderAmount: [null, [Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [true]
    }, { validators: dateRangeValidator });
  }

  ngOnInit(): void { this.loadDiscounts(); }

  loadDiscounts(): void {
    this.loading = true;
    this.discountService.getDiscounts({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.discounts = result.data?.items ?? [];
        this.activeDiscounts = this.discounts.filter(d => d.isActive).length;
        this.loading = false;
      },
      error: (error: Error) => { this.errorMessage = error.message; this.loading = false; }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ type: 'percentage', value: null, minOrderAmount: null, startDate: '', endDate: '', isActive: true });
    this.formError = '';
    this.formOpen = true;
  }

  openEdit(discount: Discount): void {
    this.editingId = discount.id;
    this.form.patchValue({
      code: discount.name,
      type: discount.type ?? 'percentage',
      value: discount.value ?? discount.percentage,
      minOrderAmount: discount.minOrderAmount ?? null,
      startDate: this.toDateInput(discount.startDate),
      endDate: this.toDateInput(discount.endDate),
      isActive: discount.isActive
    });
    this.formError = '';
    this.formOpen = true;
  }

  closeForm(): void { if (!this.saving) { this.formOpen = false; } }

  save(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid) { this.formError = 'لطفاً همه فیلدهای الزامی را صحیح تکمیل کنید.'; return; }
    if (value.endDate < value.startDate) { this.formError = 'تاریخ پایان باید بعد از تاریخ شروع باشد.'; return; }
    this.saving = true;
    this.formError = '';
    const data: DiscountData = {
      name: value.code.trim(),
      description: '',
      percentage: Number(value.value),
      type: value.type,
      value: Number(value.value),
      minOrderAmount: value.minOrderAmount == null ? undefined : Number(value.minOrderAmount),
      startDate: new Date(`${value.startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${value.endDate}T23:59:59`).toISOString(),
      isActive: !!value.isActive
    };
    const request: Observable<Result<unknown>> = this.editingId
      ? this.discountService.updateDiscount(this.editingId, data)
      : this.discountService.createDiscount(data);
    request.subscribe({
      next: (result) => {
        this.saving = false;
        if (result.isSuccess) { this.formOpen = false; this.successMessage = this.editingId ? 'تخفیف ویرایش شد.' : 'تخفیف جدید ایجاد شد.'; this.loadDiscounts(); }
        else { this.formError = result.errorMessage ?? 'ذخیره تخفیف انجام نشد.'; }
      },
      error: (error: Error) => { this.saving = false; this.formError = error.message; }
    });
  }

  remove(discount: Discount): void {
    this.confirm.confirmDanger(`آیا از حذف تخفیف «${discount.name}» مطمئن هستید؟`).subscribe(ok => {
      if (!ok) return;
      this.discountService.deleteDiscount(discount.id).subscribe({
        next: (result) => { if (result.isSuccess) { this.successMessage = 'تخفیف حذف شد.'; this.loadDiscounts(); } else this.errorMessage = result.errorMessage ?? 'حذف تخفیف انجام نشد.'; },
        error: (error: Error) => { this.errorMessage = error.message; }
      });
    });
  }

  private toDateInput(value: string): string { return value ? value.slice(0, 10) : ''; }
}
