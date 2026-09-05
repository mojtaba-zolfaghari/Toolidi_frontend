import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SupplierDashboardComponent } from './dashboard/supplier-dashboard.component';
import { SupplierProductsComponent } from './products/supplier-products.component';
import { SupplierOrdersComponent } from './orders/supplier-orders.component';
import { SupplierProfileComponent } from './profile/supplier-profile.component';
import { SupplierCapacityComponent } from './pages/production-capacity/supplier-capacity.component';
import { SupplierScheduleComponent } from './pages/production-schedule/supplier-schedule.component';
import { SupplierProductionScheduleComponent } from './pages/production-schedule/supplier-production-schedule.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: SupplierDashboardComponent },
  { path: 'products', component: SupplierProductsComponent },
  { path: 'orders', component: SupplierOrdersComponent },
  { path: 'production-capacity', component: SupplierCapacityComponent },
  { path: 'production-schedule', component: SupplierScheduleComponent },
  { path: 'profile', component: SupplierProfileComponent }
];

@NgModule({
  declarations: [
    SupplierDashboardComponent,
    SupplierProductsComponent,
    SupplierOrdersComponent,
    SupplierProfileComponent,
    SupplierCapacityComponent,
    SupplierScheduleComponent,
    SupplierProductionScheduleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class SupplierModule {}
