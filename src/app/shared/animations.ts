import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
  state,
  sequence
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

/** لغزیدن از چپ (slide-from-right در RTL) */
export const slideFromRight = trigger('slideFromRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-40px)' }),
    animate(
      '500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' })
    )
  ])
]);

/** لغزیدن از راست (slide-from-left در RTL) */
export const slideFromLeft = trigger('slideFromLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(40px)' }),
    animate(
      '500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      style({ opacity: 1, transform: 'translateX(0)' })
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

/** انیمیشن zoom-in برای نقشه */
export const zoomIn = trigger('zoomIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.85)' }),
    animate(
      '600ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      style({ opacity: 1, transform: 'scale(1)' })
    )
  ])
]);

/** انیمیشن pulse برای نقاط نقشه */
export const pulse = trigger('pulse', [
  state('active', style({ transform: 'scale(1)', opacity: 1 })),
  transition('* => active', [
    style({ transform: 'scale(0)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
  ])
]);

/** انیمیشن خط رسم‌شونده */
export const drawLine = trigger('drawLine', [
  transition(':enter', [
    style({ 'stroke-dashoffset': '{{dashLength}}' }),
    animate('{{duration}}ms ease-in-out', style({ 'stroke-dashoffset': '0' }))
  ], { params: { dashLength: 1000, duration: 2000 } })
]);

/** انیمیشن fade-in-up با تأخیر */
export const fadeSlideUp = trigger('fadeSlideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(30px)' }),
    animate(
      '{{delay}}ms {{duration}}ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ], { params: { delay: 0, duration: 500 } })
]);

/** شمارنده متحرک */
export const countUp = trigger('countUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

/** لغزیدن از پایین به بالا (slide-in-from-bottom) برای کارت‌ها */
export const slideInFromBottom = trigger('slideInFromBottom', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(40px)' }),
    animate(
      '{{delay}}ms {{duration}}ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      style({ opacity: 1, transform: 'translateY(0)' })
    )
  ], { params: { delay: 0, duration: 600 } })
]);
