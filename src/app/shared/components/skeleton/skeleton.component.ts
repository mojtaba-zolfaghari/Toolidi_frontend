import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-skeleton',
    template: `
    <div class="animate-pulse" [class]="containerClass">
      <!-- Text skeleton -->
      @if (type === 'text') {
        <div class="space-y-2">
          @for (i of linesArray; track i) {
            <div class="rounded bg-gray-200"
              [style.height.px]="height"
            [style.width]="i === linesArray.length - 1 ? lastLineWidth : '100%'"></div>
          }
        </div>
      }
    
      <!-- Card skeleton -->
      @if (type === 'card') {
        <div class="rounded-2xl bg-white p-4 shadow-sm">
          <div class="rounded-xl bg-gray-200" [style.height.px]="imageHeight"></div>
          <div class="mt-4 space-y-2">
            <div class="h-4 w-3/4 rounded bg-gray-200"></div>
            <div class="h-3 w-1/2 rounded bg-gray-200"></div>
            <div class="h-3 w-1/3 rounded bg-gray-200"></div>
          </div>
        </div>
      }
    
      <!-- Table skeleton -->
      @if (type === 'table') {
        <div class="space-y-3">
          @for (r of rowsArray; track r) {
            <div class="flex gap-4">
              @for (c of columnsArray; track c) {
                <div class="h-4 flex-1 rounded bg-gray-200"></div>
              }
            </div>
          }
        </div>
      }
    
      <!-- Circle skeleton -->
      @if (type === 'circle') {
        <div class="rounded-full bg-gray-200 animate-pulse"
        [style.width.px]="size" [style.height.px]="size"></div>
      }
    </div>
    `,
    styles: [`
    :host { display: block; }
    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SkeletonComponent {
  @Input() type: 'text' | 'card' | 'table' | 'circle' = 'text';
  @Input() lines = 3;
  @Input() height = 16;
  @Input() imageHeight = 180;
  @Input() size = 48;
  @Input() rows = 5;
  @Input() columns = 4;
  @Input() lastLineWidth = '60%';
  @Input() containerClass = '';

  get linesArray(): number[] { return Array.from({ length: this.lines }, (_, i) => i); }
  get rowsArray(): number[] { return Array.from({ length: this.rows }, (_, i) => i); }
  get columnsArray(): number[] { return Array.from({ length: this.columns }, (_, i) => i); }
}

@Component({
    selector: 'app-skeleton-product-grid',
    template: `
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      @for (i of skeletonArray; track i) {
        <app-skeleton type="card" [imageHeight]="160"></app-skeleton>
      }
    </div>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SkeletonProductGridComponent {
  @Input() count = 8;
  get skeletonArray(): number[] { return Array.from({ length: this.count }, (_, i) => i); }
}

@Component({
    selector: 'app-skeleton-table',
    template: `
    <div class="rounded-2xl bg-white p-6 shadow-sm">
      <div class="h-6 w-48 rounded bg-gray-200 mb-6 animate-pulse"></div>
      <app-skeleton type="table" [rows]="rows" [columns]="5"></app-skeleton>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SkeletonTableComponent {
  @Input() rows = 8;
}
