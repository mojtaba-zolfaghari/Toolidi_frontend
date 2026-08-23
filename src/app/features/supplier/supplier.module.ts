import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SupplierDashboardComponent } from './dashboard/supplier-dashboard.component';
import { SupplierProductsComponent } from './products/supplier-products.component';
import { SupplierOrdersComponent } from './orders/supplier-orders.component';
import { SupplierProfileComponent } from './profile/supplier-profile.component';

const routes: Routes = [
  { path: '', component: SupplierDashboardComponent },
  { path: 'products', component: SupplierProductsComponent },
  { path: 'orders', component: SupplierOrdersComponent },
  { path: 'profile', component: SupplierProfileComponent }
];

@NgModule({
  declarations: [
    SupplierDashboardComponent,
    SupplierProductsComponent,
    SupplierOrdersComponent,
    SupplierProfileComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class SupplierModule {}
