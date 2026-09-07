import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TaminetoService, TaminetoConnection, TaminetoProductLog, TaminetoOrderLog } from '../../../../core/services/api/tamineto.service';

@Component({
    selector: 'app-seller-tamineto',
    templateUrl: './seller-tamineto.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SellerTaminetoComponent implements OnInit {
  connection: TaminetoConnection | null = null;
  connectionCode = '';
  loading = true;
  connecting = false;
  errorMessage = '';
  successMessage = '';

  activeTab: 'import' | 'products' | 'orders' = 'import';

  // Product logs
  productLogs: TaminetoProductLog[] = [];
  productLogsLoading = false;

  // Order logs
  orderLogs: TaminetoOrderLog[] = [];
  orderLogsLoading = false;

  // Import form
  importProductId = '';
  importProductName = '';
  importProductSku = '';
  importProductPrice: number | null = null;
  importing = false;

  // Batch import
  batchItems: string = '';
  batchImporting = false;

  constructor(private readonly taminetoService: TaminetoService) {}

  ngOnInit(): void {
    this.loadConnection();
  }

  loadConnection(): void {
    this.loading = true;
    this.taminetoService.getConnection().subscribe({
      next: (result) => {
        this.connection = result.data ?? null;
        this.loading = false;
        if (this.connection?.isConnected) {
          this.loadProductLogs();
          this.loadOrderLogs();
        }
      },
      error: () => {
        this.loading = false;
        this.connection = { isConnected: false };
      }
    });
  }

  connect(): void {
    if (!this.connectionCode.trim()) {
      this.errorMessage = 'کد اتصال را وارد کنید.';
      return;
    }
    this.connecting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.taminetoService.connect(this.connectionCode.trim()).subscribe({
      next: (result) => {
        this.connecting = false;
        if (result.data?.isConnected) {
          this.successMessage = 'اتصال با Tamineto با موفقیت برقرار شد.';
          this.connectionCode = '';
          this.loadConnection();
        } else {
          this.errorMessage = result.message || result.error || 'اتصال انجام نشد.';
        }
      },
      error: (err) => {
        this.connecting = false;
        console.error('❌ Tamineto error:', err);
        const msg = err.error?.message || err.message || JSON.stringify(err.error);
        this.errorMessage = msg || 'خطا در اتصال.';
      }
    });
  }

  disconnect(): void {
    if (!window.confirm('آیا از قطع اتصال با Tamineto مطمئن هستید؟')) return;
    this.taminetoService.disconnect().subscribe({
      next: () => {
        this.successMessage = 'اتصال با Tamineto قطع شد.';
        this.connection = { isConnected: false };
      },
      error: (err) => { this.errorMessage = err.error?.message || 'خطا در قطع اتصال.'; }
    });
  }

  importProduct(): void {
    if (!this.importProductId || !this.importProductName) {
      this.errorMessage = 'شناسه و نام محصول الزامی است.';
      return;
    }
    this.importing = true;
    this.errorMessage = '';
    this.taminetoService.importProduct({
      taminetoProductId: this.importProductId,
      productName: this.importProductName,
      sku: this.importProductSku || undefined,
      price: this.importProductPrice ?? undefined
    }).subscribe({
      next: (result) => {
        this.importing = false;
        if (result.data?.productId) {
          this.successMessage = `محصول «${this.importProductName}» با موفقیت وارد شد.`;
          this.importProductId = '';
          this.importProductName = '';
          this.importProductSku = '';
          this.importProductPrice = null;
          this.loadProductLogs();
        } else {
          this.errorMessage = result.errorMessage || 'وارد کردن محصول انجام نشد.';
        }
      },
      error: (err) => { this.importing = false; this.errorMessage = err.error?.message || 'خطا در وارد کردن محصول.'; }
    });
  }

  batchImport(): void {
    if (!this.batchItems.trim()) {
      this.errorMessage = 'لیست محصولات را وارد کنید.';
      return;
    }
    try {
      const items = JSON.parse(this.batchItems);
      if (!Array.isArray(items) || items.length === 0) {
        this.errorMessage = 'فرمت JSON نادرست است. آرایه‌ای از محصولات ارسال کنید.';
        return;
      }
      this.batchImporting = true;
      this.errorMessage = '';
      this.taminetoService.importProductsBatch(items).subscribe({
        next: (result) => {
          this.batchImporting = false;
          this.successMessage = result.data?.message || 'دسته وارد شد.';
          this.batchItems = '';
          this.loadProductLogs();
        },
        error: (err) => { this.batchImporting = false; this.errorMessage = err.error?.message || 'خطا.'; }
      });
    } catch {
      this.errorMessage = 'فرمت JSON نادرست است.';
    }
  }

  loadProductLogs(): void {
    this.productLogsLoading = true;
    this.taminetoService.getProductLogs().subscribe({
      next: (result) => { this.productLogs = result.data?.items ?? []; this.productLogsLoading = false; },
      error: () => { this.productLogs = []; this.productLogsLoading = false; }
    });
  }

  loadOrderLogs(): void {
    this.orderLogsLoading = true;
    this.taminetoService.getOrderLogs().subscribe({
      next: (result) => { this.orderLogs = result.data?.items ?? []; this.orderLogsLoading = false; },
      error: () => { this.orderLogs = []; this.orderLogsLoading = false; }
    });
  }

  clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }
}
