import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';

import { AttributeGroup } from './product-management.models';

/**
 * کامپوننت ویژگی‌های محصول.
 * کاربر می‌تواند گروه‌های ویژگی (نام + چند مقدار) اضافه کند و برای هر مقدار
 * یک تصویر نمونه (swatch) انتخاب نماید.
 */
@Component({
    selector: 'app-product-attributes',
    templateUrl: './attributes.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AttributesComponent {
  @Output() attributesChange = new EventEmitter<AttributeGroup[]>();

  attributes: AttributeGroup[] = [];

  /** افزودن گروه ویژگی جدید */
  addGroup(): void {
    this.attributes.push({ name: '', values: [{ value: '' }] });
    this.emit();
  }

  /** حذف گروه ویژگی */
  removeGroup(index: number): void {
    this.attributes.splice(index, 1);
    this.emit();
  }

  /** افزودن مقدار جدید به گروه */
  addValue(groupIndex: number): void {
    this.attributes[groupIndex].values.push({ value: '' });
    this.emit();
  }

  /** حذف مقدار از گروه */
  removeValue(groupIndex: number, valueIndex: number): void {
    const values = this.attributes[groupIndex].values;
    if (values.length > 1) {
      values.splice(valueIndex, 1);
    }
    this.emit();
  }

  /** افزودن تصویر نمونه برای یک مقدار */
  onValueImage(groupIndex: number, valueIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.attributes[groupIndex].values[valueIndex].image = String(reader.result);
        this.emit();
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  /** تغییر نام/مقدار در فرم */
  onFieldChange(): void {
    this.emit();
  }

  private emit(): void {
    this.attributesChange.emit(
      this.attributes.map((group) => ({
        name: group.name,
        values: group.values.map((value) => ({ ...value }))
      }))
    );
  }
}
