import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SupplierDashboardComponent } from './dashboard/supplier-dashboard.component';
import { SupplierProductsComponent } from './products/supplier-products.component';
import { SupplierOrdersComponent } from './orders/supplier-orders.component';
import { SupplierDocumentsComponent } from './documents/supplier-documents.component';
import { OrderChatComponent } from '../../shared/components/order-chat/order-chat.component';
import { SharedModule } from '../../shared/shared.module';
import { PanelSharedModule } from '../../shared/panel/panel-shared.module';
import { SupplierProfileComponent } from './profile/supplier-profile.component';
import { SupplierCapacityComponent } from './pages/production-capacity/supplier-capacity.component';
import { SupplierScheduleComponent } from './pages/production-schedule/supplier-schedule.component';
import { SupplierProductionScheduleComponent } from './pages/production-schedule/supplier-production-schedule.component';
const routes: Routes = [
  { path: '', component: SupplierDashboardComponent },
  { path: 'products', component: SupplierProductsComponent },
  { path: 'orders', component: SupplierOrdersComponent },
  { path: 'documents', component: SupplierDocumentsComponent },
  { path: 'production-capacity', component: SupplierCapacityComponent },
  { path: 'production-schedule', component: SupplierScheduleComponent },
  { path: 'profile', component: SupplierProfileComponent }
];

@NgModule({
  declarations: [
    SupplierDashboardComponent,
    SupplierProductsComponent,
    SupplierOrdersComponent,
    SupplierDocumentsComponent,
    SupplierProfileComponent,
    SupplierCapacityComponent,
    SupplierScheduleComponent,
    SupplierProductionScheduleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    OrderChatComponent,
    PanelSharedModule,
    SharedModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    // OrderChatComponent (standalone) is imported via SharedModule exports
  ]
})
export class SupplierModule {}
