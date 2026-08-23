import { Component, OnInit } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-top-performers',
  templateUrl: './top-performers.component.html',
  styleUrls: ['./top-performers.component.scss']
})
export class TopPerformersComponent implements OnInit {
  activeTab: 'sellers' | 'couriers' = 'sellers';
  sortBy = 'rating';
  sellers: any[] = [];
  couriers: any[] = [];
  stats: any = null;
  loading = true;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadSellers();
    this.loadCouriers();
  }

  loadStats(): void {
    this.api.get<any>('/v1/top-performers/stats').pipe(
      catchError(() => [])
    ).subscribe((result: any) => { this.stats = result?.data; });
  }

  loadSellers(): void {
    this.loading = true;
    this.api.get<any>(`/v1/top-performers/sellers?sortBy=${this.sortBy}&limit=20`).pipe(
      catchError(() => { this.loading = false; return []; })
    ).subscribe((result: any) => {
      this.sellers = result?.data || [];
      this.loading = false;
    });
  }

  loadCouriers(): void {
    this.api.get<any>(`/v1/top-performers/couriers?sortBy=${this.sortBy}&limit=20`).pipe(
      catchError(() => [])
    ).subscribe((result: any) => {
      this.couriers = result?.data || [];
    });
  }

  switchTab(tab: 'sellers' | 'couriers'): void {
    this.activeTab = tab;
    this.loading = true;
    if (tab === 'sellers') this.loadSellers();
    else this.loadCouriers();
  }

  switchSort(sort: string): void {
    this.sortBy = sort;
    this.loading = true;
    if (this.activeTab === 'sellers') this.loadSellers();
    else this.loadCouriers();
  }

  getRankBadge(index: number): string {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  }

  getRankColor(index: number): string {
    if (index === 0) return 'from-yellow-400 to-amber-500';
    if (index === 1) return 'from-gray-300 to-gray-400';
    if (index === 2) return 'from-orange-300 to-orange-400';
    return 'from-primary/10 to-primary/20';
  }

  trackById(_: number, item: any): any {
    return item.id;
  }
}
