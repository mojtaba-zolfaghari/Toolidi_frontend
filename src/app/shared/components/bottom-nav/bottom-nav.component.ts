import { Component } from '@angular/core';
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
    <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-md safe-bottom md:hidden">
      <div class="flex items-center justify-around px-2 py-1">
        <a *ngFor="let item of items"
           [routerLink]="item.route"
           routerLinkActive="active"
           class="flex flex-1 flex-col items-center gap-0.5 py-2 text-center transition-colors"
           [class.text-primary]="isActive(item.route)"
           [class.text-gray-400]="!isActive(item.route)">
          <span class="text-xl leading-none">{{ isActive(item.route) && item.activeIcon ? item.activeIcon : item.icon }}</span>
          <span class="text-[10px] font-medium leading-none">{{ item.label }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }
    .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0); }
    .active { color: var(--color-primary, #f97316); }
    .active span:first-child { transform: scale(1.15); }
  `]
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
