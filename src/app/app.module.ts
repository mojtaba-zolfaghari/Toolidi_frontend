import { NgModule } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFa from '@angular/common/locales/fa';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { QuicklinkModule } from 'ngx-quicklink';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** برچسب‌های فارسی برای MatPaginator در کل برنامه */
function persianPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'مورد در هر صفحه:';
  intl.nextPageLabel = 'صفحه بعد';
  intl.previousPageLabel = 'صفحه قبل';
  intl.firstPageLabel = 'صفحه اول';
  intl.lastPageLabel = 'صفحه آخر';
  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 از ${length}`;
    }
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} – ${endIndex} از ${length}`;
  };
  return intl;
}

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// 토큰 인터셉터 (Authorization 헤더 및 401 오류 관리)
import { TokenInterceptor } from './core/interceptors/token.interceptor';

// Core Module (헤더/푸터 — 1단계 stub)
import { CoreModule } from './core/core.module';

// Shared Module (재사용 가능한 UI 컴포넌트)
import { SharedModule } from './shared/shared.module';

registerLocaleData(localeFa);

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    AppRoutingModule,
    QuicklinkModule,
    CoreModule,
    SharedModule,
    ServiceWorkerModule
  ],
  providers: [
    // 토큰 인터셉터 등록: 모든 HTTP 요청에 적용
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'fa-IR' },
    // برچسب‌های فارسی صفحه‌بند Material در کل برنامه
    { provide: MatPaginatorIntl, useValue: persianPaginatorIntl() },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
