import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

/** ماژول قالب‌های برنامه */
@NgModule({
  declarations: [AdminLayoutComponent],
  imports: [CommonModule, RouterModule],
  exports: [AdminLayoutComponent]
})
export class LayoutsModule { }
