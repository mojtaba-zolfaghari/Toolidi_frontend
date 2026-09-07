import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { ShippingComponent } from './shipping.component';
import { PersianNumberPipe } from '../../shared/persian-number.pipe';

const routes: Routes = [
  { path: '', component: ShippingComponent }
];

@NgModule({
  declarations: [
    ShippingComponent
  ],
  imports: [
    CommonModule,
    PersianNumberPipe,
    HttpClientModule,
    RouterModule.forChild(routes)
  ]
})
export class ShippingModule { }
