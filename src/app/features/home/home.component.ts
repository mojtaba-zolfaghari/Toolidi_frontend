import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { Subscription, forkJoin, timer } from 'rxjs';
import { take, finalize, catchError } from 'rxjs/operators';

import { fadeIn, slideUp, staggerList, zoomIn, fadeSlideUp, slideFromRight, slideFromLeft, slideInFromBottom } from '../../shared/animations';
import { CategoryService, CategoryTreeNode } from '../../core/services/api/category.service';
import { ProductService, Product } from '../../core/services/api/product.service';
import { SellerService, DashboardSummary, SellerStatistics } from '../../core/services/api/seller.service';
import { AuthStateService, AuthUser } from '../../core/services/auth-state.service';
import { PlatformStats as ApiPlatformStats, PublicService, PublicSeller } from '../../core/services/api/public.service';
import { SeoService } from '../../core/services/seo.service';

/* ─────────────────── Data Interfaces ─────────────────── */

export interface DisplayCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  productCount?: number;
}

export interface PlatformStats {
  activeProducers: number;
  activeAgents: number;
  completedOrders: number;
  satisfactionRate: number;
  updatedAt?: string;
}

export interface AgentLocation {
  id: string;
  name: string;
  city: string;
  province: string;
  rating: number;
  activeOrders: number;
  coordinates: { x: number; y: number };
}

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  role: 'producer' | 'buyer' | 'agent';
  status: 'pending' | 'active' | 'completed';
}

export interface RoleCard {
  id: 'supplier' | 'seller' | 'buyer';
  title: string;
  subtitle: string;
  icon: string;
  benefits: string[];
  ctaText: string;
  ctaLink: string;
  gradient: string;
}

export interface SupplierInfo {
  id: string;
  trade: string;
  city: string;
  province: string;
}

export interface SupplierNetworkGroup {
  trade: string;
  icon: string;
  suppliers: SupplierInfo[];
  locations: { city: string; province: string; count: number }[];
}

import { IRAN_PROVINCES, IRAN_CITIES, IRAN_VIEWBOX } from '../../shared/iran-map-data';
import { IRAN_LOCATIONS, IRAN_MAP_CONNECTIONS } from '../../shared/iran-locations';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    animations: [fadeIn, slideUp, staggerList, zoomIn, fadeSlideUp, slideFromRight, slideFromLeft, slideInFromBottom],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  /* ── Data State ── */
  categories: CategoryTreeNode[] = [];
  featuredProducts: Product[] = [];
  platformStats: PlatformStats = { activeProducers: 0, activeAgents: 0, completedOrders: 0, satisfactionRate: 0 };
  agentLocations: AgentLocation[] = [];
  workflowSteps: WorkflowStep[] = [];
  suppliers: SupplierInfo[] = [];
  sellerStats = { activeSellers: 0, monthlyOrders: 0, totalProducts: 0 };
  selectedSupplierTrade = '';

  /* ── Role Cards ── */
  roleCards: RoleCard[] = [
    {
      id: 'supplier',
      title: 'تولیدکننده شوید',
      subtitle: 'محصولات خود را مستقیماً به هزاران فروشنده عرضه کنید',
      icon: 'factory',
      benefits: [
        'دسترسی به شبکه بزرگ فروشندگان عمده',
        'مدیریت سفارشات و موجودی از داشبورد یکپارچه',
        'پرداخت سریع و تضمینشده',
        'پشتیبانی لجستیک و ارسال'
      ],
      ctaText: 'ثبتنام تولیدکننده',
      ctaLink: '/auth/supplier-register',
      gradient: 'linear-gradient(135deg, #6C3FC5 0%, #4A2E9E 100%)'
    },
    {
      id: 'seller',
      title: 'فروشنده شوید',
      subtitle: 'به شبکه تامینکنندگان معتبر متصل شوید',
      icon: 'store',
      benefits: [
        'دسترسی به صدها تامینکننده معتبر',
        'مدیریت چند فروشنده در یک پنل',
        'ابزارهای تحلیل فروش و گزارشگیری',
        'پشتیبانی ۲۴ ساعته'
      ],
      ctaText: 'ثبتنام فروشنده',
      ctaLink: '/auth/seller-register',
      gradient: 'linear-gradient(135deg, #1B2A4A 0%, #2A3F6B 100%)'
    },
    {
      id: 'buyer',
      title: 'خریدار عمده',
      subtitle: 'محصولات را با قیمت کارخانه خریداری کنید',
      icon: 'shopping_cart',
      benefits: [
        'قیمت‌های عمده و رقابتی',
        'ضمانت اصالت کالا',
        'بازگشت وجه در صورت مشکل',
        'ارسال سریع به سراسر کشور'
      ],
      ctaText: 'شروع خرید',
      ctaLink: '/auth/register',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
    }
  ];

  /* ── Animated Counters ── */
  animatedProducers = 0;
  animatedAgents = 0;
  animatedOrders = 0;
  animatedRating = 0;
  statsUpdatedAt = '';
  private counterIntervals: any[] = [];

  /* ── UI State ── */
  loading = true;
  categoriesLoading = true;
  statsLoading = true;
  mapLoading = true;
  heroLoaded = false;
  selectedAgent: AgentLocation | null = null;

  /* ── Scroll Visibility ── */
  sectionVisibility: Record<string, boolean> = {
    hero: false,
    roles: false,
    features: false,
    workflow: false,
    categories: false,
    products: false,
    map: false,
    suppliers: false,
    sellerCta: false,
    agentCta: false,
    stats: false,
    testimonials: false,
  };

  /* ── Auth ── */
  currentUser: AuthUser | null = null;
  private subscriptions = new Subscription();
  private observer: IntersectionObserver | null = null;

  /* ── Map ── */
  readonly iranProvinces = IRAN_PROVINCES;
  readonly iranCities = IRAN_CITIES;
  readonly iranViewBox = IRAN_VIEWBOX;
  mapConnections: { from: { svgX: number; svgY: number }; to: { svgX: number; svgY: number } }[] = [];
  hoveredProvince: string | null = null;

  /* ── Category Icons ── */
  private categoryIcons: Record<string, string> = {
    'لباس و پوشاک': '👕', 'زیورآلات و بدلیجات': '💎', 'لوازم آرایشی و بهداشتی': '💄',
    'صنایع پلاستیکی': '♻️', 'حلقه‌های نامزدی و ازدواج': '💍', 'گردنبند و زنجیر': '📿',
    'دستبند و النگو': '⌚', 'گوشواره': '✨', 'انگشتر نقره‌نگین': '💎',
    'طلای زرد': '🥇', 'طلای سفید': '🥈', 'نقره‌آلات': '⚪',
    'سنگ‌های قیمتی و نیمه‌قیمتی': '💠', 'ابزار و تجهیزات معدن': '⛏️',
    'زیورآلات دست‌ساز': '🎨', 'جواهرات عتیقه و کلکسیونی': '🏺'
  };

  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly sellerService: SellerService,
    private readonly authState: AuthStateService,
    private readonly publicService: PublicService,
    private readonly cdr: ChangeDetectorRef,
    private readonly seo: SeoService
  ) {}

  /* ─────────── Lifecycle ─────────── */

  ngOnInit(): void {
    this.subscriptions.add(
      this.authState.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.cdr.detectChanges();
      })
    );
    this.seo.setPage({
      title: 'تولیدی — خرید عمده از تأمین‌کنندگان معتبر ایران',
      description: 'پلتفرم B2B خرید و فروش عمده محصولات از تأمین‌کنندگان و تولیدکنندگان سراسر ایران. قیمت کارخانه، تحویل سریع و مدیریت کامل فروش.',
      url: 'https://toolidi.ir',
      type: 'website',
    });
    this.seo.setJsonLd(this.seo.organizationJsonLd());
    this.initializePage();
    this.buildMapConnections();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.seo.removeJsonLd();
    this.counterIntervals.forEach(id => clearInterval(id));
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /* ─────────── Initialization ─────────── */

  private initializePage(): void {
    this.loadCategories();
    this.loadPlatformStats();
    this.loadSellerStats();
    this.loadAgentLocations();
    this.initializeWorkflowSteps();
    this.initializeSuppliers();

    setTimeout(() => this.loadFeaturedProducts(), 200);

    setTimeout(() => {
      this.heroLoaded = true;
      // Make hero section visible immediately
      const heroEl = document.querySelector('[data-section="hero"]');
      if (heroEl) heroEl.classList.add('animate-in');
      this.cdr.detectChanges();
    }, 100);
  }

  /* ─────────── Intersection Observer ─────────── */

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId && !this.sectionVisibility[sectionId]) {
            this.sectionVisibility[sectionId] = true;
            entry.target.classList.add('animate-in');

            // Animate child feature cards
            const cards = entry.target.querySelectorAll('.feature-card');
            cards.forEach(card => card.classList.add('animate-in'));

            // Animate supplier cards
            const supplierTabs = entry.target.querySelectorAll('.supplier-trade-tab');
            supplierTabs.forEach((tab, i) => {
              setTimeout(() => tab.classList.add('animate-in'), i * 100);
            });

            this.cdr.detectChanges();
            if (sectionId === 'stats') {
              this.startCounters();
            }
          }
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    setTimeout(() => {
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach(section => this.observer!.observe(section));
    }, 200);
  }

  /* ─────────── Animated Counters ─────────── */

  startCounters(): void {
    this.animateCounter('producers', this.platformStats.activeProducers, 2000);
    this.animateCounter('agents', this.platformStats.activeAgents, 2200);
    this.animateCounter('orders', this.platformStats.completedOrders, 2400);
    this.animateCounterRating(this.platformStats.satisfactionRate, 1500);
  }

  private animateCounter(type: 'producers' | 'agents' | 'orders', target: number, duration: number): void {
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);

      switch (type) {
        case 'producers': this.animatedProducers = current; break;
        case 'agents': this.animatedAgents = current; break;
        case 'orders': this.animatedOrders = current; break;
      }
      this.cdr.detectChanges();

      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  private animateCounterRating(target: number, duration: number): void {
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.animatedRating = parseFloat((target * eased).toFixed(1));
      this.cdr.detectChanges();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ─────────── Map Connections ─────────── */

  private buildMapConnections(): void {
    this.mapConnections = IRAN_MAP_CONNECTIONS.map(([from, to]) => ({
      from: IRAN_CITIES[from],
      to: IRAN_CITIES[to]
    })).filter(c => c.from && c.to);
  }

  onProvinceHover(nameFa: string | null): void {
    this.hoveredProvince = nameFa;
  }

  /* ─────────── Data Loading ─────────── */

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoryService.getCategoryTree().pipe(
      catchError(() => { this.categoriesLoading = false; this.cdr.detectChanges(); return []; })
    ).subscribe((result: any) => {
      this.categories = result?.data || [];
      this.categoriesLoading = false;
      this.cdr.detectChanges();
    });
  }

  loadPlatformStats(): void {
    this.statsLoading = true;
    this.publicService.getPlatformStats().pipe(
      catchError(() => {
        this.platformStats = { activeProducers: 0, activeAgents: 0, completedOrders: 0, satisfactionRate: 0 };
        this.statsLoading = false;
        this.cdr.detectChanges();
        return [];
      })
    ).subscribe((result: { data?: ApiPlatformStats }) => {
      const data = result?.data;
      this.platformStats = data
        ? {
            activeProducers: data.activeSellers,
            activeAgents: data.activeAgents,
            completedOrders: data.completedOrders,
            satisfactionRate: data.satisfactionRate,
            updatedAt: data.updatedAt
          }
        : { activeProducers: 0, activeAgents: 0, completedOrders: 0, satisfactionRate: 0 };
      this.statsUpdatedAt = data?.updatedAt ?? '';
      this.statsLoading = false;
      this.cdr.detectChanges();
      if (this.sectionVisibility['stats']) {
        this.startCounters();
      }
    });
  }

  loadSellerStats(): void {
    this.publicService.getSellerStats().pipe(
      catchError(() => { return []; })
    ).subscribe((result: any) => {
      const data = result?.data;
      if (data) {
        this.sellerStats = {
          activeSellers: data.activeSellers ?? 0,
          monthlyOrders: data.monthlyOrders ?? 0,
          totalProducts: data.totalProducts ?? 0
        };
        this.cdr.detectChanges();
      }
    });
  }

  loadAgentLocations(): void {
    this.mapLoading = true;
    timer(800).pipe(take(1)).subscribe(() => {
      this.agentLocations = this.getMockAgentLocations();
      // Set city coordinates from iran-map-data
      this.agentLocations.forEach(a => {
        const cityData = IRAN_CITIES[a.city];
        if (cityData) {
          a.coordinates = { x: cityData.svgX, y: cityData.svgY };
        }
      });
      this.mapLoading = false;
      this.cdr.detectChanges();
    });
  }

  loadFeaturedProducts(): void {
    this.loading = true;
    this.productService.getProducts({ isFeatured: true, page: 1, pageSize: 8 }).pipe(
      catchError(() => { this.loading = false; this.cdr.detectChanges(); return []; })
    ).subscribe((result: any) => {
      this.featuredProducts = result?.data?.items || [];
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  /* ─────────── Mock Data ─────────── */

  private getMockAgentLocations(): AgentLocation[] {
    const metrics = [4.9, 4.8, 4.7, 4.8, 4.6, 4.5, 4.7, 4.4];
    const orders = [234, 156, 98, 112, 87, 76, 65, 54];
    return IRAN_LOCATIONS.slice(0, 8).map((location, i) => ({
      id: String(i + 1),
      name: `پیک ${location.city}`,
      city: location.city,
      province: location.province,
      rating: metrics[i],
      activeOrders: orders[i],
      coordinates: IRAN_CITIES[location.city] ? { x: IRAN_CITIES[location.city].svgX, y: IRAN_CITIES[location.city].svgY } : { x: 0, y: 0 }
    }));
  }

  private initializeWorkflowSteps(): void {
    this.workflowSteps = [
      { id: 1, title: 'ثبت‌نام و احراز هویت', description: 'تولیدکننده، خریدار یا Agent؛ با احراز هویت رقمی ثبت‌نام کنید', icon: '🔐', role: 'producer', status: 'pending' },
      { id: 2, title: 'انتخاب و سفارش', description: 'محصول را انتخاب کنید، درخواست خرید ثبت کنید یا به عنوان Agent پیشنهاد دهید', icon: '📦', role: 'buyer', status: 'pending' },
      { id: 3, title: 'تولید و بسته‌بندی', description: 'تولیدکننده سفارش را آماده می‌کند، Agent تحویل می‌گیرد', icon: '🏭', role: 'producer', status: 'pending' },
      { id: 4, title: 'تحویل و پرداخت', description: 'Agent کالا را به مقصد می‌رساند، پرداخت امن انجام می‌شود', icon: '🚚', role: 'agent', status: 'pending' },
    ];
    this.animateWorkflowSteps();
  }

  private animateWorkflowSteps(): void {
    this.workflowSteps.forEach((step, index) => {
      setTimeout(() => {
        step.status = 'active';
        this.cdr.detectChanges();
        setTimeout(() => { step.status = 'completed'; this.cdr.detectChanges(); }, 2000);
      }, index * 800 + 1500);
    });
  }

  get supplierGroups(): SupplierNetworkGroup[] {
    const groups = new Map<string, SupplierInfo[]>();
    this.suppliers.forEach((supplier) => {
      const trade = supplier.trade?.trim() || 'تولید و توزیع عمومی';
      const items = groups.get(trade) ?? [];
      items.push(supplier);
      groups.set(trade, items);
    });

    return Array.from(groups.entries())
      .map(([trade, suppliers]) => {
        const locations = new Map<string, { city: string; province: string; count: number }>();
        suppliers.forEach((supplier) => {
          const key = `${supplier.province}|${supplier.city}`;
          const current = locations.get(key);
          if (current) current.count++;
          else locations.set(key, { city: supplier.city || 'نامشخص', province: supplier.province || 'نامشخص', count: 1 });
        });
        return {
          trade,
          icon: this.getCategoryIcon(trade),
          suppliers,
          locations: Array.from(locations.values()).sort((a, b) => a.province.localeCompare(b.province, 'fa'))
        };
      })
      .sort((a, b) => b.suppliers.length - a.suppliers.length || a.trade.localeCompare(b.trade, 'fa'));
  }

  get activeSupplierGroup(): SupplierNetworkGroup | null {
    return this.supplierGroups.find((group) => group.trade === this.selectedSupplierTrade) ?? this.supplierGroups[0] ?? null;
  }

  get activeSupplierCity(): string {
    return this.activeSupplierGroup?.locations[0]?.city ?? '';
  }

  selectSupplierTrade(trade: string): void {
    this.selectedSupplierTrade = trade;
  }

  trackBySupplierTrade(index: number, group: SupplierNetworkGroup): string {
    return group.trade;
  }

  trackBySupplierLocation(index: number, location: { city: string; province: string; count: number }): string {
    return `${location.province}|${location.city}`;
  }

  private initializeSuppliers(): void {
    this.publicService.getSellers().pipe(
      catchError(() => {
        this.suppliers = this.getFallbackSuppliers();
        this.cdr.detectChanges();
        return [];
      })
    ).subscribe((result: any) => {
      const data = result?.data;
      if (data && data.length) {
        this.suppliers = data.map((s: PublicSeller) => ({
          id: s.id,
          trade: s.trade || 'تولید و توزیع',
          city: s.city,
          province: s.province,
        }));
      } else {
        this.suppliers = this.getFallbackSuppliers();
      }
      this.selectedSupplierTrade = this.supplierGroups[0]?.trade ?? '';
      this.cdr.detectChanges();
    });
  }

  private getFallbackSuppliers(): SupplierInfo[] {
    return [
      { id: '1', trade: 'طلا و زیورآلات', city: IRAN_LOCATIONS[7].city, province: IRAN_LOCATIONS[7].province },
      { id: '2', trade: 'نقره و زیورآلات دست‌ساز', city: IRAN_LOCATIONS[3].city, province: IRAN_LOCATIONS[3].province },
      { id: '3', trade: 'سنگ‌های قیمتی', city: IRAN_LOCATIONS[10].city, province: IRAN_LOCATIONS[10].province },
      { id: '4', trade: 'ابزار و تجهیزات معدن', city: IRAN_LOCATIONS[20].city, province: IRAN_LOCATIONS[20].province },
    ];
  }

  /* ─────────── Map Interactions ─────────── */

  selectAgent(agent: AgentLocation): void {
    this.selectedAgent = this.selectedAgent?.id === agent.id ? null : agent;
  }

  getAgentColor(orders: number): string {
    if (orders > 200) return '#059669'; // green
    if (orders > 100) return '#6C3FC5'; // primary
    if (orders > 50) return '#D97706';  // warning
    return '#2563EB';                    // info
  }

  getAgentDotRadius(orders: number): number {
    return Math.max(3, Math.min(7, 3 + orders / 50));
  }

  getAgentPulseClass(orders: number): string {
    if (orders > 200) return 'pulse-fast';
    if (orders > 100) return 'pulse-medium';
    return 'pulse-slow';
  }

  /* ─────────── Utility ─────────── */

  getCategoryIcon(name: string): string {
    return this.categoryIcons[name] || '✦';
  }

  /** Gradient background for each category card */
  private readonly categoryGradients = [
    'linear-gradient(135deg, #7c3aed, #a78bfa)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #ec4899, #f472b6)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #3b82f6, #60a5fa)',
    'linear-gradient(135deg, #06b6d4, #22d3ee)',
    'linear-gradient(135deg, #f97316, #fb923c)',
    'linear-gradient(135deg, #6366f1, #818cf8)',
    'linear-gradient(135deg, #8b5cf6, #c084fc)',
    'linear-gradient(135deg, #14b8a6, #5eead4)',
    'linear-gradient(135deg, #e11d48, #fb7185)',
    'linear-gradient(135deg, #7c3aed, #c084fc)',
    'linear-gradient(135deg, #2563eb, #93c5fd)',
    'linear-gradient(135deg, #0891b2, #67e8f9)',
    'linear-gradient(135deg, #d946ef, #f0abfc)',
    'linear-gradient(135deg, #84cc16, #bef264)',
  ];

  getCategoryGradient(index: number): string {
    return this.categoryGradients[index % this.categoryGradients.length];
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fa-IR').format(num);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR', maximumFractionDigits: 0 }).format(amount);
  }

  formatStatsUpdatedAt(): string {
    if (!this.statsUpdatedAt) return 'در انتظار داده زنده';
    return new Date(this.statsUpdatedAt).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByCategoryId(index: number, cat: CategoryTreeNode): string { return cat.id; }
  trackByProductId(index: number, product: Product): string { return product.id; }
  trackByAgentId(index: number, agent: AgentLocation): string { return agent.id; }
  trackBySupplierId(index: number, supplier: SupplierInfo): string { return supplier.id; }
  trackByStepId(index: number, step: WorkflowStep): number { return step.id; }
  trackByProvinceFa(index: number, province: { nameFa: string }): string { return province.nameFa; }
}
