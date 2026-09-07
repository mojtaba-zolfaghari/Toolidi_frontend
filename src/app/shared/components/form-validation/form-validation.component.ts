import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
    selector: 'app-field-error',
    template: `
    @if (control && control.invalid && (control.dirty || control.touched)) {
      <div class="field-error">
        @if (control.errors?.['required']) {
          <p class="field-error__msg">{{ label }} الزامی است.</p>
        }
        @if (control.errors?.['minlength']) {
          <p class="field-error__msg">{{ label }} باید حداقل {{ control.errors!['minlength'].requiredLength }} کاراکتر باشد.</p>
        }
        @if (control.errors?.['maxlength']) {
          <p class="field-error__msg">{{ label }} حداکثر {{ control.errors!['maxlength'].requiredLength }} کاراکتر است.</p>
        }
        @if (control.errors?.['min']) {
          <p class="field-error__msg">{{ label }} باید حداقل {{ control.errors!['min'].min }} باشد.</p>
        }
        @if (control.errors?.['max']) {
          <p class="field-error__msg">{{ label }} حداکثر {{ control.errors!['max'].max }} است.</p>
        }
        @if (control.errors?.['email']) {
          <p class="field-error__msg">{{ label }} معتبر نیست.</p>
        }
        @if (control.errors?.['pattern']) {
          <p class="field-error__msg">{{ label }} فرمت نامعتبر دارد.</p>
        }
        @if (control.errors?.['phone']) {
          <p class="field-error__msg">{{ label }} شماره موبایل معتبر وارد کنید.</p>
        }
        @if (control.errors?.['nationalCode']) {
          <p class="field-error__msg">{{ label }} کد ملی باید ۱۰ رقم باشد.</p>
        }
      </div>
    }
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
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FieldErrorComponent {
  @Input() control!: AbstractControl;
  @Input() label = '';
}
