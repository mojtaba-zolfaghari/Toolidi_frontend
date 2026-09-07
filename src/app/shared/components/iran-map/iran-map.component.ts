import { Component, OnInit, OnDestroy } from '@angular/core';
import { PublicService } from '../../../core/services/api/public.service';

interface ProvinceData {
  name: string;
  sellerCount: number;
  trades: string[];
  rank: number;
}

@Component({
  selector: 'app-iran-map',
  template: `
    <div class="province-network">
      <!-- Header -->
      <div class="pn-header">
        <div class="pn-header-text">
          <div class="pn-kicker">
            <span class="pn-live-dot"></span>
            شبکه تأمین فعال
          </div>
          <h2 class="pn-title">تولیدکنندگان در سراسر ایران</h2>
          <p class="pn-subtitle">
            از <strong>{{ totalSellers | persianNumber }}</strong>
            تأمین‌کننده فعال در
            <strong>{{ provinces.length }}</strong>
            استان کشور
          </p>
        </div>
        <div class="pn-summary-cards">
          <div class="pn-summary-card">
            <span class="pn-summary-icon">🏭</span>
            <div>
              <span class="pn-summary-value">{{ provinces.length | persianNumber }}</span>
              <span class="pn-summary-label">استان فعال</span>
            </div>
          </div>
          <div class="pn-summary-card">
            <span class="pn-summary-icon">📦</span>
            <div>
              <span class="pn-summary-value">{{ totalSellers | persianNumber }}</span>
              <span class="pn-summary-label">تأمین‌کننده</span>
            </div>
          </div>
          <div class="pn-summary-card">
            <span class="pn-summary-icon">🏷️</span>
            <div>
              <span class="pn-summary-value">{{ totalTrades | persianNumber }}</span>
              <span class="pn-summary-label">حوزه تولیدی</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Province Grid -->
      <div class="pn-grid">
        <div *ngFor="let p of provinces; let i = index; trackBy: trackByName"
             class="pn-card"
             [class.pn-card-top3]="p.rank <= 3"
             [style.animation-delay]="(i * 40) + 'ms'">
          <!-- Rank badge -->
          <div class="pn-card-rank" [class]="'rank-' + p.rank" *ngIf="p.rank <= 3">
            {{ p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : '🥉' }}
          </div>
          <div class="pn-card-rank rank-n" *ngIf="p.rank > 3">
            {{ p.rank }}
          </div>

          <!-- Province name -->
          <h3 class="pn-card-name">{{ p.name }}</h3>

          <!-- Seller count bar -->
          <div class="pn-card-bar-wrap">
            <div class="pn-card-bar" [style.width.%]="getBarWidth(p)"></div>
          </div>

          <!-- Stats -->
          <div class="pn-card-stats">
            <span class="pn-card-count">
              <strong>{{ p.sellerCount | persianNumber }}</strong>
              تولیدکننده
            </span>
          </div>

          <!-- Trades chips -->
          <div class="pn-card-trades">
            <span *ngFor="let trade of p.trades.slice(0, 3)" class="pn-trade-chip">
              {{ trade }}
            </span>
            <span *ngIf="p.trades.length > 3" class="pn-trade-more">
              +{{ p.trades.length - 3 }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && !provinces.length" class="pn-empty">
        <span class="pn-empty-icon">📍</span>
        <p>در حال بارگذاری اطلاعات شبکه تأمین…</p>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="pn-grid">
        <div *ngFor="let s of [1,2,3,4,5,6,7,8]" class="pn-card pn-skeleton">
          <div class="sk-rank"></div>
          <div class="sk-name"></div>
          <div class="sk-bar"></div>
          <div class="sk-text"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .province-network {
      width: 100%;
    }

    /* ── Header ── */
    .pn-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .pn-header-text { max-width: 500px; }
    .pn-kicker {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-weight: 700;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .pn-live-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: livePulse 2s ease-in-out infinite;
      box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.4); }
    }
    .pn-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.02em;
      line-height: 1.3;
      margin: 0;
    }
    .pn-subtitle {
      margin-top: 0.5rem;
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.7;
    }

    /* ── Summary Cards ── */
    .pn-summary-cards {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .pn-summary-card {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 0.75rem 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .pn-summary-icon { font-size: 1.5rem; }
    .pn-summary-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e293b;
      line-height: 1.2;
    }
    .pn-summary-label {
      display: block;
      font-size: 0.7rem;
      color: #94a3b8;
      font-weight: 500;
    }

    /* ── Grid ── */
    .pn-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    /* ── Card ── */
    .pn-card {
      position: relative;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.125rem;
      transition: all 0.25s ease;
      animation: cardIn 0.4s ease-out backwards;
      cursor: default;
    }
    .pn-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.1);
      border-color: #c7d2fe;
    }
    .pn-card-top3 {
      border-color: #c7d2fe;
      background: linear-gradient(135deg, #fafbff 0%, white 100%);
    }
    .pn-card-top3:hover {
      box-shadow: 0 8px 30px rgba(99, 102, 241, 0.15);
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Rank ── */
    .pn-card-rank {
      position: absolute;
      top: 0.625rem;
      left: 0.625rem;
      font-size: 0.7rem;
      font-weight: 700;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .rank-n {
      background: #f1f5f9;
      color: #64748b;
      border-radius: 0.5rem;
      font-size: 0.65rem;
    }

    /* ── Name ── */
    .pn-card-name {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.625rem 0;
      line-height: 1.3;
    }

    /* ── Bar ── */
    .pn-card-bar-wrap {
      height: 4px;
      background: #f1f5f9;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    .pn-card-bar {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #818cf8);
      border-radius: 2px;
      transition: width 0.6s ease-out;
    }
    .pn-card-top3 .pn-card-bar {
      background: linear-gradient(90deg, #6366f1, #a78bfa);
    }

    /* ── Stats ── */
    .pn-card-stats {
      margin-bottom: 0.5rem;
    }
    .pn-card-count {
      font-size: 0.75rem;
      color: #64748b;
    }
    .pn-card-count strong {
      font-size: 1rem;
      font-weight: 800;
      color: #6366f1;
      margin-left: 0.25rem;
    }

    /* ── Trades ── */
    .pn-card-trades {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .pn-trade-chip {
      display: inline-block;
      font-size: 0.6rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 100px;
      background: #f1f5f9;
      color: #475569;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .pn-card:hover .pn-trade-chip {
      background: #eef2ff;
      color: #4f46e5;
    }
    .pn-trade-more {
      font-size: 0.6rem;
      color: #94a3b8;
      font-weight: 600;
      padding: 0.15rem 0.35rem;
    }

    /* ── Empty ── */
    .pn-empty {
      text-align: center;
      padding: 3rem 1rem;
      color: #94a3b8;
    }
    .pn-empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }

    /* ── Skeleton ── */
    .pn-skeleton {
      pointer-events: none;
    }
    .sk-rank, .sk-name, .sk-bar, .sk-text {
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 0.375rem;
    }
    .sk-rank { width: 1.5rem; height: 1.5rem; border-radius: 0.5rem; margin-bottom: 0.5rem; }
    .sk-name { width: 60%; height: 0.9rem; margin-bottom: 0.625rem; }
    .sk-bar { width: 100%; height: 4px; margin-bottom: 0.5rem; border-radius: 2px; }
    .sk-text { width: 40%; height: 0.7rem; }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .pn-header { flex-direction: column; gap: 1rem; }
      .pn-title { font-size: 1.35rem; }
      .pn-summary-cards { width: 100%; }
      .pn-summary-card { flex: 1; min-width: 0; padding: 0.5rem 0.75rem; }
      .pn-summary-value { font-size: 1rem; }
      .pn-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
      .pn-card { padding: 0.875rem; }
      .pn-card-name { font-size: 0.8rem; }
    }
    @media (max-width: 400px) {
      .pn-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class IranMapComponent implements OnInit, OnDestroy {
  provinces: ProvinceData[] = [];
  totalSellers = 0;
  totalTrades = 0;
  loading = true;
  private refreshSub?: any;
  private maxSellerCount = 1;

  constructor(private publicService: PublicService) {}

  ngOnInit(): void {
    this.loadData();
    this.refreshSub = setInterval(() => this.loadData(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshSub) clearInterval(this.refreshSub);
  }

  private loadData(): void {
    this.publicService.getSupplyNetwork().subscribe({
      next: (res: any) => {
        const data = res?.data ?? {};
        const provinceList = data.provinces ?? [];
        this.totalSellers = data.totalSellers ?? 0;

        const allTrades = new Set<string>();
        const sorted = provinceList
          .map((p: any) => {
            (p.trades ?? []).forEach((t: string) => allTrades.add(t));
            return {
              name: p.name,
              sellerCount: p.activeSellers ?? 0,
              trades: p.trades ?? [],
              rank: p.rank ?? 0,
            };
          })
          .sort((a: ProvinceData, b: ProvinceData) => b.sellerCount - a.sellerCount);

        // Assign ranks if not set
        sorted.forEach((p: ProvinceData, i: number) => {
          if (!p.rank) p.rank = i + 1;
        });

        this.totalTrades = allTrades.size;
        this.maxSellerCount = Math.max(1, ...sorted.map((p: ProvinceData) => p.sellerCount));
        this.provinces = sorted.filter((p: ProvinceData) => p.sellerCount > 0);
        this.loading = false;
      },
      error: () => {
        // Fallback to sellers API
        this.publicService.getSellers().subscribe({
          next: (res: any) => {
            const sellers = res?.data ?? [];
            const provinceMap = new Map<string, { sellerCount: number; trades: Set<string> }>();

            for (const s of sellers) {
              const province = s.province || 'نامشخص';
              if (!provinceMap.has(province)) {
                provinceMap.set(province, { sellerCount: 0, trades: new Set() });
              }
              const entry = provinceMap.get(province)!;
              entry.sellerCount++;
              if (s.trade) entry.trades.add(s.trade);
            }

            this.totalSellers = sellers.length;
            const allTrades = new Set<string>();

            const sorted = Array.from(provinceMap.entries())
              .map(([name, data]) => {
                data.trades.forEach(t => allTrades.add(t));
                return {
                  name,
                  sellerCount: data.sellerCount,
                  trades: Array.from(data.trades).slice(0, 5),
                  rank: 0,
                };
              })
              .sort((a, b) => b.sellerCount - a.sellerCount);

            sorted.forEach((p: ProvinceData, i: number) => p.rank = i + 1);
            this.totalTrades = allTrades.size;
            this.maxSellerCount = Math.max(1, ...sorted.map((p: ProvinceData) => p.sellerCount));
            this.provinces = sorted.filter((p: ProvinceData) => p.sellerCount > 0);
            this.loading = false;
          },
          error: () => {
            this.provinces = [];
            this.loading = false;
          }
        });
      }
    });
  }

  getBarWidth(p: ProvinceData): number {
    return Math.max(8, (p.sellerCount / this.maxSellerCount) * 100);
  }

  trackByName(_index: number, p: ProvinceData): string {
    return p.name;
  }
}
