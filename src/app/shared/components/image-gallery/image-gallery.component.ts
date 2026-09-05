import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-gallery',
  template: `
    <div class="space-y-3">
      <!-- Main image -->
      <div class="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square cursor-pointer"
           (click)="toggleZoom()">
        <img *ngIf="images.length" [src]="images[selectedIndex]?.url || images[selectedIndex]"
             class="w-full h-full object-cover transition-transform duration-300"
             [style.transform]="zoomed ? 'scale(2)' : 'scale(1)'"
             [style.transformOrigin]="zoomOrigin" alt="">
        <div *ngIf="!images.length" class="flex items-center justify-center h-full text-6xl text-gray-300">📷</div>
        <button *ngIf="images.length > 1" (click)="$event.stopPropagation(); prev()" class="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow">→</button>
        <button *ngIf="images.length > 1" (click)="$event.stopPropagation(); next()" class="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow">←</button>
        <span *ngIf="zoomed" class="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">برای بستن کلیک کنید</span>
      </div>
      <!-- Thumbnails -->
      <div *ngIf="images.length > 1" class="flex gap-2 overflow-x-auto pb-1">
        <button *ngFor="let img of images; let i = index" (click)="selectedIndex = i"
                class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors"
                [class.border-primary]="i === selectedIndex"
                [class.border-transparent]="i !== selectedIndex">
          <img [src]="img?.url || img" class="w-full h-full object-cover" alt="">
        </button>
      </div>
    </div>
  `
})
export class ImageGalleryComponent {
  @Input() images: any[] = [];
  @Output() imageChanged = new EventEmitter<number>();

  selectedIndex = 0;
  zoomed = false;
  zoomOrigin = 'center center';

  prev() { this.selectedIndex = (this.selectedIndex - 1 + this.images.length) % this.images.length; this.imageChanged.emit(this.selectedIndex); }
  next() { this.selectedIndex = (this.selectedIndex + 1) % this.images.length; this.imageChanged.emit(this.selectedIndex); }
  toggleZoom() { this.zoomed = !this.zoomed; }
}
