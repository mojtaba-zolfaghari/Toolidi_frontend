import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SellerDashboardComponent } from './dashboard/seller-dashboard.component';
import { SharedModule } from '../../shared/shared.module';
import { ProductManagementModule } from '../product-management/product-management.module';
import { ProductListComponent } from '../product-management/product-list.component';
import { ProductFormComponent } from '../product-management/product-form.component';
import { SellerPayoutsComponent } from './pages/payouts/seller-payouts.component';
import { SellerSurveysComponent } from './pages/surveys/seller-surveys.component';
import { SellerCostsComponent } from './pages/costs/seller-costs.component';

const routes: Routes = [
  { path: '', component: SellerDashboardComponent },
  { path: 'products', component: ProductListComponent },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/edit/:id', component: ProductFormComponent },
  { path: 'payouts', component: SellerPayoutsComponent },
  { path: 'surveys', component: SellerSurveysComponent },
  { path: 'costs', component: SellerCostsComponent }
];

@NgModule({
  declarations: [SellerDashboardComponent, SellerPayoutsComponent, SellerSurveysComponent, SellerCostsComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    ProductManagementModule
  ]
})
export class SellerModule { }
