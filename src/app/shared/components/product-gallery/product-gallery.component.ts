import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * TASK-FE-023: Image Gallery with Zoom for Product Detail
 * - Thumbnail strip with image selection
 * - Main image with hover-zoom effect
 * - RTL-aware navigation arrows
 */
@Component({
  selector: 'app-product-gallery',
  template: `
    <div dir="rtl" class="relative">
      <!-- Main Image with Zoom -->
      <div class="relative overflow-hidden rounded-2xl bg-gray-100 aspect-square cursor-crosshair group"
           (mousemove)="onMouseMove($event)"
           (mouseleave)="onMouseLeave()">
        <img *ngIf="images.length"
             [src]="images[selectedIndex]"
             [alt]="productName"
             class="w-full h-full object-cover transition-transform duration-200"
             [style.transform]="zoomActive ? 'scale(2)' : 'scale(1)'"
             [style.transform-origin]="zoomOrigin"
             loading="lazy">

        <div *ngIf="!images.length" class="flex items-center justify-center h-full text-6xl text-gray-300">
          📷
        </div>

        <!-- Zoom indicator -->
        <div *ngIf="!zoomActive" class="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
          🔍 بزرگنمایی
        </div>

        <!-- Navigation arrows -->
        <button *ngIf="images.length > 1" (click)="prev()"
                class="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center text-secondary hover:bg-white transition-all">
          ›
        </button>
        <button *ngIf="images.length > 1" (click)="next()"
                class="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 shadow-lg flex items-center justify-center text-secondary hover:bg-white transition-all">
          ‹
        </button>

        <!-- Image counter -->
        <div *ngIf="images.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
          {{ selectedIndex + 1 }} / {{ images.length }}
        </div>
      </div>

      <!-- Thumbnails -->
      <div *ngIf="images.length > 1" class="flex gap-2 mt-3 overflow-x-auto pb-2">
        <button *ngFor="let img of images; let i = index"
                (click)="selectedIndex = i"
                class="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all"
                [class.border-primary]="i === selectedIndex"
                [class.border-transparent]="i !== selectedIndex"
                [class.opacity-60]="i !== selectedIndex">
          <img [src]="img" [alt]="productName + ' ' + (i+1)" class="w-full h-full object-cover">
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .overflow-x-auto::-webkit-scrollbar { height: 4px; }
    .overflow-x-auto::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
  `]
})
export class ProductGalleryComponent {
  @Input() images: string[] = [];
  @Input() productName = '';
  @Output() imageChange = new EventEmitter<number>();

  selectedIndex = 0;
  zoomActive = false;
  zoomOrigin = 'center center';

  next(): void {
    this.selectedIndex = (this.selectedIndex + 1) % this.images.length;
    this.imageChange.emit(this.selectedIndex);
  }

  prev(): void {
    this.selectedIndex = (this.selectedIndex - 1 + this.images.length) % this.images.length;
    this.imageChange.emit(this.selectedIndex);
  }

  onMouseMove(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomOrigin = `${x}% ${y}%`;
    this.zoomActive = true;
  }

  onMouseLeave(): void {
    this.zoomActive = false;
  }
}
