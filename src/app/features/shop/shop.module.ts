import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { ShopComponent } from './shop.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: ShopComponent }
];

@NgModule({
  declarations: [
    ShopComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class ShopModule { }
