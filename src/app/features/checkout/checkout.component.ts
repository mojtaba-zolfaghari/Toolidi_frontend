import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { fadeIn, scaleUp } from '../../shared/animations';
import { Address, AddressData, AddressService } from '../../core/services/api/address.service';
import { OrderService, EstimatedDelivery } from '../../core/services/api/order.service';
import { PaymentGatewayOption, PaymentGatewayService } from '../../core/services/api/payment-gateway.service';
import { PaymentService } from '../../core/services/api/payment.service';
import { ShippingMethod, ShippingService } from '../../core/services/api/shipping.service';
import { LocationService, Province, City } from '../../core/services/api/location.service';
import { ApiService } from '../../core/services/api.service';
import { Result } from '../../core/models/api-response.model';

interface MinimumOrderViolationDto {
  sellerName: string;
  minimumOrderAmount: number;
  currentAmount: number;
  minimumOrderQuantity?: number;
  currentQuantity?: number;
}

/** مراحل تسویه‌حساب */
export type CheckoutStep = 1 | 2 | 3;

/** صفحه تسویه‌حساب؛ ویزارد ۳ مرحله‌ای آدرس، ارسال و پرداخت */
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
  animations: [fadeIn, scaleUp]
})
export class CheckoutComponent implements OnInit {
  step: CheckoutStep = 1;

  shippingMethods: ShippingMethod[] = [];
  addresses: Address[] = [];
  gateways: PaymentGatewayOption[] = [];

  shippingAddressId = '';
  billingAddressId = '';
  shippingMethodId = '';
  paymentGatewayId = '';
  userNotes = '';

  addressForm: FormGroup;
  showAddressForm = false;

  loading = false;
  loadingOptions = true;
  errorMessage = '';
  successMessage = '';
  minimumOrderWarnings: string[] = [];
  savingAddress = false;
  addressMessage = '';
  addressError = '';
  orderNumber = '';
  estimatedDeliveries: EstimatedDelivery[] = [];
  provinces: Province[] = [];
  cities: City[] = [];
  loadingCities = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly addressService: AddressService,
    private readonly shippingService: ShippingService,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService,
    private readonly locationService: LocationService,
    private readonly api: ApiService
  ) {
    this.addressForm = this.fb.group({
      addressType: ['Both', [Validators.required]],
      addressLine: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['ایران', [Validators.required]],
      phoneNumber: [''],
      isDefault: [false]
    });
  }

  ngOnInit(): void {
    this.loadingOptions = true;
    this.loadProvinces();
    let completed = 0;
    const optionLoaded = (): void => {
      completed += 1;
      if (completed === 3) {
        this.loadingOptions = false;
      }
    };

    this.addressService.getAddresses().subscribe({
      next: (result) => {
        this.addresses = result.data ?? [];
        const defaultShipping = this.shippingAddresses.find((address) => address.isDefault) ?? this.shippingAddresses[0];
        const defaultBilling = this.billingAddresses.find((address) => address.isDefault) ?? this.billingAddresses[0];
        this.shippingAddressId = defaultShipping?.id ?? '';
        this.billingAddressId = defaultBilling?.id ?? '';
        optionLoaded();
      },
      error: () => {
        this.addresses = [];
        optionLoaded();
      }
    });

    this.shippingService.getShippingMethods().subscribe({
      next: (result) => {
        this.shippingMethods = result.data ?? [];
        this.shippingMethodId = this.shippingMethods[0]?.id ?? '';
        optionLoaded();
      },
      error: () => {
        this.shippingMethods = [];
        optionLoaded();
      }
    });

    this.paymentGatewayService.getGateways().subscribe({
      next: (result) => {
        this.gateways = result.data ?? [];
        optionLoaded();
      },
      error: () => {
        this.gateways = [];
        optionLoaded();
      }
    });

    // Load estimated delivery dates
    this.orderService.getEstimatedDelivery().subscribe({
      next: (result) => {
        this.estimatedDeliveries = result.data ?? [];
      },
      error: () => {
        this.estimatedDeliveries = [];
      }
    });
  }

  /** بارگذاری لیست استان‌ها */
  private loadProvinces(): void {
    this.locationService.getProvinces().subscribe({
      next: (result) => { this.provinces = result.data ?? []; },
      error: () => { this.provinces = []; }
    });
  }

  /** تغییر استان — بارگذاری شهرهای مربوطه */
  onProvinceChange(): void {
    const provinceId = this.addressForm.get('state')?.value;
    this.cities = [];
    this.addressForm.patchValue({ city: '' });
    if (!provinceId) return;
    this.loadingCities = true;
    this.locationService.getCitiesByProvince(provinceId).subscribe({
      next: (result) => { this.cities = result.data ?? []; this.loadingCities = false; },
      error: () => { this.cities = []; this.loadingCities = false; }
    });
  }

  /** آدرس‌هایی که برای ارسال قابل انتخاب هستند. */
  get shippingAddresses(): Address[] {
    return this.addresses.filter((address) => this.supportsAddressType(address, 'Shipping'));
  }

  /** آدرس‌هایی که برای صورتحساب قابل انتخاب هستند. */
  get billingAddresses(): Address[] {
    return this.addresses.filter((address) => this.supportsAddressType(address, 'Billing'));
  }

  private supportsAddressType(address: Address, type: 'Shipping' | 'Billing'): boolean {
    const addressType = (address.addressType || 'Both').trim().toLowerCase();
    return addressType === 'both' || addressType === type.toLowerCase();
  }

  /** روش ارسال انتخاب‌شده */
  get selectedShipping(): ShippingMethod | null {
    return this.shippingMethods.find((method) => method.id === this.shippingMethodId) ?? null;
  }

  /** آیا مرحله اول کامل است؟ */
  get canContinueStep1(): boolean {
    return !!this.shippingAddressId && !!this.billingAddressId;
  }

  /** رفتن به مرحله بعد */
  next(): void {
    if (this.step < 3) {
      this.step = (this.step + 1) as CheckoutStep;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** بازگشت به مرحله قبل */
  back(): void {
    if (this.step > 1) {
      this.step = (this.step - 1) as CheckoutStep;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /** انتخاب آدرس برای ارسال یا صورتحساب */
  selectAddress(kind: 'shipping' | 'billing', id: string): void {
    if (kind === 'shipping') {
      this.shippingAddressId = id;
    } else {
      this.billingAddressId = id;
    }
  }

  /** افزودن آدرس جدید */
  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }
    this.savingAddress = true;
    this.addressMessage = '';
    this.addressError = '';
    const addressData = this.addressForm.value as AddressData;
    this.addressService.addAddress(addressData).subscribe({
      next: (result) => {
        this.savingAddress = false;
        if (result.isSuccess) {
          this.addressMessage = 'آدرس جدید اضافه شد.';
          this.addressForm.reset({ addressType: 'Both', country: 'ایران', isDefault: false });
          this.showAddressForm = false;
          this.reloadAddresses(result.data ?? undefined);
        } else {
          this.addressError = result.errorMessage ?? 'ذخیره آدرس انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.savingAddress = false;
        this.addressError = err.message;
      }
    });
  }

  private reloadAddresses(selectedAddressId?: string): void {
    this.addressService.getAddresses().subscribe({
      next: (result) => {
        this.addresses = result.data ?? [];
        const selected = selectedAddressId
          ? this.addresses.find((address) => address.id === selectedAddressId)
          : undefined;

        if (selected) {
          if (this.supportsAddressType(selected, 'Shipping')) this.shippingAddressId = selected.id;
          if (this.supportsAddressType(selected, 'Billing')) this.billingAddressId = selected.id;
        }

        if (!this.shippingAddressId || !this.shippingAddresses.some((address) => address.id === this.shippingAddressId)) {
          this.shippingAddressId = this.shippingAddresses.find((address) => address.isDefault)?.id ?? this.shippingAddresses[0]?.id ?? '';
        }
        if (!this.billingAddressId || !this.billingAddresses.some((address) => address.id === this.billingAddressId)) {
          this.billingAddressId = this.billingAddresses.find((address) => address.isDefault)?.id ?? this.billingAddresses[0]?.id ?? '';
        }
      },
      error: () => (this.addresses = [])
    });
  }

  /** ثبت سفارش و در صورت انتخاب درگاه، شروع پرداخت */
  submit(): void {
    if (!this.shippingAddressId || !this.billingAddressId) {
      this.errorMessage = 'آدرس ارسال و صورتحساب را انتخاب کنید.';
      this.step = 1;
      return;
    }

    // Validate minimum order per seller
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.minimumOrderWarnings = [];

    this.api.get<Result<MinimumOrderViolationDto[]>>('/v1/checkout/validate-minimum-order').subscribe({
      next: (result) => {
        if (result.isSuccess && result.data && result.data.length > 0) {
          this.minimumOrderWarnings = result.data.map((v: MinimumOrderViolationDto) => {
            const msgs: string[] = [];
            if (v.minimumOrderAmount > 0 && v.currentAmount < v.minimumOrderAmount) {
              msgs.push(`${v.sellerName}: حداقل مبلغ ${new Intl.NumberFormat('fa-IR').format(v.minimumOrderAmount)} تومان (الان: ${new Intl.NumberFormat('fa-IR').format(v.currentAmount)} تومان)`);
            }
            if (v.minimumOrderQuantity && v.currentQuantity && v.currentQuantity < v.minimumOrderQuantity) {
              msgs.push(`${v.sellerName}: حداقل تعداد ${v.minimumOrderQuantity} عدد (الان: ${v.currentQuantity} عدد)`);
            }
            return msgs.join('\n');
          }).filter((w: string) => w);
          if (this.minimumOrderWarnings.length > 0) {
            this.loading = false;
            return;
          }
        }
        this.proceedToOrder();
      },
      error: () => {
        // If validation endpoint fails, proceed anyway
        this.proceedToOrder();
      }
    });
  }

  /** ثبت سفارش پس از تأیید حداقل سفارش */
  private proceedToOrder(): void {

    this.orderService
      .createOrder({
        shippingAddressId: this.shippingAddressId,
        billingAddressId: this.billingAddressId,
        shippingMethodId: this.shippingMethodId || undefined,
        userNotes: this.userNotes || undefined
      })
      .subscribe({
        next: (result) => {
          if (!result.isSuccess || !result.data) {
            this.loading = false;
            this.errorMessage = result.errorMessage ?? 'خطا در ثبت سفارش';
            return;
          }

          this.orderNumber = result.data;

          if (!this.paymentGatewayId) {
            this.loading = false;
            this.successMessage = `سفارش با موفقیت ثبت شد. شماره سفارش: ${result.data}`;
            this.step = 3;
            return;
          }

          this.paymentService.requestPayment(result.data, this.paymentGatewayId).subscribe({
            next: (paymentResult) => {
              this.loading = false;
              if (paymentResult.isSuccess && paymentResult.data?.redirectUrl) {
                window.location.assign(paymentResult.data.redirectUrl);
              } else {
                this.successMessage = `سفارش ثبت شد. شماره سفارش: ${result.data}`;
                this.step = 3;
              }
            },
            error: (err: Error) => {
              this.loading = false;
              this.errorMessage = `سفارش ثبت شد، اما پرداخت آغاز نشد: ${err.message}`;
              this.successMessage = `شماره سفارش: ${result.data}`;
              this.step = 3;
            }
          });
        },
        error: (err: Error) => {
          this.loading = false;
          this.errorMessage = err.message;
        }
      });
  }

  /** حداکثر زمان تحویل تخمینی */
  get maxEstimatedDelivery(): string | null {
    const dates = this.estimatedDeliveries
      .filter(d => d.capacitySet && d.estimatedDeliveryDate)
      .map(d => d.estimatedDeliveryDate!);
    if (!dates.length) return null;
    return dates.sort().reverse()[0];
  }

  /** رفتن به جزئیات سفارش */
  goToOrderDetail(orderNumber: string): void {
    this.router.navigate(['/orders', orderNumber]);
  }

  /** رفتن به سفارش‌ها پس از ثبت موفق */
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }
}
