import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { fadeIn, scaleUp } from '../../shared/animations';
import { Address, AddressData, AddressService } from '../../core/services/api/address.service';
import { OrderService } from '../../core/services/api/order.service';
import { PaymentGatewayOption, PaymentGatewayService } from '../../core/services/api/payment-gateway.service';
import { PaymentService } from '../../core/services/api/payment.service';
import { ShippingMethod, ShippingService } from '../../core/services/api/shipping.service';

/** مراحل تسویه‌حساب */
export type CheckoutStep = 1 | 2 | 3;

/** صفحه تسویه‌حساب؛ ویزارد ۳ مرحله‌ای آدرس، ارسال و پرداخت */
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
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
  savingAddress = false;
  addressMessage = '';
  addressError = '';
  orderNumber = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly addressService: AddressService,
    private readonly shippingService: ShippingService,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService
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
        const defaultAddress = this.addresses.find((address) => address.isDefault) ?? this.addresses[0];
        if (defaultAddress) {
          this.shippingAddressId = defaultAddress.id;
          this.billingAddressId = defaultAddress.id;
        }
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
    this.addressService.addAddress(this.addressForm.value as AddressData).subscribe({
      next: (result) => {
        this.savingAddress = false;
        if (result.isSuccess) {
          this.addressMessage = 'آدرس جدید اضافه شد.';
          this.addressForm.reset({ addressType: 'Both', country: 'ایران', isDefault: false });
          this.showAddressForm = false;
          this.reloadAddresses();
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

  private reloadAddresses(): void {
    this.addressService.getAddresses().subscribe({
      next: (result) => {
        this.addresses = result.data ?? [];
        const newest = this.addresses[this.addresses.length - 1];
        if (newest) {
          this.shippingAddressId = newest.id;
          this.billingAddressId = newest.id;
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

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

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

  /** رفتن به سفارش‌ها پس از ثبت موفق */
  goToOrders(): void {
    this.router.navigate(['/orders']);
  }
}
