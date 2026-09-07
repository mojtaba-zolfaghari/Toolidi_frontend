import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-field-error',
  template: `
    <div *ngIf="control && control.invalid && (control.dirty || control.touched)" class="field-error">
      <p *ngIf="control.errors?.['required']" class="field-error__msg">{{ label }} الزامی است.</p>
      <p *ngIf="control.errors?.['minlength']" class="field-error__msg">{{ label }} باید حداقل {{ control.errors!['minlength'].requiredLength }} کاراکتر باشد.</p>
      <p *ngIf="control.errors?.['maxlength']" class="field-error__msg">{{ label }} حداکثر {{ control.errors!['maxlength'].requiredLength }} کاراکتر است.</p>
      <p *ngIf="control.errors?.['min']" class="field-error__msg">{{ label }} باید حداقل {{ control.errors!['min'].min }} باشد.</p>
      <p *ngIf="control.errors?.['max']" class="field-error__msg">{{ label }} حداکثر {{ control.errors!['max'].max }} است.</p>
      <p *ngIf="control.errors?.['email']" class="field-error__msg">{{ label }} معتبر نیست.</p>
      <p *ngIf="control.errors?.['pattern']" class="field-error__msg">{{ label }} فرمت نامعتبر دارد.</p>
      <p *ngIf="control.errors?.['phone']" class="field-error__msg">{{ label }} شماره موبایل معتبر وارد کنید.</p>
      <p *ngIf="control.errors?.['nationalCode']" class="field-error__msg">{{ label }} کد ملی باید ۱۰ رقم باشد.</p>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .field-error {
      margin-top: 0.25rem;
    }

    .field-error__msg {
      margin: 0;
      color: #ef4444;
      font-size: 0.75rem;
    }
  `]
})
export class FieldErrorComponent {
  @Input() control!: AbstractControl;
  @Input() label = '';
}
