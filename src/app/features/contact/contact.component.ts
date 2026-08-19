import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { fadeIn } from '../../shared/animations';

/** صفحه تماس با ما */
@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  animations: [fadeIn]
})
export class ContactComponent {
  form: FormGroup;
  submitted = false;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /** ارسال فرم تماس */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted = true;
  }
}
