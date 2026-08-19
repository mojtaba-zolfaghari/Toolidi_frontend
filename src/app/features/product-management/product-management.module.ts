import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';

import { ProductListComponent } from './product-list.component';
import { ProductFormComponent } from './product-form.component';
import { ImageUploadComponent } from './image-upload.component';
import { AttributesComponent } from './attributes.component';
import { VariationsComponent } from './variations.component';

/**
 * ماژول مدیریت محصولات؛ شامل لیست و فرم ایجاد/ویرایش محصول
 * برای پنل مدیر و فروشنده.
 */
@NgModule({
  declarations: [
    ProductListComponent,
    ProductFormComponent,
    ImageUploadComponent,
    AttributesComponent,
    VariationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    ProductListComponent,
    ProductFormComponent
  ]
})
export class ProductManagementModule { }
