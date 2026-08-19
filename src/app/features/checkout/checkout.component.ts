import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Address, AddressService } from '../../core/services/api/address.service';
import { OrderService } from '../../core/services/api/order.service';
import { PaymentGatewayOption, PaymentGatewayService } from '../../core/services/api/payment-gateway.service';
import { PaymentService } from '../../core/services/api/payment.service';
import { ShippingMethod, ShippingService } from '../../core/services/api/shipping.service';

/** صفحه تسویه‌حساب؛ انتخاب آدرس، روش ارسال و درگاه پرداخت */
@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  shippingMethods: ShippingMethod[] = [];
  addresses: Address[] = [];
  gateways: PaymentGatewayOption[] = [];
  form: FormGroup;
  loading = false;
  loadingOptions = true;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly addressService: AddressService,
    private readonly shippingService: ShippingService,
    private readonly paymentGatewayService: PaymentGatewayService,
    private readonly paymentService: PaymentService,
    private readonly orderService: OrderService
  ) {
    this.form = this.fb.group({
      shippingAddressId: ['', [Validators.required]],
      billingAddressId: ['', [Validators.required]],
      shippingMethodId: [''],
      paymentGatewayId: [''],
      userNotes: ['']
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
        const defaultAddress = this.addresses.find((address) => address.isDefault);
        if (defaultAddress) {
          this.form.patchValue({ shippingAddressId: defaultAddress.id, billingAddressId: defaultAddress.id });
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
        optionLoaded();
      },
      error: () => {
        this.shippingMethods = [];
        optionLoaded();
      }
    });
    this.paymentGatewayService.getGateways().subscribe({
      next: (gateways) => {
        this.gateways = gateways;
        optionLoaded();
      },
      error: () => {
        this.gateways = [];
        optionLoaded();
      }
    });
  }

  /** ثبت سفارش و در صورت انتخاب درگاه، شروع پرداخت */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const value = this.form.value;

    this.orderService.createOrder({
      shippingAddressId: value.shippingAddressId,
      billingAddressId: value.billingAddressId,
      shippingMethodId: value.shippingMethodId || undefined,
      userNotes: value.userNotes || undefined
    }).subscribe({
      next: (result) => {
        if (!result.isSuccess || !result.data) {
          this.loading = false;
          this.errorMessage = result.errorMessage ?? 'خطا در ثبت سفارش';
          return;
        }

        const gatewayId = value.paymentGatewayId as string;
        if (!gatewayId) {
          this.loading = false;
          this.successMessage = `سفارش با موفقیت ثبت شد. شناسه سفارش: ${result.data}`;
          return;
        }

        this.paymentService.requestPayment(result.data, gatewayId).subscribe({
          next: (paymentResult) => {
            this.loading = false;
            if (paymentResult.isSuccess && paymentResult.data?.redirectUrl) {
              window.location.assign(paymentResult.data.redirectUrl);
            } else {
              this.successMessage = `سفارش ثبت شد، اما شروع پرداخت انجام نشد. شناسه سفارش: ${result.data}`;
            }
          },
          error: (err: Error) => {
            this.loading = false;
            this.errorMessage = `سفارش ثبت شد، اما پرداخت آغاز نشد: ${err.message}`;
          }
        });
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err.message;
      }
    });
  }
}
