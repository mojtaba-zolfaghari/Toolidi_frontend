import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * وضعیت‌های دکمه افزودن به سبد خرید.
 * - idle: حالت عادی
 * - adding: در حال ارسال به API
 * - success: افزودن موفق
 */
export type CartButtonState = 'idle' | 'adding' | 'success';

/**
 * دکمه افزودن به سبد خرید با انیمیشن‌های جذاب.
 *
 * انیمیشن‌ها:
 * - Ripple effect هنگام کلیک
 * - Scale bounce + spinning icon هنگام ارسال
 * - Checkmark draw + confetti particles هنگام موفقیت
 * - Fly-to-cart particle
 */
@Component({
  selector: 'app-add-to-cart-button',
  templateUrl: './add-to-cart-button.component.html',
  styleUrls: ['./add-to-cart-button.component.scss']
})
export class AddToCartButtonComponent {
  /** آیا دکمه غیرفعال باشد (مثلاً ناموجود) */
  @Input() disabled = false;

  /** حالت دکمه */
  @Input() state: CartButtonState = 'idle';

  /** اندازه دکمه */
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  /** نمایش آیکون سبد در حالت idle */
  @Input() showIcon = true;

  /** ابعاد */
  @Input() fullWidth = false;

  /** رویداد کلیک */
  @Output() addToCart = new EventEmitter<void>();

  /** ذرات confetti */
  particles: { id: number; color: string; delay: number; tx: number; ty: number }[] = [];
  private particleId = 0;

  /** ریپل‌ها */
  ripples: { id: number; x: number; y: number }[] = [];
  private rippleId = 0;

  /** آیا hover شده */
  isHovered = false;

  /** متن دکمه */
  get labelText(): string {
    switch (this.state) {
      case 'adding': return 'در حال افزودن…';
      case 'success': return 'افزودن شد! ✓';
      default: return 'افزودن به سبد خرید';
    }
  }

  /** رویداد کلیک */
  onClick(event: MouseEvent): void {
    if (this.disabled || this.state === 'adding' || this.state === 'success') {
      return;
    }
    this.createRipple(event);
    this.addToCart.emit();
  }

  /** ایجاد افکت ریپل */
  private createRipple(event: MouseEvent): void {
    const target = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - target.left;
    const y = event.clientY - target.top;
    const id = this.rippleId++;
    this.ripples.push({ id, x, y });
    setTimeout(() => {
      this.ripples = this.ripples.filter(r => r.id !== id);
    }, 700);
  }

  /** ایجاد ذرات confetti */
  createConfetti(): void {
    this.particles = [];
    const colors = ['#FF6B35', '#FFD700', '#4ECDC4', '#FF4081', '#7C4DFF', '#00E676'];
    for (let i = 0; i < 12; i++) {
      const angle = ((Math.PI * 2) / 12) * i + (Math.random() - 0.5) * 0.5;
      const dist = 40 + Math.random() * 60;
      this.particles.push({
        id: this.particleId++,
        color: colors[i % colors.length],
        delay: Math.random() * 200,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist
      });
    }
    setTimeout(() => {
      this.particles = [];
    }, 1000);
  }
}
