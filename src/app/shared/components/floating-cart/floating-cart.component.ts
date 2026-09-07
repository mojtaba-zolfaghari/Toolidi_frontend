import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/api/cart.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ACCESS_TOKEN_KEY } from '../../../core/interceptors/token.interceptor';

/** دکمه شناور دسترسی سریع به سبد خرید. */
@Component({
    selector: 'app-floating-cart',
    templateUrl: './floating-cart.component.html',
    styleUrls: ['./floating-cart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FloatingCartComponent implements OnInit, OnDestroy {
  itemCount = 0;
  private readonly subscription = new Subscription();

  constructor(
    private readonly cartService: CartService,
    private readonly authState: AuthStateService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscription.add(this.cartService.itemCount$.subscribe((count) => {
      this.itemCount = count;
    }));
    this.subscription.add(this.authState.currentUser$.subscribe((user) => {
      if (user || localStorage.getItem(ACCESS_TOKEN_KEY)) {
        this.cartService.refreshCount();
      } else {
        this.itemCount = 0;
      }
    }));
    if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
      this.cartService.refreshCount();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** رفتن به صفحه سبد یا صفحه ورود در صورت نبود حساب. */
  openCart(): void {
    if (localStorage.getItem(ACCESS_TOKEN_KEY)) {
      void this.router.navigate(['/cart']);
      return;
    }
    void this.router.navigate(['/login'], { queryParams: { returnUrl: '/cart' } });
  }
}
