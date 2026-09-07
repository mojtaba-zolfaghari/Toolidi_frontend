import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SupplierService, SupplierProduct, SupplierProductPricing } from '../../../core/services/api/supplier.service';

@Component({
    selector: 'app-supplier-products',
    template: `
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-secondary">مدیریت محصولات 📦</h1>
          <p class="text-gray-500 mt-1">محصولات قابل تأمین خود را مدیریت کنید</p>
        </div>
        <button class="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-500/20 hover:bg-green-700 transition-colors">
          + افزودن محصول
        </button>
      </div>
    
      <!-- Filters -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
        <input type="text" placeholder="جستجوی محصول..." [(ngModel)]="searchTerm"
          class="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
        <select [(ngModel)]="filterCategory" class="border border-gray-200 rounded-xl px-4 py-2.5 bg-white">
          <option value="">همه دسته‌بندی‌ها</option>
          @for (cat of categories; track cat) {
            <option [value]="cat">{{ cat }}</option>
          }
        </select>
        <select [(ngModel)]="filterStatus" class="border border-gray-200 rounded-xl px-4 py-2.5 bg-white">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>
      </div>
    
      <!-- Products Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-right">
            <thead class="bg-gray-50">
              <tr class="text-gray-500">
                <th class="p-4">محصول</th>
                <th class="p-4">شناسه</th>
                <th class="p-4">دسته‌بندی</th>
                <th class="p-4">قیمت</th>
                <th class="p-4">موجودی</th>
                <th class="p-4">وضعیت</th>
                <th class="p-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              @for (product of filteredProducts; track product) {
                <tr class="border-t hover:bg-gray-50 transition-colors">
                  <td class="p-4">
                    <div class="flex items-center gap-3">
                      @if (product.imageUrl) {
                        <img [src]="product.imageUrl" class="w-10 h-10 rounded-lg object-cover" alt="" />
                      }
                      <span class="font-medium text-secondary">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="p-4 font-mono text-xs text-gray-500">{{ product.sku }}</td>
                  <td class="p-4">
                    <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{{ product.categoryName }}</span>
                  </td>
                  <td class="p-4">
                    <div class="font-bold text-green-600">{{ getPricing(product.id)?.supplyPrice ?? product.price | persianNumber }} تومان</div>
                    @if (getPricing(product.id)) {
                      <div class="text-[11px] text-gray-400 mt-0.5">
                        قیمت سایت: {{ getPricing(product.id)!.suggestedSitePrice | persianNumber }} تومان
                      </div>
                    }
                  </td>
                  <td class="p-4">
                    <span [class]="(getPricing(product.id)?.availableQuantity ?? product.stockQuantity) > 10 ? 'text-green-600' : (getPricing(product.id)?.availableQuantity ?? product.stockQuantity) > 0 ? 'text-yellow-600' : 'text-red-600'">
                      {{ getPricing(product.id)?.availableQuantity ?? product.stockQuantity }}
                    </span>
                  </td>
                  <td class="p-4">
                    <span class="text-xs px-2 py-1 rounded-full" [class]="product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                      {{ product.isActive ? 'فعال' : 'غیرفعال' }}
                    </span>
                  </td>
                  <td class="p-4">
                    <div class="flex gap-2">
                      <button (click)="startEdit(product)" class="text-blue-600 hover:underline text-xs">ثبت قیمت</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (!filteredProducts.length) {
          <p class="text-gray-400 text-center py-12">محصولی یافت نشد</p>
        }
      </div>
    </section>
    
    <!-- Pricing Modal -->
    @if (editing) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40" (click)="cancelEdit()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
          <h3 class="font-bold text-secondary">ثبت قیمت تأمین — {{ editing.name }}</h3>
          <label class="block">
            <span class="text-xs text-gray-500">قیمت شما (تومان)</span>
            <input type="number" [(ngModel)]="editSupplyPrice"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          </label>
          <label class="block">
            <span class="text-xs text-gray-500">موجودی قابل تأمین</span>
            <input type="number" [(ngModel)]="editQuantity"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          </label>
          <label class="block">
            <span class="text-xs text-gray-500">زمان آماده‌سازی (ساعت)</span>
            <input type="number" [(ngModel)]="editLeadTime"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:ring-2 focus:ring-green-500/30" />
          </label>
          @if (suggestedPrice) {
            <p class="text-xs bg-blue-50 text-blue-700 rounded-xl p-3">
              قیمت پیشنهادی سایت با حاشیه سود و تعدیل مالیات: {{ suggestedPrice | persianNumber }} تومان
            </p>
          }
          @if (editError) {
            <p class="text-xs text-red-500">{{ editError }}</p>
          }
          <div class="flex gap-2 justify-end">
            <button (click)="cancelEdit()" class="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600">انصراف</button>
            <button (click)="savePricing()" [disabled]="saving"
              class="px-5 py-2 text-sm rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-40">
              {{ saving ? 'در حال ذخیره…' : 'ذخیره قیمت' }}
            </button>
          </div>
        </div>
      </div>
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SupplierProductsComponent implements OnInit {
  products: SupplierProduct[] = [];
  pricing: SupplierProductPricing[] = [];
  searchTerm = '';
  filterCategory = '';
  filterStatus = '';
  categories: string[] = [];

  editing: SupplierProduct | null = null;
  editSupplyPrice = 0;
  editQuantity = 0;
  editLeadTime = 0;
  suggestedPrice = 0;
  saving = false;
  editError: string | null = null;

  constructor(private readonly supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadPricing();
  }

  loadProducts(): void {
    this.supplierService.getProducts().subscribe({
      next: (result) => {
        this.products = result.data ?? [];
        this.categories = [...new Set(this.products.map(p => p.categoryName))];
      },
      error: () => {
        // Mock data
        this.products = [
          { id: '1', name: 'انگشتر نقره نگین فیروزه', sku: 'SIL-001', price: 1200000, stockQuantity: 45, categoryName: 'نقره‌آلات', imageUrl: '', isActive: true },
          { id: '2', name: 'دستبند طلای زرد', sku: 'GOLD-001', price: 8500000, stockQuantity: 12, categoryName: 'طلای زرد', imageUrl: '', isActive: true },
          { id: '3', name: 'گردنبند زمرد', sku: 'GEM-001', price: 15000000, stockQuantity: 5, categoryName: 'سنگ‌های قیمتی', imageUrl: '', isActive: true },
          { id: '4', name: 'سرویس چایخوری نقره', sku: 'SIL-002', price: 8500000, stockQuantity: 8, categoryName: 'نقره‌آلات', imageUrl: '', isActive: true },
          { id: '5', name: 'سنگ فیروزه نیشابور', sku: 'GEM-002', price: 500000, stockQuantity: 100, categoryName: 'سنگ‌های قیمتی', imageUrl: '', isActive: true },
        ];
        this.categories = [...new Set(this.products.map(p => p.categoryName))];
      }
    });
  }

  private loadPricing(): void {
    this.supplierService.getMyPricing().subscribe({
      next: (result) => { this.pricing = result.data ?? []; },
      error: () => { this.pricing = []; }
    });
  }

  getPricing(productId: string): SupplierProductPricing | undefined {
    return this.pricing.find(p => p.productId === productId);
  }

  startEdit(product: SupplierProduct): void {
    const existing = this.getPricing(product.id);
    this.editing = product;
    this.editSupplyPrice = existing?.supplyPrice ?? product.price;
    this.editQuantity = existing?.availableQuantity ?? product.stockQuantity;
    this.editLeadTime = existing?.leadTimeHours ?? 0;
    this.suggestedPrice = existing?.suggestedSitePrice ?? 0;
    this.editError = null;
  }

  cancelEdit(): void {
    this.editing = null;
  }

  savePricing(): void {
    if (!this.editing) return;
    if (this.editSupplyPrice <= 0) {
      this.editError = 'قیمت باید بزرگ‌تر از صفر باشد.';
      return;
    }

    this.saving = true;
    this.editError = null;
    this.supplierService.upsertPricing({
      productId: this.editing.id,
      supplyPrice: this.editSupplyPrice,
      availableQuantity: this.editQuantity,
      leadTimeHours: this.editLeadTime
    }).subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          const idx = this.pricing.findIndex(p => p.productId === result.data!.productId);
          if (idx >= 0) this.pricing[idx] = result.data;
          else this.pricing = [...this.pricing, result.data];
          this.editing = null;
        } else {
          this.editError = result.errorMessage ?? 'خطا در ذخیره قیمت';
        }
        this.saving = false;
      },
      error: (err: Error) => {
        this.editError = err.message;
        this.saving = false;
      }
    });
  }

  get filteredProducts(): SupplierProduct[] {
    return this.products.filter(p => {
      const matchSearch = !this.searchTerm || p.name.includes(this.searchTerm) || p.sku.includes(this.searchTerm);
      const matchCategory = !this.filterCategory || p.categoryName === this.filterCategory;
      const matchStatus = !this.filterStatus || (this.filterStatus === 'active' ? p.isActive : !p.isActive);
      return matchSearch && matchCategory && matchStatus;
    });
  }
}
