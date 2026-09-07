import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { PublicService } from '../../core/services/api/public.service';
import { IRAN_MAP_CITIES } from '../iran-locations';

interface GlobeOrder {
  id: string;
  from: string;
  to: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  status: string;
  createdAt: string;
  product?: string;
}

@Component({
    selector: 'app-globe',
    template: `
    <div class="globe-container">
      <div class="globe-header">
        <div class="globe-title">
          <span class="pulse-dot"></span>
          <span class="title-text">سفارشات فعال روی نقشه</span>
        </div>
        @if (stats) {
          <div class="globe-stats">
            <span class="stat-item">{{ stats.activeOrders }} سفارش فعال</span>
            <span class="stat-sep">|</span>
            <span class="stat-item">{{ stats.totalOrders }} مسیر کل</span>
          </div>
        }
      </div>
      <div class="globe-body">
        <div class="globe-canvas-wrap">
          <canvas #globeCanvas class="globe-canvas"></canvas>
        </div>
        <div class="order-log">
          <div class="log-header">
            <span class="log-icon">📡</span>
            <span>لاگ زنده سفارشات</span>
          </div>
          <div class="log-list" #logList>
            @for (order of visibleOrders; track order; let i = $index) {
              <div
                class="log-item"
                [class.log-new]="i === 0"
                [style.animation-delay]="(i * 50) + 'ms'">
                <div class="log-status" [ngClass]="'status-' + order.status.toLowerCase()">
                  {{ getStatusIcon(order.status) }}
                </div>
                <div class="log-details">
                  <span class="log-route">{{ order.from }} → {{ order.to }}</span>
                  @if (order.product) {
                    <span class="log-product">{{ order.product }}</span>
                  }
                </div>
                <span class="log-time">{{ getTimeAgo(order.createdAt) }}</span>
              </div>
            }
            @if (loading || !visibleOrders.length) {
              <div class="log-empty">
                <span>{{ loading ? 'در حال دریافت سفارش‌های فعال…' : 'سفارش فعالی برای نمایش وجود ندارد.' }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
    `,
    styles: [`
    .globe-container {
      width: 100%;
      border-radius: 1.5rem;
      overflow: hidden;
      background: linear-gradient(180deg, #0a0e1a 0%, #111827 50%, #0a0e1a 100%);
      border: 1px solid rgba(99, 102, 241, 0.2);
      box-shadow: 0 0 60px rgba(99, 102, 241, 0.08), inset 0 0 60px rgba(0, 0, 0, 0.3);
    }

    .globe-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .globe-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1rem;
      color: #e2e8f0;
    }

    .pulse-dot {
      width: 10px;
      height: 10px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    .globe-stats {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .stat-sep { color: #334155; }

    .globe-body {
      display: flex;
      min-height: 450px;
    }

    .globe-canvas-wrap {
      flex: 1;
      position: relative;
      min-height: 450px;
    }

    .globe-canvas {
      width: 100%;
      height: 100%;
      display: block;
    }

    .order-log {
      width: 320px;
      border-left: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      max-height: 450px;
    }

    .log-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      font-weight: 600;
      font-size: 0.85rem;
      color: #94a3b8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .log-icon { font-size: 1rem; }

    .log-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .log-list::-webkit-scrollbar { width: 4px; }
    .log-list::-webkit-scrollbar-track { background: transparent; }
    .log-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

    .log-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: 0.5rem;
      transition: background 0.2s;
      animation: logSlideIn 0.4s ease-out backwards;
    }

    .log-item:hover { background: rgba(255, 255, 255, 0.03); }

    .log-item.log-new {
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.15);
    }

    @keyframes logSlideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .log-status {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .status-pending { background: rgba(234, 179, 8, 0.15); }
    .status-processing { background: rgba(59, 130, 246, 0.15); }
    .status-shipped { background: rgba(168, 85, 247, 0.15); }
    .status-intransit { background: rgba(34, 197, 94, 0.15); }

    .log-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .log-route {
      font-size: 0.8rem;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .log-product {
      font-size: 0.7rem;
      color: #64748b;
    }

    .log-time {
      font-size: 0.65rem;
      color: #475569;
      white-space: nowrap;
    }

    .log-empty {
      padding: 2rem;
      text-align: center;
      color: #475569;
      font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .globe-body { flex-direction: column; }
      .globe-canvas-wrap { min-height: 320px; }
      .order-log {
        width: 100%;
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        max-height: 250px;
      }
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GlobeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('globeCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('logList') logListRef!: ElementRef<HTMLDivElement>;

  orders: GlobeOrder[] = [];
  visibleOrders: GlobeOrder[] = [];
  stats: any = null;
  loading = true;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private animFrame = 0;
  private rotAngle = 0;
  private subscription?: Subscription;
  private resizeObs?: ResizeObserver;

  // Fixed Iran-centered orthographic view.
  private readonly centerLat = 32.5;
  private readonly centerLng = 53.0;
  private readonly iranZoom = 2.2;

  constructor(private publicService: PublicService) {}

  ngOnInit(): void {
    this.loadOrders();
    // Refresh orders every 15s
    this.subscription = interval(15000).subscribe(() => this.loadOrders());
  }

  ngAfterViewInit(): void {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(this.canvas.parentElement!);
    this.animate();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.resizeObs?.disconnect();
    cancelAnimationFrame(this.animFrame);
  }

  private resize(): void {
    const parent = this.canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = parent.clientWidth * dpr;
    this.canvas.height = parent.clientHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.canvas.style.width = parent.clientWidth + 'px';
    this.canvas.style.height = parent.clientHeight + 'px';
  }

  private loadOrders(): void {
    this.loading = true;
    this.publicService.getGlobeOrders().subscribe({
      next: (res: any) => {
        this.orders = res?.data?.orders ?? [];
        this.stats = {
          totalOrders: res?.data?.totalOrders ?? 0,
          activeOrders: res?.data?.activeOrders ?? 0
        };
        const sorted = [...this.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.visibleOrders = sorted.slice(0, 20);
        this.loading = false;
        setTimeout(() => this.scrollToTop(), 100);
      },
      error: () => {
        this.orders = [];
        this.visibleOrders = [];
        this.stats = { totalOrders: 0, activeOrders: 0 };
        this.loading = false;
      }
    });
  }

  private scrollToTop(): void {
    if (this.logListRef?.nativeElement) {
      this.logListRef.nativeElement.scrollTop = 0;
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'processing': return '⚙️';
      case 'shipped': return '📦';
      case 'intransit': return '🚚';
      default: return '📋';
    }
  }

  getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الان';
    if (mins < 60) return `${mins} دقیقه پیش`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ساعت پیش`;
    return `${Math.floor(hrs / 24)} روز پیش`;
  }

  // ─── 3D Globe Rendering ───
  private animate(): void {
    // Keep Iran fixed; only the shipment marker animation changes per frame.
    this.draw();
    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  private draw(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const ctx = this.ctx;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) * 0.82;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Globe glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.4);
    glow.addColorStop(0, 'rgba(99, 102, 241, 0.04)');
    glow.addColorStop(0.7, 'rgba(99, 102, 241, 0.02)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Globe circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Grid lines (latitude)
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.07)';
    ctx.lineWidth = 0.5;
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = cy - r * Math.sin(lat * Math.PI / 180);
      const rx = r * Math.cos(lat * Math.PI / 180);
      ctx.beginPath();
      ctx.ellipse(cx, y, rx, rx * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Grid lines (longitude)
    for (let lng = 0; lng < 180; lng += 30) {
      ctx.beginPath();
      for (let lat = -90; lat <= 90; lat += 2) {
        const p = this.latLngTo2D(lat, lng, cx, cy, r);
        const p2 = this.latLngTo2D(lat, lng + 0.5, cx, cy, r);
        if (lat === -90) ctx.moveTo(p2.x, p2.y);
        else ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    // Draw Iran outline (simplified)
    this.drawIranOutline(ctx, cx, cy, r);

    // Draw city dots
    this.drawCities(ctx, cx, cy, r);

    // Draw order arcs
    this.drawArcs(ctx, cx, cy, r);
  }

  private latLngTo2D(lat: number, lng: number, cx: number, cy: number, r: number): { x: number; y: number; visible: boolean } {
    const latR = lat * Math.PI / 180;
    const centerLatR = this.centerLat * Math.PI / 180;
    const lngR = (lng - this.centerLng) * Math.PI / 180;

    // Orthographic projection centered on Iran, with a fixed zoom.
    const x = Math.cos(latR) * Math.sin(lngR);
    const y = Math.cos(centerLatR) * Math.sin(latR)
      - Math.sin(centerLatR) * Math.cos(latR) * Math.cos(lngR);
    const z = Math.sin(centerLatR) * Math.sin(latR)
      + Math.cos(centerLatR) * Math.cos(latR) * Math.cos(lngR);
    const scale = r * this.iranZoom;

    return {
      x: cx + x * scale,
      y: cy - y * scale,
      visible: z > 0
    };
  }

  private drawIranOutline(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    // Simplified Iran border coordinates
    const iranBorder: [number, number][] = [
      [39.5, 44.5], [38.0, 44.0], [37.5, 45.5], [38.0, 46.5], [37.5, 48.0],
      [37.0, 49.0], [36.5, 49.5], [35.5, 50.0], [35.0, 51.0], [34.5, 51.5],
      [34.0, 52.0], [33.5, 52.5], [32.5, 53.5], [31.5, 54.0], [30.5, 55.5],
      [29.5, 57.5], [28.5, 58.5], [27.5, 59.0], [26.5, 59.5], [25.5, 59.0],
      [25.0, 57.5], [25.5, 56.5], [26.5, 55.5], [27.0, 54.5], [27.5, 53.5],
      [28.0, 52.5], [28.5, 51.5], [29.0, 50.5], [29.5, 49.5], [30.5, 48.5],
      [31.5, 48.0], [32.5, 47.5], [33.5, 46.5], [34.5, 46.0], [35.5, 45.5],
      [36.0, 44.5], [37.0, 44.0], [38.0, 44.0], [39.5, 44.5]
    ];

    ctx.beginPath();
    let firstVisible = true;
    for (let i = 0; i < iranBorder.length; i++) {
      const p = this.latLngTo2D(iranBorder[i][0], iranBorder[i][1], cx, cy, r);
      if (!p.visible) continue;
      if (firstVisible) {
        ctx.moveTo(p.x, p.y);
        firstVisible = false;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private drawCities(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    const cities = IRAN_MAP_CITIES;

    for (const city of cities) {
      const p = this.latLngTo2D(city.lat, city.lng, cx, cy, r);
      if (!p.visible) continue;

      // City dot glow
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 8);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0.8)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // City dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();

      // City label
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(city.name, p.x, p.y - 8);
    }
  }

  private drawArcs(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    for (const order of this.orders) {
      const fromP = this.latLngTo2D(order.fromLat, order.fromLng, cx, cy, r);
      const toP = this.latLngTo2D(order.toLat, order.toLng, cx, cy, r);
      if (!fromP.visible || !toP.visible) continue;

      // Arc color based on status
      let color: string;
      let glowColor: string;
      switch (order.status?.toLowerCase()) {
        case 'pending': color = 'rgba(234, 179, 8, 0.5)'; glowColor = 'rgba(234, 179, 8, 0.1)'; break;
        case 'processing': color = 'rgba(59, 130, 246, 0.5)'; glowColor = 'rgba(59, 130, 246, 0.1)'; break;
        case 'shipped': color = 'rgba(168, 85, 247, 0.5)'; glowColor = 'rgba(168, 85, 247, 0.1)'; break;
        case 'intransit': color = 'rgba(34, 197, 94, 0.5)'; glowColor = 'rgba(34, 197, 94, 0.1)'; break;
        default: color = 'rgba(99, 102, 241, 0.4)'; glowColor = 'rgba(99, 102, 241, 0.1)';
      }

      // Draw arc (quadratic bezier with control point above midpoint)
      const midX = (fromP.x + toP.x) / 2;
      const midY = (fromP.y + toP.y) / 2;
      const dx = toP.x - fromP.x;
      const dy = toP.y - fromP.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const arcHeight = dist * 0.3;
      const cpX = midX;
      const cpY = midY - arcHeight;

      // Glow
      ctx.beginPath();
      ctx.moveTo(fromP.x, fromP.y);
      ctx.quadraticCurveTo(cpX, cpY, toP.x, toP.y);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Arc line
      ctx.beginPath();
      ctx.moveTo(fromP.x, fromP.y);
      ctx.quadraticCurveTo(cpX, cpY, toP.x, toP.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated package dot moving along arc
      const t = ((this.animFrame * 0.003 + this.orders.indexOf(order) * 0.1) % 1);
      const px = (1 - t) * (1 - t) * fromP.x + 2 * (1 - t) * t * cpX + t * t * toP.x;
      const py = (1 - t) * (1 - t) * fromP.y + 2 * (1 - t) * t * cpY + t * t * toP.y;

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = color.replace('0.5', '1');
      ctx.fill();

      // From/To dots
      ctx.beginPath();
      ctx.arc(fromP.x, fromP.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(toP.x, toP.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}
