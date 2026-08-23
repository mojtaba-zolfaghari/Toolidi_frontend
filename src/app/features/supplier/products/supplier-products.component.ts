import { Component, OnInit } from '@angular/core';
import { SupplierService, SupplierProduct } from '../../../core/services/api/supplier.service';

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
          <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
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
              <tr *ngFor="let product of filteredProducts" class="border-t hover:bg-gray-50 transition-colors">
                <td class="p-4">
                  <div class="flex items-center gap-3">
                    <img *ngIf="product.imageUrl" [src]="product.imageUrl" class="w-10 h-10 rounded-lg object-cover" alt="" />
                    <span class="font-medium text-secondary">{{ product.name }}</span>
                  </div>
                </td>
                <td class="p-4 font-mono text-xs text-gray-500">{{ product.sku }}</td>
                <td class="p-4">
                  <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{{ product.categoryName }}</span>
                </td>
                <td class="p-4 font-bold text-green-600">{{ product.price | number }} تومان</td>
                <td class="p-4">
                  <span [class]="product.stockQuantity > 10 ? 'text-green-600' : product.stockQuantity > 0 ? 'text-yellow-600' : 'text-red-600'">
                    {{ product.stockQuantity }}
                  </span>
                </td>
                <td class="p-4">
                  <span class="text-xs px-2 py-1 rounded-full" [class]="product.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                    {{ product.isActive ? 'فعال' : 'غیرفعال' }}
                  </span>
                </td>
                <td class="p-4">
                  <div class="flex gap-2">
                    <button class="text-blue-600 hover:underline text-xs">ویرایش</button>
                    <button class="text-red-600 hover:underline text-xs">غیرفعال</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p *ngIf="!filteredProducts.length" class="text-gray-400 text-center py-12">محصولی یافت نشد</p>
      </div>
    </section>
  `
})
export class SupplierProductsComponent implements OnInit {
  products: SupplierProduct[] = [];
  searchTerm = '';
  filterCategory = '';
  filterStatus = '';
  categories: string[] = [];

  constructor(private readonly supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadProducts();
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

  get filteredProducts(): SupplierProduct[] {
    return this.products.filter(p => {
      const matchSearch = !this.searchTerm || p.name.includes(this.searchTerm) || p.sku.includes(this.searchTerm);
      const matchCategory = !this.filterCategory || p.categoryName === this.filterCategory;
      const matchStatus = !this.filterStatus || (this.filterStatus === 'active' ? p.isActive : !p.isActive);
      return matchSearch && matchCategory && matchStatus;
    });
  }
}
