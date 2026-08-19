import {
  animate,
  group,
  query,
  style,
  transition,
  trigger
} from '@angular/animations';

/**
 * انیمیشن‌های قابل استفاده‌ی مجدد در سراسر برنامه.
 * همه با استفاده از @angular/animations تعریف شده‌اند.
 */

/** محو شدن تدریجی (fade-in) برای انتقال صفحات */
export const fadeIn = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('400ms ease-out', style({ opacity: 1 }))
  ])
]);

/** لغزیدن به سمت بالا (slide-up) برای کارت‌های محصول */
export const slideUp = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(28px)' }),
    animate(
      '450ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ])
]);

/** بزرگ شدن (scale-up) برای مودال‌ها و دیالوگ‌ها */
export const scaleUp = trigger('scaleUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.92)' }),
    animate('220ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

/** انیمیشن انتقال بین صفحات (روی router-outlet) */
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate(
      '320ms ease-out',
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ])
]);

/** گروه‌بندی آیتم‌های لیست برای انیمیشن stagger (در صورت نیاز) */
export const staggerList = trigger('staggerList', [
  transition(':enter', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(16px)' }),
      group([
        animate(
          '400ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        )
      ])
    ], { optional: true })
  ])
]);
