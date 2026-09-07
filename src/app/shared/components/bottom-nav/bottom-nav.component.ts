import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  activeIcon?: string;
}

@Component({
    selector: 'app-bottom-nav',
    template: `
    <nav class="bottom-nav">
      <div class="bottom-nav__inner">
        @for (item of items; track item) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="bottom-nav__item"
            [class.bottom-nav__item--active]="isActive(item.route)">
            <span class="bottom-nav__icon">{{ isActive(item.route) && item.activeIcon ? item.activeIcon : item.icon }}</span>
            <span class="bottom-nav__label">{{ item.label }}</span>
          </a>
        }
      </div>
    </nav>
    `,
    styles: [`
    :host { display: block; }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 50;
      border-top: 1px solid #f1f5f9;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      padding-bottom: env(safe-area-inset-bottom, 0);
    }

    .bottom-nav__inner {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0.25rem 0.5rem;
    }

    .bottom-nav__item {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
      padding: 0.5rem 0;
      color: #9ca3af;
      text-align: center;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .bottom-nav__item--active {
      color: var(--mat-sys-primary, #6C3FC5);
    }

    .bottom-nav__icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .bottom-nav__item--active .bottom-nav__icon {
      transform: scale(1.15);
    }

    .bottom-nav__label {
      font-size: 0.625rem;
      font-weight: 500;
      line-height: 1;
    }

    @media (min-width: 768px) {
      .bottom-nav { display: none; }
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BottomNavComponent {
  items: NavItem[] = [
    { icon: '🏠', activeIcon: '🏡', label: 'خانه', route: '/' },
    { icon: '🔍', activeIcon: '🔎', label: 'جستجو', route: '/search' },
    { icon: '🛒', activeIcon: '🛍️', label: 'سبدخرید', route: '/cart' },
    { icon: '📦', activeIcon: '📋', label: 'سفارشات', route: '/orders' },
    { icon: '👤', activeIcon: '👤', label: 'حساب من', route: '/profile' },
  ];

  constructor(private readonly router: Router) {}

  isActive(route: string): boolean {
    if (route === '/') return this.router.url === '/';
    return this.router.url.startsWith(route);
  }
}
