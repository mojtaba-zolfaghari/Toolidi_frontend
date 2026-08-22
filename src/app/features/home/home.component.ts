import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Subscription, forkJoin, timer } from 'rxjs';
import { take, finalize, catchError } from 'rxjs/operators';

import { fadeIn, slideUp, staggerList, zoomIn, fadeSlideUp, slideFromRight, slideFromLeft } from '../../shared/animations';
import { CategoryService, CategoryTreeNode } from '../../core/services/api/category.service';
import { ProductService, Product } from '../../core/services/api/product.service';
import { SellerService, DashboardSummary, SellerStatistics } from '../../core/services/api/seller.service';
import { AuthStateService, AuthUser } from '../../core/services/auth-state.service';

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

export interface SupplierInfo {
  id: string;
  companyName: string;
  city: string;
  province: string;
  productCategories: string[];
  capacity: number;
  preparationTime: string;
  rating: number;
  isVerified: boolean;
}

/* ─────────────────── Iran City Coordinates (SVG %) ─────────────────── */

const IRAN_CITY_COORDINATES: Record<string, { x: number; y: number }> = {
  'تهران': { x: 52.5, y: 22.5 },
  'مشهد': { x: 76.5, y: 18.5 },
  'شیراز': { x: 42.5, y: 52.5 },
  'اصفهان': { x: 40.5, y: 36.5 },
  'تبریز': { x: 22.5, y: 15.5 },
  'کرج': { x: 48.5, y: 23.5 },
  'قم': { x: 48.5, y: 31.5 },
  'اهواز': { x: 32.5, y: 62.5 },
  'کرمانشاه': { x: 30.5, y: 28.5 },
  'ارومیه': { x: 18.5, y: 18.5 },
  'رشت': { x: 42.5, y: 14.5 },
  'زاهدان': { x: 73.5, y: 54.5 },
  'همدان': { x: 37.5, y: 29.5 },
  'کرمان': { x: 59.5, y: 48.5 },
  'یزد': { x: 47.5, y: 44.5 },
};

/* ─────────────────── SVG Iran Map Outline ─────────────────── */

const IRAN_SVG_PATH = `M 45 8 C 42 7, 38 9, 35 10 C 30 12, 25 11, 22 13
  C 18 15, 15 14, 13 17 C 11 19, 12 22, 14 25
  C 16 27, 15 30, 13 33 C 11 36, 10 39, 13 42
  C 15 44, 14 47, 12 50 C 10 53, 12 56, 14 58
  C 16 60, 15 63, 17 65 C 19 67, 22 66, 25 68
  C 28 70, 30 72, 33 70 C 36 68, 38 70, 40 68
  C 42 66, 44 68, 46 66 C 48 64, 50 66, 52 64
  C 54 62, 56 64, 58 62 C 60 60, 62 58, 65 56
  C 68 54, 70 52, 72 50 C 74 48, 76 45, 78 42
  C 80 39, 82 36, 80 33 C 78 30, 80 27, 78 24
  C 76 21, 74 20, 72 18 C 70 16, 68 15, 65 14
  C 62 13, 58 12, 55 11 C 52 10, 48 9, 45 8 Z`;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [fadeIn, slideUp, staggerList, zoomIn, fadeSlideUp, slideFromRight, slideFromLeft]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  /* ── Data State ── */
  categories: CategoryTreeNode[] = [];
  featuredProducts: Product[] = [];
  platformStats: PlatformStats = { activeProducers: 0, activeAgents: 0, completedOrders: 0, satisfactionRate: 0 };
  agentLocations: AgentLocation[] = [];
  workflowSteps: WorkflowStep[] = [];
  suppliers: SupplierInfo[] = [];

  /* ── Animated Counters ── */
  animatedProducers = 0;
  animatedAgents = 0;
  animatedOrders = 0;
  animatedRating = 0;
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
  readonly iranPath = IRAN_SVG_PATH;
  mapConnections: { from: { x: number; y: number }; to: { x: number; y: number } }[] = [];

  /* ── Category Icons ── */
  private categoryIcons: Record<string, string> = {
    'لباس و پوشاک': '👕', 'زیورآلات و بدلیجات': '💎', 'لوازم آرایشی و بهداشتی': '💄',
    'صنایع پلاستیکی': '♻️', 'حلقه‌های نامزدی و ازدواج': '💍', 'گردنبند و زنجیر': '📿',
    'دستبند و النگو': '⌚', 'گوشواره': '✨', 'انگشتر نقره‌نگین': '💎',
    'طلای زرد': '🥇', 'طلای سفید': '🥈', 'نقره‌آلات': '⚪',
    'سنگ‌های قیمتی و نیمه‌قیمتی': '💠', 'ابزار و تجهیزات معدن': '⛏️',
    'زیورآلات دست‌ساز': '🎨', 'جواهرات عتیقه و کلکسیونی': '🏺'
  };

  private categoryColors = [
    'from-purple-500 to-purple-700',
    'from-amber-500 to-amber-700',
    'from-rose-500 to-rose-700',
    'from-emerald-500 to-emerald-700',
    'from-blue-500 to-blue-700',
    'from-cyan-500 to-cyan-700',
    'from-orange-500 to-orange-700',
    'from-indigo-500 to-indigo-700',
  ];

  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly sellerService: SellerService,
    private readonly authState: AuthStateService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  /* ─────────── Lifecycle ─────────── */

  ngOnInit(): void {
    this.subscriptions.add(
      this.authState.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.cdr.detectChanges();
      })
    );
    this.initializePage();
    this.buildMapConnections();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.counterIntervals.forEach(id => clearInterval(id));
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /* ─────────── Initialization ─────────── */

  private initializePage(): void {
    this.loadCategories();
    this.loadPlatformStats();
    this.loadAgentLocations();
    this.initializeWorkflowSteps();
    this.initializeSuppliers();

    setTimeout(() => this.loadFeaturedProducts(), 200);

    setTimeout(() => { this.heroLoaded = true; this.cdr.detectChanges(); }, 100);
  }

  /* ─────────── Intersection Observer ─────────── */

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId && !this.sectionVisibility[sectionId]) {
            this.sectionVisibility[sectionId] = true;
            this.cdr.detectChanges();
            // Start counters when stats section becomes visible
            if (sectionId === 'stats') {
              this.startCounters();
            }
          }
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    // Observe all sections after a brief delay
    setTimeout(() => {
      const sections = document.querySelectorAll('[data-section]');
      sections.forEach(section => this.observer!.observe(section));
    }, 200);
  }

  /* ─────────── Animated Counters ─────────── */

  startCounters(): void {
    this.animateCounter('producers', 500, 2000);
    this.animateCounter('agents', 1200, 2200);
    this.animateCounter('orders', 5000, 2400);
    this.animateCounterRating(4.8, 1500);
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
    const connections = [
      ['تهران', 'کرج'], ['تهران', 'قم'], ['تهران', 'اصفهان'],
      ['تهران', 'مشهد'], ['اصفهان', 'شیراز'], ['تبریز', 'ارومیه'],
      ['اهواز', 'شیراز'], ['تهران', 'همدان'], ['تبریز', 'تهران'],
      ['مشهد', 'زاهدان'], ['کرمان', 'اهواز'], ['یزد', 'کرمان'],
      ['یزد', 'اصفهان'], ['قم', 'همدان']
    ];
    this.mapConnections = connections.map(([from, to]) => ({
      from: IRAN_CITY_COORDINATES[from],
      to: IRAN_CITY_COORDINATES[to]
    })).filter(c => c.from && c.to);
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
    this.sellerService.getDashboard().pipe(
      catchError(() => {
        this.platformStats = { activeProducers: 500, activeAgents: 1200, completedOrders: 15000, satisfactionRate: 4.8 };
        this.statsLoading = false;
        this.cdr.detectChanges();
        return [];
      })
    ).subscribe((result: any) => {
      if (result?.data) {
        this.platformStats = {
          activeProducers: result.data.activeProducts || 500,
          activeAgents: result.data.openOrders || 1200,
          completedOrders: result.data.totalOrders || 15000,
          satisfactionRate: result.data.averageRating || 4.8
        };
      }
      this.statsLoading = false;
      this.cdr.detectChanges();
    });
  }

  loadAgentLocations(): void {
    this.mapLoading = true;
    timer(800).pipe(take(1)).subscribe(() => {
      this.agentLocations = this.getMockAgentLocations();
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
    return [
      { id: '1', name: 'عامل تهران', city: 'تهران', province: 'تهران', rating: 4.9, activeOrders: 234, coordinates: IRAN_CITY_COORDINATES['تهران'] },
      { id: '2', name: 'عامل مشهد', city: 'مشهد', province: 'خراسان رضوی', rating: 4.8, activeOrders: 156, coordinates: IRAN_CITY_COORDINATES['مشهد'] },
      { id: '3', name: 'عامل شیراز', city: 'شیراز', province: 'فارس', rating: 4.7, activeOrders: 98, coordinates: IRAN_CITY_COORDINATES['شیراز'] },
      { id: '4', name: 'عامل اصفهان', city: 'اصفهان', province: 'اصفهان', rating: 4.8, activeOrders: 112, coordinates: IRAN_CITY_COORDINATES['اصفهان'] },
      { id: '5', name: 'عامل تبریز', city: 'تبریز', province: 'آذربایجان شرقی', rating: 4.6, activeOrders: 87, coordinates: IRAN_CITY_COORDINATES['تبریز'] },
      { id: '6', name: 'عامل کرج', city: 'کرج', province: 'البرز', rating: 4.5, activeOrders: 76, coordinates: IRAN_CITY_COORDINATES['کرج'] },
      { id: '7', name: 'عامل قم', city: 'قم', province: 'قم', rating: 4.7, activeOrders: 65, coordinates: IRAN_CITY_COORDINATES['قم'] },
      { id: '8', name: 'عامل اهواز', city: 'اهواز', province: 'خوزستان', rating: 4.4, activeOrders: 54, coordinates: IRAN_CITY_COORDINATES['اهواز'] },
    ];
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

  private initializeSuppliers(): void {
    this.suppliers = [
      { id: '1', companyName: 'تولیدی طلای زرین', city: 'تهران', province: 'تهران', productCategories: ['طلای زرد', 'طلای سفید'], capacity: 200, preparationTime: '۲ روز', rating: 4.9, isVerified: true },
      { id: '2', companyName: 'کارگاه نقره سیمین', city: 'اصفهان', province: 'اصفهان', productCategories: ['نقره‌آلات', 'انگشتر نقره'], capacity: 150, preparationTime: '۳ روز', rating: 4.7, isVerified: true },
      { id: '3', companyName: 'سنگ‌نگار خراسان', city: 'مشهد', province: 'خراسان رضوی', productCategories: ['سنگ‌های قیمتی', 'فیروزه'], capacity: 80, preparationTime: '۱ روز', rating: 4.8, isVerified: true },
      { id: '4', companyName: 'معدن‌یار کرمان', city: 'کرمان', province: 'کرمان', productCategories: ['ابزار معدن', 'تجهیزات'], capacity: 300, preparationTime: '۴ روز', rating: 4.5, isVerified: true },
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

  getCategoryColor(index: number): string {
    return this.categoryColors[index % this.categoryColors.length];
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('fa-IR').format(num);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'IRR', maximumFractionDigits: 0 }).format(amount);
  }

  trackByCategoryId(index: number, cat: CategoryTreeNode): string { return cat.id; }
  trackByProductId(index: number, product: Product): string { return product.id; }
  trackByAgentId(index: number, agent: AgentLocation): string { return agent.id; }
  trackBySupplierId(index: number, supplier: SupplierInfo): string { return supplier.id; }
  trackByStepId(index: number, step: WorkflowStep): number { return step.id; }
}
