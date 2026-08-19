import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// اینترسپتور توکن (افزودن هدر Authorization و مدیریت خطای 401)
import { TokenInterceptor } from './core/interceptors/token.interceptor';

// Core Module (header/footer — stubs for Phase 1)
import { CoreModule } from './core/core.module';

// Shared Module (reusable UI components)
import { SharedModule } from './shared/shared.module';

// Feature Modules (built incrementally)
import { HomeModule } from './features/home/ho