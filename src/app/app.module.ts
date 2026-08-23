import { NgModule } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFa from '@angular/common/locales/fa';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// اینترسپتور توکن (افزودن هدر Authorization و مدیریت خطای 401)
import { TokenInterceptor } from './core/interceptors/token.interceptor';

// Core Module (header/footer — stubs for Phase 1)
import { CoreModule } from './core/core.module';

// Shared Module (reusable UI components)
import { SharedModule } from './shared/shared.module';

// Layouts Module (admin/seller layout)
import { LayoutsModule } from './layouts/layouts.module';

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
    CoreModule,
    SharedModule,
    LayoutsModule,
  ],
  providers: [
    // ثبت اینترسپتور توکن برای تمام درخواست‌های HTTP
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
    { provide: LOCALE_ID, useValue: 'fa-IR' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
