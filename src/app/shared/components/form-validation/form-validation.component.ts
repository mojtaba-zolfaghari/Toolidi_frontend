import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  template: `
    <div *ngIf="control && control.invalid && (control.dirty || control.touched)" class="mt-1">
      <p *ngIf="control.errors?.['required']" class="text-xs text-red-500">{{ label }} الزامی است.</p>
      <p *ngIf="control.errors?.['minlength']" class="text-xs text-red-500">{{ label }} باید حداقل {{ control.errors!['minlength'].requiredLength }} کاراکتر باشد.</p>
      <p *ngIf="control.errors?.['maxlength']" class="text-xs text-red-500">{{ label }} حداکثر {{ control.errors!['maxlength'].requiredLength }} کاراکتر است.</p>
      <p *ngIf="control.errors?.['min']" class="text-xs text-red-500">{{ label }} باید حداقل {{ control.errors!['min'].min }} باشد.</p>
      <p *ngIf="control.errors?.['max']" class="text-xs text-red-500">{{ label }} حداکثر {{ control.errors!['max'].max }} است.</p>
      <p *ngIf="control.errors?.['email']" class="text-xs text-red-500">{{ label }} معتبر نیست.</p>
      <p *ngIf="control.errors?.['pattern']" class="text-xs text-red-500">{{ label }} فرمت نامعتبر دارد.</p>
      <p *ngIf="control.errors?.['phone']" class="text-xs text-red-500">شماره موبایل معتبر وارد کنید.</p>
      <p *ngIf="control.errors?.['nationalCode']" class="text-xs text-red-500">کد ملی باید ۱۰ رقم باشد.</p>
    </div>
  `
})
export class FieldErrorComponent {
  @Input() control!: AbstractControl;
  @Input() label = '';
}
