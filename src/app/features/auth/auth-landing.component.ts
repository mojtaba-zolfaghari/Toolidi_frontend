import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-landing',
  template: `
    <section dir="rtl" class="mx-auto max-w-5xl px-4 py-12">
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-sm font-bold text-primary">به تولیدی خوش آمدید</p>
        <h1 class="mt-2 text-3xl font-extrabold text-secondary">برای شروع، مسیر خود را انتخاب کنید</h1>
        <p class="mt-3 text-gray-500">ورود یا ثبت‌نام متناسب با نقش خود را انتخاب کنید.</p>
      </div>
      <div class="mt-10 grid gap-5 md:grid-cols-3">
        <a *ngFor="let role of roles" [routerLink]="role.route" class="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-lg">
          <span class="text-4xl">{{ role.icon }}</span>
          <h2 class="mt-4 text-xl font-bold text-secondary">{{ role.title }}</h2>
          <p class="mt-2 text-sm text-gray-500">{{ role.description }}</p>
          <span class="mt-5 inline-block rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white">ورود / ثبت‌نام</span>
        </a>
      </div>
    </section>
  `
})
export class AuthLandingComponent {
  readonly roles = [
    { title: 'خریدار', description: 'مشاهده محصولات و ثبت سفارش عمده', route: '/auth/login', icon: '🛒' },
    { title: 'فروشنده', description: 'ساخت فروشگاه و عرضه محصولات', route: '/auth/seller-register', icon: '🏪' },
    { title: 'کارپخش', description: 'مدیریت ارسال و دریافت درآمد', route: '/auth/agent-register', icon: '🛵' }
  ];
}
