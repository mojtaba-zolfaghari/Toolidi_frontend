import { Component, EventEmitter, Input, Output } from '@angular/core';

import { AttributeGroup, VariationItem } from './product-management.models';

/**
 * کامپوننت تنوع‌های محصول.
 * با ترکیب مقادیر ویژگی‌ها، تنوع‌ها به صورت خودکار تولید می‌شوند
 * و کاربر می‌تواند هر تنوع را ویرایش کند.
 */
@Component({
  selector: 'app-product-variations',
  templateUrl: './variations.component.html'
})
export class VariationsComponent {
  @Input() attributes: AttributeGroup[] = [];
  @Input() baseSku = '';
  @Output() variationsChange = new EventEmitter<VariationItem[]>();

  variations: VariationItem[] = [];

  /** تولید خودکار تنوع‌ها از ترکیب مقادیر ویژگی‌ها */
  generate(): void {
    const groups = this.attributes
      .filter((group) => group.name.trim() && group.values.length)
      .map((group) => group.values.filter((value) => value.value.trim()).map((value) => value.value));

    const combos = this.cartesian(groups);
    this.variations = combos.map((combo, index) => ({
      sku: `${this.baseSku || 'VAR'}-${index + 1}`,
      displayName: combo.join(' - '),
      priceAdjustment: 0,
      stockQuantity: 0,
      isDefault: index === 0
    }));
    this.emit();
  }

  /** حذف یک تنوع */
  remove(index: number): void {
    this.variations.splice(index, 1);
    this.emit();
  }

  /** تغییر فیلدهای تنوع */
  onFieldChange(): void {
    this.emit();
  }

  /** انتخاب تنوع پیش‌فرض */
  setDefault(index: number): void {
    this.variations.forEach((variation, i) => (variation.isDefault = i === index));
    this.emit();
  }

  private cartesian(arrays: string[][]): string[][] {
    return arrays.reduce<string[][]>((acc, arr) => {
      if (!acc.length) {
        return arr.map((value) => [value]);
      }
      const result: string[][] = [];
      for (const existing of acc) {
        for (const value of arr) {
          result.push([...existing, value]);
        }
      }
      return result;
    }, []);
  }

  private emit(): void {
    this.variationsChange.emit(this.variations.map((variation) => ({ ...variation })));
  }
}
