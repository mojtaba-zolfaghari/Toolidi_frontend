import { AfterViewInit, Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { fadeIn } from '../../shared/animations';
import { Brand, BrandService } from '../../core/services/api/brand.service';
import { Category, CategoryService } from '../../core/services/api/category.service';
import {
  CreateProductData,
  Product,
  ProductService
} from '../../core/services/api/product.service';
import { ACCESS_TOKEN_KEY } from '../../core/interceptors/token.interceptor';
import { getRoleFromToken } from '../../core/utils/jwt.util';

import { AttributesComponent } from './attributes.component';
import { ImageUploadComponent } from './image-upload.component';
import { VariationsComponent } from './variations.component';
import { AttributeGroup } from './product-management.models';

type ProductSaveMode = 'draft' | 'approval' | 'publish' | 'save';

/** فرم چندمرحله‌ای ایجاد/ویرایش محصول */
@Component({
    selector: 'app-product-form',
    templateUrl: './product-form.component.html',
    animations: [fadeIn],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductFormComponent implements OnInit, AfterViewInit {
  @ViewChild(ImageUploadComponent) imageUpload!: ImageUploadComponent;
  @ViewChild(AttributesComponent) attributesComp!: AttributesComponent;
  @ViewChild(VariationsComponent) variationsComp!: VariationsComponent;

  form!: FormGroup;
  step = 1;
  isAdmin = false;
  isEdit = false;
  productId: string | null = null;

  categories: Category[] = [];
  brands: Brand[] = [];
  loading = true;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  private pendingProduct: Product | null = null;
  private loadedImageIds = new Set<string>();
  private loadedImageSnapshot = new Map<string, string>();
  private loadedAttributeIds = new Set<string>();
  private loadedVariationIds = new Set<string>();

  steps = [
    { index: 1, label: 'اطلاعات پایه' },
    { index: 2, label: 'قیمت و موجودی' },
    { index: 3, label: 'تصاویر' },
    { index: 4, label: 'ویژگی‌ها' },
    { index: 5, label: 'تنوع‌ها' },
    { index: 6, label: 'تخفیف' },
    { index: 7, label: 'سئو و انتشار' }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly categoryService: CategoryService,
    private readonly brandService: BrandService,
    private readonly productService: ProductService
  ) {
    this.buildForm();
  }

  ngAfterViewInit(): void {
    this.applyLoadedProduct();
  }

  ngOnInit(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
    this.isAdmin = getRoleFromToken(token) === 'Admin';

    this.categoryService.getCategories().subscribe({
      next: (paged) => (this.categories = paged.items ?? []),
      error: () => (this.categories = [])
    });

    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      const slug = this.form.get('slug');
      if (slug && !slug.dirty && !slug.value) slug.setValue(this.slugFromName(name), { emitEvent: false });
    });

    this.brandService.getBrands({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => (this.brands = result.data?.items ?? []),
      error: () => (this.brands = [])
    });

    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.productId;

    if (this.isEdit && this.productId) {
      this.loadProduct(this.productId);
    } else {
      this.loading = false;
    }
  }

  /** ساخت فرم واکنشی */
  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(300)]],
      slug: [''],
      sku: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      brandId: [''],
      shortDescription: [''],
      fullDescription: [''],
      unitPrice: [null, [Validators.required, Validators.min(1)]],
      comparePrice: [null],
      costPrice: [null],
      stockQuantity: [0],
      weight: [null],
      isPhysical: [true],
      isTaxable: [true],
      taxRate: [null],
      metaTitle: [''],
      metaDescription: [''],
      metaKeywords: [''],
      discountEnabled: [false],
      discountType: ['percentage'],
      discountValue: [null],
      discountStartDate: [''],
      discountEndDate: ['']
    });
  }

  /** بارگذاری محصول برای ویرایش */
  private loadProduct(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (result) => {
        const product = result.data;
        if (product) {
          this.pendingProduct = product;
          this.form.patchValue({
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            categoryId: product.categoryId,
            brandId: product.brandId ?? '',
            shortDescription: product.shortDescription ?? '',
            fullDescription: product.fullDescription ?? '',
            unitPrice: product.unitPrice,
            comparePrice: product.comparePrice ?? null,
            taxRate: product.taxRate ?? null,
            weight: product.weight ?? null,
            isPhysical: product.isPhysical,
            isTaxable: true
          });
          this.applyLoadedProduct();
        }
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
  }

  /** انتقال تصاویر، ویژگی‌ها و تنوع‌های موجود به کنترل‌های فرزند در حالت ویرایش */
  private applyLoadedProduct(): void {
    const product = this.pendingProduct;
    if (!product || !this.imageUpload || !this.attributesComp || !this.variationsComp) return;

    this.loadedImageIds = new Set((product.images ?? []).map((image) => image.id));
    this.loadedImageSnapshot = new Map((product.images ?? []).map((image) => [image.id, `${image.imageUrl}|${image.altText ?? ''}|${image.isPrimary}|${image.displayOrder > 0 ? image.displayOrder - 1 : 0}`]));
    this.loadedAttributeIds = new Set((product.attributes ?? []).map((attribute) => attribute.id));
    this.loadedVariationIds = new Set((product.variations ?? []).map((variation) => variation.id));
    this.imageUpload.images = (product.images ?? []).map((image) => ({
      id: image.id,
      dataUrl: image.imageUrl,
      altText: image.altText ?? product.name,
      isPrimary: image.isPrimary
    }));

    const groups = new Map<string, AttributeGroup>();
    for (const attribute of product.attributes ?? []) {
      const group = groups.get(attribute.name) ?? { name: attribute.name, values: [] };
      group.values.push({ id: attribute.id, value: attribute.value });
      groups.set(attribute.name, group);
    }
    this.attributesComp.attributes = Array.from(groups.values());
    this.variationsComp.variations = (product.variations ?? []).map((variation) => ({
      id: variation.id,
      sku: variation.sku,
      displayName: variation.displayName,
      priceAdjustment: variation.priceAdjustment,
      stockQuantity: variation.stockQuantity,
      isDefault: variation.isDefault
    }));
  }

  /** دسترسی امن به ویژگی‌ها برای اتصال به تنوع‌ها */
  get attributeGroups() {
    return this.attributesComp?.attributes ?? [];
  }

  /** تولید اسلاگ از نام */
  generateSlug(): void {
    const name = this.form.get('name')?.value ?? '';
    this.form.get('slug')?.setValue(this.slugFromName(name));
  }

  /** رفتن به مرحله بعد */
  next(): void {
    if (this.step < 7) {
      this.step += 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** بازگشت به مرحله قبل */
  back(): void {
    if (this.step > 1) {
      this.step -= 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** اعتبارسنجی مرحله جاری */
  get currentStepValid(): boolean {
    if (this.step === 1) {
      return !!this.form.get('name')?.valid && !!this.form.get('sku')?.valid && !!this.form.get('categoryId')?.valid;
    }
    if (this.step === 2) {
      return !!this.form.get('unitPrice')?.valid;
    }
    return true;
  }

  /** ساخت payload برای ایجاد/ویرایش محصول */
  private buildPayload(): CreateProductData {
    const value = this.form.value;
    return {
      categoryId: value.categoryId,
      brandId: value.brandId || undefined,
      name: value.name,
      sku: value.sku,
      shortDescription: value.shortDescription || undefined,
      fullDescription: value.fullDescription || undefined,
      unitPrice: Number(value.unitPrice),
      comparePrice: value.comparePrice != null ? Number(value.comparePrice) : undefined,
      costPrice: value.costPrice != null ? Number(value.costPrice) : undefined,
      isTaxable: value.isTaxable,
      taxRate: value.taxRate != null ? Number(value.taxRate) : undefined,
      weight: value.weight != null ? Number(value.weight) : undefined,
      isPhysical: value.isPhysical,
      metaTitle: value.metaTitle || undefined,
      metaDescription: value.metaDescription || undefined,
      metaKeywords: value.metaKeywords || undefined
    };
  }

  saveDraft(): void { void this.save('draft'); }

  submitForApproval(): void { void this.save('approval'); }

  saveProduct(): void { void this.save('save'); }

  publishProduct(): void { void this.save('publish'); }

  /** ذخیره محصول */
  async save(mode: ProductSaveMode): Promise<void> {
    const publishAfter = mode === 'publish' && this.isAdmin;
    if (!this.currentStepValid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'لطفاً فیلدهای الزامی را تکمیل کنید.';
      return;
    }

    const discountError = this.validateDiscount();
    if (discountError) {
      this.errorMessage = discountError;
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const payload = this.buildPayload();
      let productId = this.productId;

      if (this.isEdit && productId) {
        const result = await firstValueFrom(this.productService.updateProduct(productId, payload));
        if (!result.isSuccess) throw new Error(result.errorMessage ?? 'ویرایش محصول انجام نشد.');
      } else {
        const result = await firstValueFrom(this.productService.createProduct(payload));
        if (!result.isSuccess || !result.data) {
          throw new Error(result.errorMessage ?? 'خطا در ایجاد محصول');
        }
        productId = result.data;
      }

      if (!productId) {
        throw new Error('شناسه محصول دریافت نشد.');
      }

      // API تصویر endpoint ویرایش ندارد؛ در صورت تغییر لیست/ترتیب/تصویر اصلی، تصاویر قبلی
      // حذف و وضعیت فعلی دوباره ثبت می‌شود تا حذف و تصویر اصلی واقعاً پایدار بماند.
      const images = this.imageUpload?.images ?? [];
      const imageStateChanged = this.isEdit
        ? images.length !== this.loadedImageSnapshot.size
          || images.some((image, index) => !image.id || this.loadedImageSnapshot.get(image.id) !== `${image.dataUrl}|${image.altText ?? ''}|${image.isPrimary}|${index}`)
        : true;
      if (imageStateChanged) {
        for (const imageId of this.loadedImageIds) {
          await firstValueFrom(this.productService.deleteImage(imageId));
        }
        for (let i = 0; i < images.length; i += 1) {
          const image = images[i];
          await firstValueFrom(
            this.productService.uploadImage(productId, {
              imageUrl: image.dataUrl,
              altText: image.altText,
              displayOrder: i,
              isPrimary: image.isPrimary
            })
          );
        }
      }

      // endpointهای ویژگی و تنوع در بک‌اند فعلی فقط برای فروشنده مجاز هستند.
      if (!this.isAdmin) {
        // افزودن یا به‌روزرسانی ویژگی‌ها (نام + مقدار)
        const attributes = this.attributesComp?.attributes ?? [];
        for (const group of attributes) {
          for (const attrValue of group.values) {
            if (group.name.trim() && attrValue.value.trim()) {
              const attributeData = { name: group.name, value: attrValue.value };
              if (attrValue.id) {
                const result = await firstValueFrom(this.productService.updateAttribute(attrValue.id, attributeData));
                if (!result.isSuccess) throw new Error(result.errorMessage ?? 'به‌روزرسانی ویژگی انجام نشد.');
              } else {
                await firstValueFrom(this.productService.addAttribute(productId, attributeData));
              }
            }
          }
        }

        // افزودن یا به‌روزرسانی تنوع‌ها (یا تنوع پیش‌فرض با موجودی)
        let variations = this.variationsComp?.variations ?? [];
        if (!variations.length && this.form.get('stockQuantity')?.value) {
          variations = [{ sku: `${this.form.get('sku')?.value}-1`, displayName: 'پیش‌فرض', priceAdjustment: 0, stockQuantity: Number(this.form.get('stockQuantity')?.value), isDefault: true }];
        }
        for (const variation of variations) {
          const variationData = { sku: variation.sku, displayName: variation.displayName, priceAdjustment: variation.priceAdjustment, stockQuantity: variation.stockQuantity, isDefault: variation.isDefault };
          if (variation.id) {
            const result = await firstValueFrom(this.productService.updateVariation(variation.id, variationData));
            if (!result.isSuccess) throw new Error(result.errorMessage ?? 'به‌روزرسانی تنوع انجام نشد.');
          } else {
            await firstValueFrom(this.productService.addVariation(productId, variationData));
          }
        }
        const currentVariationIds = new Set(variations.filter((variation) => variation.id).map((variation) => variation.id as string));
        for (const variationId of this.loadedVariationIds) {
          if (!currentVariationIds.has(variationId)) await firstValueFrom(this.productService.deleteVariation(variationId));
        }
        const currentAttributeIds = new Set((this.attributesComp?.attributes ?? []).flatMap((group) => group.values.filter((value) => value.id).map((value) => value.id as string)));
        for (const attributeId of this.loadedAttributeIds) {
          if (!currentAttributeIds.has(attributeId)) await firstValueFrom(this.productService.deleteAttribute(attributeId));
        }
      }

      // اعمال تخفیف
      if (this.form.get('discountEnabled')?.value && this.form.get('discountValue')?.value) {
        const unitPrice = Number(this.form.get('unitPrice')?.value);
        const discountValue = Number(this.form.get('discountValue')?.value);
        const discountType = this.form.get('discountType')?.value;
        const price = discountType === 'percentage' ? unitPrice * (1 - discountValue / 100) : unitPrice - discountValue;
        await firstValueFrom(
          this.productService.applyDiscount(productId, {
            price: Math.max(price, 0),
            startDate: new Date(this.form.get('discountStartDate')?.value).toISOString(),
            endDate: new Date(this.form.get('discountEndDate')?.value).toISOString()
          })
        );
      }

      // انتشار فوری (فقط مدیر)
      if (publishAfter && this.isAdmin) {
        await firstValueFrom(this.productService.approveProduct(productId));
        await firstValueFrom(this.productService.publishProduct(productId));
      }

      this.successMessage = publishAfter
        ? 'محصول با موفقیت ثبت و منتشر شد.'
        : mode === 'approval'
          ? 'محصول برای بررسی و تأیید ارسال شد.'
          : 'محصول با موفقیت ذخیره شد.';
      setTimeout(() => this.goToList(), 1200);
    } catch (error) {
      this.errorMessage = (error as Error)?.message ?? 'خطا در ذخیره محصول';
    } finally {
      this.submitting = false;
    }
  }

  private slugFromName(name: string): string {
    return String(name ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '');
  }

  private validateDiscount(): string {
    if (!this.form.get('discountEnabled')?.value) return '';
    const value = Number(this.form.get('discountValue')?.value);
    const start = this.form.get('discountStartDate')?.value;
    const end = this.form.get('discountEndDate')?.value;
    if (!Number.isFinite(value) || value <= 0 || !start || !end) return 'برای تخفیف، مقدار و بازه زمانی را کامل کنید.';
    if (end < start) return 'تاریخ پایان تخفیف باید بعد از تاریخ شروع باشد.';
    if (this.form.get('discountType')?.value === 'percentage' && value > 100) return 'درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.';
    return '';
  }

  /** بازگشت به لیست محصولات */
  goToList(): void {
    const base = this.isAdmin ? '/admin' : '/seller';
    this.router.navigate([`${base}/products`]);
  }
}
