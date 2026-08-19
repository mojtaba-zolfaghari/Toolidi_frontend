import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { ProductDetailComponent } from './product-detail.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: ':id', component: ProductDetailComponent },
  { path: 'slug/:slug', component: ProductDetailComponent }
];

@NgModule({
  declarations: [
    ProductDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class ProductModule { }
