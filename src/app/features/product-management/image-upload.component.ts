import { Component, EventEmitter, Input, Output } from '@angular/core';

import { LocalImage } from './product-management.models';

/**
 * کامپوننت آپلود تصاویر محصول.
 * فایل‌ها به base64 تبدیل شده و به عنوان داده‌ی تصویر در اختیار فرم قرار می‌گیرند.
 */
@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html'
})
export class ImageUploadComponent {
  @Input() disabled = false;
  @Output() imagesChange = new EventEmitter<LocalImage[]>();

  images: LocalImage[] = [];
  isDragging = false;

  /** انتخاب فایل از ورودی */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  /** رها کردن فایل‌ها در ناحیه‌ی دراپ */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  /** خواندن فایل‌ها به صورت base64 و افزودن به لیست */
  private addFiles(files: File[]): void {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        this.images.push({
          dataUrl: String(reader.result),
          altText: file.name,
          isPrimary: this.images.length === 0
        });
        this.emit();
      };
      reader.readAsDataURL(file);
    }
  }

  /** انتخاب تصویر اصلی */
  setPrimary(index: number): void {
    this.images.forEach((image, i) => (image.isPrimary = i === index));
    this.emit();
  }

  /** حذف تصویر */
  remove(index: number): void {
    this.images.splice(index, 1);
    if (this.images.length && !this.images.some((image) => image.isPrimary)) {
      this.images[0].isPrimary = true;
    }
    this.emit();
  }

  private emit(): void {
    this.imagesChange.emit(this.images.map((image) => ({ ...image })));
  }
}
