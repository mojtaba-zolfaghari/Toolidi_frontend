import { Component, HostListener, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, catchError, of } from 'rxjs';
import { CategoryService, CategoryTreeNode } from '../../core/services/api/category.service';

/** یک دسته‌ی کلی در مگامنو و زیر‌دسته‌های آن */
export interface MegaMenuGroup {
  id: string;
  icon: string;
  title: string;
  color: string;
  children: CategoryTreeNode[];
}

@Component({
    selector: 'app-mega-menu',
    template: `
    <div class="mega-menu-root" (mouseenter)="onMouseEnter()" (mouseleave)="onMouseLeave()">
      <button
        type="button"
        class="mega-menu-trigger"
        (click)="toggleMenu()"
        [class.mega-menu-trigger-active]="isOpen"
        [attr.aria-expanded]="isOpen"
        aria-haspopup="true">
        <svg xmlns="http://www.w3.org/2000/svg" class="mega-menu-burger" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
        <span>دسته‌بندی‌ها</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="mega-menu-caret" [class.mega-menu-caret--open]="isOpen" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7"/>
        </svg>
      </button>
    
      @if (isOpen) {
        <section class="mega-menu-panel" (click)="$event.stopPropagation()" aria-label="دسته‌بندی محصولات">
          <div class="mega-menu-heading">
            <div>
              <span class="mega-menu-eyebrow">انتخاب حوزه</span>
              <h3>از دسته‌های اصلی شروع کنید</h3>
            </div>
            <span class="mega-menu-count">{{ menuGroups.length | persianNumber }} حوزه فعال</span>
          </div>
          @if (menuGroups.length) {
            <div class="mega-menu-content">
              <nav class="mega-menu-groups" aria-label="دسته‌های اصلی">
                @for (group of menuGroups; track group; let i = $index) {
                  <a
                    [routerLink]="['/shop']"
                    [queryParams]="{ categoryId: group.id }"
                    class="mega-menu-group"
                    [class.mega-menu-group-active]="activeGroupIndex === i"
                    [style.--group-color]="group.color"
                    (mouseenter)="setActiveGroup(i)"
                    (focus)="setActiveGroup(i)"
                    (click)="onGroupTap(i, $event)">
                    <span class="mega-menu-group-icon">{{ group.icon }}</span>
                    <span class="mega-menu-group-copy">
                      <strong>{{ group.title }}</strong>
                      <small>{{ group.children.length ? (group.children.length + ' زیر‌دسته') : 'مشاهده محصولات' }}</small>
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" class="mega-menu-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7"/>
                    </svg>
                  </a>
                }
              </nav>
              @if (activeGroup; as group) {
                <div class="mega-menu-submenu">
                  <div class="mega-menu-submenu-header" [style.--group-color]="group.color">
                    <span class="mega-menu-submenu-icon">{{ group.icon }}</span>
                    <div>
                      <span class="mega-menu-eyebrow">زیر‌دسته‌های حوزه</span>
                      <h4>{{ group.title }}</h4>
                    </div>
                  </div>
                  @if (group.children.length) {
                    <div class="mega-menu-children">
                      @for (child of group.children; track child) {
                        <a
                          [routerLink]="['/shop']"
                          [queryParams]="{ categoryId: child.id }"
                          class="mega-menu-child"
                          (click)="closeMenu()">
                          <span class="mega-menu-child-dot" [style.background]="group.color"></span>
                          <span>{{ child.name }}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" class="mega-menu-child-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7"/>
                          </svg>
                        </a>
                      }
                    </div>
                  } @else {
                    <div class="mega-menu-no-children">محصولات این حوزه را مشاهده کنید.</div>
                  }
                  <a [routerLink]="['/shop']" [queryParams]="{ categoryId: group.id }" class="mega-menu-all-link" (click)="closeMenu()">
                    مشاهده همه محصولات {{ group.title }} <span>←</span>
                  </a>
                </div>
              }
            </div>
          } @else {
            <div class="mega-menu-empty">دسته‌بندی‌ها در حال بارگذاری هستند.</div>
          }
          <div class="mega-menu-footer">
            <a routerLink="/shop" (click)="closeMenu()">مشاهده همه محصولات ←</a>
            <div><span>💎 {{ totalProducts | persianNumber }}+ محصول</span><span>🏭 {{ totalSellers | persianNumber }}+ تأمین‌کننده</span></div>
          </div>
        </section>
      }
    </div>
    `,
    styles: [`
    :host { display: inline-block; }

    .mega-menu-root { position: relative; }
    .mega-menu-burger { width: 1.25rem; height: 1.25rem; }
    .mega-menu-caret { width: 0.875rem; height: 0.875rem; transition: transform 0.2s ease; }
    .mega-menu-caret--open { transform: rotate(180deg); }
    .mega-menu-trigger { display: inline-flex; align-items: center; gap: .4rem; color: inherit; background: transparent; border: 0; cursor: pointer; font: inherit; transition: color .2s ease; }
    .mega-menu-trigger:hover, .mega-menu-trigger-active { color: #8eb9ff; }
    .mega-menu-panel { position: absolute; top: calc(100% + 14px); right: -24px; z-index: 100; width: min(92vw, 920px); padding: 22px; border: 1px solid #e7edf6; border-radius: 20px; color: #1d2b49; background: rgba(255,255,255,.98); box-shadow: 0 24px 60px rgba(17, 35, 70, .2); animation: megaMenuIn .18s ease-out; }
    .mega-menu-panel::before { content: ''; position: absolute; top: -7px; right: 52px; width: 14px; height: 14px; border-top: 1px solid #e7edf6; border-right: 1px solid #e7edf6; background: #fff; transform: rotate(-45deg); }
    .mega-menu-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 2px 4px 18px; border-bottom: 1px solid #edf1f6; }
    .mega-menu-heading h3, .mega-menu-submenu h4 { margin: 4px 0 0; color: #182744; font-size: 18px; font-weight: 800; }
    .mega-menu-eyebrow { display: block; color: #6b91c7; font-size: 10px; font-weight: 800; letter-spacing: .02em; }
    .mega-menu-count { padding: 7px 11px; border-radius: 999px; color: #6680a8; background: #f2f6fc; font-size: 10px; white-space: nowrap; }
    .mega-menu-content { display: grid; grid-template-columns: minmax(250px, .82fr) minmax(0, 1.45fr); gap: 18px; min-height: 300px; padding-top: 18px; }
    .mega-menu-groups { display: grid; align-content: start; gap: 7px; padding-left: 18px; border-left: 1px solid #edf1f6; }
    .mega-menu-group { display: flex; align-items: center; gap: 11px; min-height: 58px; padding: 9px 11px; border: 1px solid transparent; border-radius: 13px; color: #63718a; text-decoration: none; transition: background .18s ease, border-color .18s ease, transform .18s ease, color .18s ease; }
    .mega-menu-group:hover, .mega-menu-group-active { border-color: color-mix(in srgb, var(--group-color) 24%, #e6edf6); color: #1b2b4b; background: color-mix(in srgb, var(--group-color) 9%, #fff); transform: translateX(-3px); }
    .mega-menu-group-icon, .mega-menu-submenu-icon { display: grid; place-items: center; flex: 0 0 auto; width: 38px; height: 38px; border-radius: 12px; font-size: 19px; background: color-mix(in srgb, var(--group-color) 14%, #f5f8fc); }
    .mega-menu-group-copy { min-width: 0; flex: 1; }
    .mega-menu-group-copy strong, .mega-menu-group-copy small { display: block; }
    .mega-menu-group-copy strong { overflow: hidden; font-size: 12px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
    .mega-menu-group-copy small { margin-top: 3px; color: #9aa7b9; font-size: 9px; }
    .mega-menu-chevron { width: 15px; height: 15px; color: #a9b4c4; }
    .mega-menu-submenu { min-width: 0; padding: 8px 4px 4px; }
    .mega-menu-submenu-header { display: flex; align-items: center; gap: 12px; padding: 5px 8px 16px; border-bottom: 1px solid #edf1f6; }
    .mega-menu-children { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 16px 8px; }
    .mega-menu-child { display: flex; align-items: center; gap: 8px; min-height: 42px; padding: 9px 10px; border-radius: 10px; color: #5f6e85; text-decoration: none; font-size: 11px; transition: color .18s ease, background .18s ease, transform .18s ease; }
    .mega-menu-child:hover { color: #2d6dcc; background: #f3f7fd; transform: translateX(-2px); }
    .mega-menu-child-dot { width: 6px; height: 6px; flex: 0 0 auto; border-radius: 50%; }
    .mega-menu-child-arrow { width: 13px; height: 13px; margin-right: auto; color: #b4bfce; }
    .mega-menu-no-children { padding: 28px 8px; color: #8c98aa; font-size: 12px; }
    .mega-menu-all-link { display: inline-flex; align-items: center; gap: 7px; margin: 4px 8px 0; padding: 10px 12px; border-radius: 10px; color: #3678d1; background: #eff6ff; font-size: 11px; font-weight: 800; text-decoration: none; }
    .mega-menu-all-link:hover { background: #e2efff; }
    .mega-menu-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 18px; padding: 15px 4px 0; border-top: 1px solid #edf1f6; font-size: 11px; }
    .mega-menu-footer > a { color: #3678d1; font-weight: 800; text-decoration: none; }
    .mega-menu-footer > div { display: flex; gap: 14px; color: #95a1b2; font-size: 10px; }
    .mega-menu-empty { padding: 40px 10px; color: #8b97aa; text-align: center; font-size: 12px; }

    :host-context(.mobile-mega-menu) { display: block; }
    :host-context(.mobile-mega-menu) .mega-menu-root { width: 100%; }
    :host-context(.mobile-mega-menu) .mega-menu-trigger { display: flex; width: 100%; justify-content: space-between; padding: .85rem 1rem; border-radius: 1rem; color: rgba(255,255,255,.9); }
    :host-context(.mobile-mega-menu) .mega-menu-trigger:hover, :host-context(.mobile-mega-menu) .mega-menu-trigger-active { color: #fff; background: rgba(108,63,197,.28); }
    :host-context(.mobile-mega-menu) .mega-menu-panel { position: relative; top: auto; right: auto; width: 100%; max-height: min(62vh, 34rem); overflow-y: auto; margin-top: .4rem; padding: .8rem; border-color: rgba(255,255,255,.12); border-radius: 1rem; background: rgba(255,255,255,.98); box-shadow: 0 18px 40px rgba(0,0,0,.24); }
    :host-context(.mobile-mega-menu) .mega-menu-panel::before { display: none; }
    :host-context(.mobile-mega-menu) .mega-menu-heading { align-items: flex-start; gap: .5rem; padding-bottom: .75rem; }
    :host-context(.mobile-mega-menu) .mega-menu-heading h3 { font-size: .85rem; }
    :host-context(.mobile-mega-menu) .mega-menu-content { gap: .65rem; padding-top: .65rem; }
    :host-context(.mobile-mega-menu) .mega-menu-groups { grid-template-columns: 1fr; gap: .3rem; padding: 0 0 .65rem; }
    :host-context(.mobile-mega-menu) .mega-menu-group { min-height: 3.2rem; padding: .55rem .6rem; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    :host-context(.mobile-mega-menu) .mega-menu-group-active { background: rgba(108,63,197,.28); border-color: rgba(108,63,197,.35); color: #fff; }
    :host-context(.mobile-mega-menu) .mega-menu-chevron { opacity: .5; transition: transform .2s ease; }
    :host-context(.mobile-mega-menu) .mega-menu-group-active .mega-menu-chevron { transform: rotate(90deg); opacity: 1; }
    :host-context(.mobile-mega-menu) .mega-menu-group-copy strong { font-size: .7rem; }
    :host-context(.mobile-mega-menu) .mega-menu-submenu-header { padding: .2rem .35rem .65rem; }
    :host-context(.mobile-mega-menu) .mega-menu-submenu h4 { font-size: .85rem; }
    :host-context(.mobile-mega-menu) .mega-menu-children { gap: .25rem; padding: .55rem .15rem; }
    :host-context(.mobile-mega-menu) .mega-menu-child { min-height: 2.6rem; padding: .5rem .6rem; font-size: .72rem; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
    :host-context(.mobile-mega-menu) .mega-menu-footer { gap: .5rem; margin-top: .65rem; padding-top: .65rem; }

    @keyframes megaMenuIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 720px) {
      .mega-menu-panel { right: -120px; width: min(94vw, 560px); padding: 15px; }
      .mega-menu-content { grid-template-columns: 1fr; min-height: 0; }
      .mega-menu-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); padding-left: 0; padding-bottom: 12px; border-left: 0; border-bottom: 1px solid #edf1f6; }
      .mega-menu-group { min-height: 50px; }
      .mega-menu-group-copy small { display: none; }
      .mega-menu-children { grid-template-columns: 1fr; }
      .mega-menu-footer { align-items: flex-start; flex-direction: column; }
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MegaMenuComponent implements OnInit, OnDestroy {
  isOpen = false;
  menuGroups: MegaMenuGroup[] = [];
  activeGroupIndex = 0;
  totalProducts = 0;
  totalSellers = 0;
  isMobile = false;

  private hoverTimeout: ReturnType<typeof setTimeout> | undefined;
  private subscription?: Subscription;

  private readonly visualConfig = [
    { icon: '💍', title: 'زیورآلات و جواهرات', color: '#c084fc', keywords: ['زیور', 'انگشتر', 'گردنبند', 'دستبند', 'گوشواره', 'حلقه', 'طلا', 'نقره', 'سنگ', 'جواهرات'] },
    { icon: '👕', title: 'پوشاک و مد', color: '#60a5fa', keywords: ['لباس', 'پوشاک', 'پوشیدنی', 'مد'] },
    { icon: '💄', title: 'آرایشی و بهداشتی', color: '#f472b6', keywords: ['آرایشی', 'بهداشتی', 'مراقبت', 'زیبایی'] },
    { icon: '♻️', title: 'صنایع پلاستیکی', color: '#34d399', keywords: ['پلاستیک', 'پلاستیکی'] },
    { icon: '⛏️', title: 'ابزار و تجهیزات معدن', color: '#f97316', keywords: ['ابزار', 'معدن', 'تجهیزات'] },
    { icon: '🎨', title: 'دست‌ساز و عتیقه', color: '#a78bfa', keywords: ['دست‌ساز', 'عتیقه', 'کلکسیونی'] }
  ];

  constructor(private readonly categoryService: CategoryService, private readonly router: Router) {}

  ngOnInit(): void {
    this.checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._resizeHandler);
    }
    this.subscription = this.categoryService.getCategoryTree().pipe(
      catchError(() => {
        this.buildFallbackGroups();
        return of(null);
      })
    ).subscribe((result) => {
      const categories = result?.data ?? [];
      if (categories.length) {
        this.buildGroups(categories);
      } else if (!this.menuGroups.length) {
        this.buildFallbackGroups();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._resizeHandler);
    }
  }

  private _resizeHandler = (): void => this.checkMobile();

  private checkMobile(): void {
    if (typeof window === 'undefined') { this.isMobile = false; return; }
    // Touch device OR narrow viewport = mobile behavior
    this.isMobile = window.innerWidth < 900 || ('ontouchstart' in window);
  }

  get activeGroup(): MegaMenuGroup | null {
    return this.menuGroups[this.activeGroupIndex] ?? this.menuGroups[0] ?? null;
  }

  onMouseEnter(): void {
    if (this.hoverTimeout) clearTimeout(this.hoverTimeout);
    this.isOpen = true;
  }

  onMouseLeave(): void {
    this.hoverTimeout = setTimeout(() => { this.isOpen = false; }, 220);
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  setActiveGroup(index: number): void {
    this.activeGroupIndex = index;
  }

  /**
   * روی موبایل: اولین تاپ زیرمجموعه را نشان بده، تاپ دوم ناوبری کند.
   * روی دسکتاپ: همان رفتار قبلی (کلیک = ناوبری).
   */
  onGroupTap(index: number, event: Event): void {
    if (!this.isMobile) { return; }
    event.preventDefault();
    event.stopPropagation();
    if (this.activeGroupIndex === index) {
      // تاپ دوم → ناوبری
      const group = this.menuGroups[index];
      if (group) {
        this.closeMenu();
        this.router.navigate(['/shop'], { queryParams: { categoryId: group.id } });
      }
    } else {
      // اولین تاپ → نمایش زیرمجموعه
      this.setActiveGroup(index);
    }
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // On mobile, the toggle button handles open/close — don't interfere
    if (this.isMobile) { return; }
    const target = event.target as HTMLElement | null;
    if (target?.closest('app-mega-menu')) {
      return;
    }
    this.isOpen = false;
  }

  private buildGroups(roots: CategoryTreeNode[]): void {
    const categories = roots
      .filter((root) => root.isActive !== false)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    const assigned = new Set<string>();

    this.menuGroups = this.visualConfig
      .map((config) => {
        const children = categories.filter((category) =>
          config.keywords.some((keyword) => category.name.includes(keyword))
        );
        children.forEach((category) => assigned.add(category.id));
        const anchor = children[0];
        return anchor ? {
          id: anchor.id,
          title: config.title,
          icon: config.icon,
          color: config.color,
          children: children.flatMap((category) => category.children?.length ? category.children : [category])
        } : null;
      })
      .filter((group): group is MegaMenuGroup => group !== null);

    const remaining = categories.filter((category) => !assigned.has(category.id));
    if (remaining.length) {
      this.menuGroups.push({
        id: remaining[0].id,
        title: 'سایر حوزه‌ها',
        icon: '📦',
        color: '#6b7280',
        children: remaining
      });
    }
    this.activeGroupIndex = 0;
  }

  private buildFallbackGroups(): void {
    this.menuGroups = [
      { id: '1', icon: '💍', title: 'زیورآلات', color: '#c084fc', children: [
        { id: '11', name: 'انگشتر', slug: 'rings', isActive: true, displayOrder: 1, children: [] },
        { id: '12', name: 'گردنبند', slug: 'necklaces', isActive: true, displayOrder: 2, children: [] },
        { id: '13', name: 'دستبند', slug: 'bracelets', isActive: true, displayOrder: 3, children: [] },
        { id: '14', name: 'گوشواره', slug: 'earrings', isActive: true, displayOrder: 4, children: [] }
      ] },
      { id: '2', icon: '⚪', title: 'نقره‌آلات', color: '#94a3b8', children: [
        { id: '21', name: 'نقره زنانه', slug: 'women-silver', isActive: true, displayOrder: 1, children: [] },
        { id: '22', name: 'نقره مردانه', slug: 'men-silver', isActive: true, displayOrder: 2, children: [] }
      ] },
      { id: '3', icon: '🥇', title: 'طلای زرد و سفید', color: '#fbbf24', children: [
        { id: '31', name: 'طلای زرد', slug: 'yellow-gold', isActive: true, displayOrder: 1, children: [] },
        { id: '32', name: 'طلای سفید', slug: 'white-gold', isActive: true, displayOrder: 2, children: [] }
      ] },
      { id: '4', icon: '💠', title: 'سنگ‌های قیمتی', color: '#34d399', children: [] },
      { id: '5', icon: '⛏️', title: 'ابزار و تجهیزات معدن', color: '#f97316', children: [] }
    ];
    this.activeGroupIndex = 0;
  }
}
