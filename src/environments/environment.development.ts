/**
 * محیط توسعه (Development)
 * این فایل فقط هنگام اجرای ng serve با کانفیگ development
 * (که حالت پیش‌فرض serve است) جای environment.ts استفاده می‌شود.
 *
 * بک‌اند لوکال را با این دستور اجرا کنید:
 *   dotnet run --project backend/src/Toolidi.Ecommerce.WebApi --launch-profile http
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5291/api',
  publicSiteUrl: 'https://api.toolidi.ir/',
  siteName: 'تولیدی'
};
