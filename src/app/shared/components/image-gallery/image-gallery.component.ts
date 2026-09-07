import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-gallery',
  template: `
    <div class="gallery">
      <!-- Main image -->
      <div class="gallery__main" (click)="toggleZoom()">
        <img *ngIf="images.length" [src]="images[selectedIndex]?.url || images[selectedIndex]"
             class="gallery__img"
             [style.transform]="zoomed ? 'scale(2)' : 'scale(1)'"
             [style.transformOrigin]="zoomOrigin" alt="">
        <div *ngIf="!images.length" class="gallery__empty">📷</div>
        <button *ngIf="images.length > 1" type="button" (click)="$event.stopPropagation(); prev()"
                class="gallery__nav gallery__nav--prev" aria-label="تصویر قبلی">→</button>
        <button *ngIf="images.length > 1" type="button" (click)="$event.stopPropagation(); next()"
                class="gallery__nav gallery__nav--next" aria-label="تصویر بعدی">←</button>
        <span *ngIf="zoomed" class="gallery__zoom-hint">برای بستن کلیک کنید</span>
      </div>
      <!-- Thumbnails -->
      <div *ngIf="images.length > 1" class="gallery__thumbs">
        <button *ngFor="let img of images; let i = index" type="button" (click)="selectedIndex = i"
                class="gallery__thumb"
                [class.is-active]="i === selectedIndex">
          <img [src]="img?.url || img" class="gallery__thumb-img" alt="">
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .gallery {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .gallery__main {
      position: relative;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      border-radius: 1rem;
      background: #f3f4f6;
      cursor: pointer;
    }

    .gallery__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .gallery__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #d1d5db;
      font-size: 3.75rem;
    }

    .gallery__nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
      color: #374151;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .gallery__nav:hover {
      background: #fff;
    }

    .gallery__nav--prev { right: 0.75rem; }
    .gallery__nav--next { left: 0.75rem; }

    .gallery__zoom-hint {
      position: absolute;
      bottom: 0.75rem;
      left: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      font-size: 0.75rem;
    }

    .gallery__thumbs {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }

    .gallery__thumb {
      flex-shrink: 0;
      width: 4rem;
      height: 4rem;
      overflow: hidden;
      border: 2px solid transparent;
      border-radius: 0.5rem;
      padding: 0;
      background: none;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }

    .gallery__thumb.is-active {
      border-color: var(--mat-sys-primary, #6C3FC5);
    }

    .gallery__thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `]
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
