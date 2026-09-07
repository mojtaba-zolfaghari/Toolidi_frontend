import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SeoService } from '../../core/services/seo.service';
import { fadeIn } from '../../shared/animations';

/** صفحه تماس با ما */
@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  animations: [fadeIn]
})
export class ContactComponent implements OnInit {
  constructor(
    private readonly fb: FormBuilder,
    private readonly seo: SeoService
  ) {}

  form!: FormGroup;
  submitted = false;

  ngOnInit(): void {
    this.seo.setPage({
      title: 'تماس با ما — تولیدی',
      description: 'تماس با پشتیبانی تولیدی. پاسخ به سؤالات، گزارش مشکلات و درخواست همکاری.',
      url: 'https://toolidi.ir/contact',
      type: 'website',
    });
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
