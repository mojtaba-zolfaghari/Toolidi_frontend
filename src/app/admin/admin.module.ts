import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AdminPanelComponent } from './admin-panel.component';
import { SharedModule } from '../shared/shared.module';
import { ProductManagementModule } from '../features/product-management/product-management.module';
import { ProductListComponent } from '../features/product-management/product-list.component';
import { ProductFormComponent } from '../features/product-management/product-form.component';
import { AdminUsersComponent } from '../features/admin/pages/users/admin-users.component';
import { AdminSellersComponent } from '../features/admin/pages/sellers/admin-sellers.component';
import { AdminDiscountsComponent } from '../features/admin/pages/discounts/admin-discounts.component';
import { AdminReportsComponent } from '../features/admin/pages/reports/admin-reports.component';
import { AdminSettingsComponent } from '../features/admin/pages/settings/admin-settings.component';
import { AdminCommissionRulesComponent } from '../features/admin/pages/commission/admin-commission-rules.component';
import { AdminPayoutsComponent } from '../features/admin/pages/payouts/admin-payouts.component';
import { AdminSurveysComponent } from '../features/admin/pages/surveys/admin-surveys.component';
import { AdminCostsComponent } from '../features/admin/pages/costs/admin-costs.component';

const routes: Routes = [
  { path: '', component: AdminPanelComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/edit/:id', component: ProductFormComponent },
  { path: 'users', component: AdminUsersComponent },
  { path: 'sellers', component: AdminSellersComponent },
  { path: 'discounts', component: AdminDiscountsComponent },
  { path: 'reports', component: AdminReportsComponent },
  { path: 'settings', component: AdminSettingsComponent },
  { path: 'commission-rules', component: AdminCommissionRulesComponent },
  { path: 'payouts', component: AdminPayoutsComponent },
  { path: 'surveys', component: AdminSurveysComponent },
  { path: 'costs', component: AdminCostsComponent }
];

@NgModule({
  declarations: [
    AdminPanelComponent,
    AdminUsersComponent,
    AdminSellersComponent,
    AdminDiscountsComponent,
    AdminReportsComponent,
    AdminSettingsComponent,
    AdminCommissionRulesComponent,
    AdminPayoutsComponent,
    AdminSurveysComponent,
    AdminCostsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    ProductManagementModule
  ]
})
export class AdminModule { }
