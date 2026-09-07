import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { ProductDetailComponent } from './product-detail.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: 'slug/:slug', component: ProductDetailComponent, data: { bySlug: true } },
  { path: ':id', component: ProductDetailComponent }
];

@NgModule({
  declarations: [
    ProductDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatIconModule
  ]
})
export class ProductModule { }
