import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { PanelSharedModule } from '../../shared/panel/panel-shared.module';
import { AdminDashboardComponent } from './pages/dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './pages/users/admin-users.component';
import { AdminSellersComponent } from './pages/sellers/admin-sellers.component';
import { AdminSuppliersComponent } from './pages/suppliers/admin-suppliers.component';
import { AdminAgentsComponent } from './pages/agents/admin-agents.component';
import { AdminProductsComponent } from './pages/products/admin-products.component';
import { AdminSettingsComponent } from './pages/settings/admin-settings.component';
import { AdminReportsComponent } from './pages/reports/admin-reports.component';
import { AdminCostsComponent } from './pages/costs/admin-costs.component';
import { AdminPayoutsComponent } from './pages/payouts/admin-payouts.component';
import { AdminLocationsComponent } from './pages/locations/admin-locations.component';
import { AdminDiscountsComponent } from './pages/discounts/admin-discounts.component';
import { AdminSurveysComponent } from './pages/surveys/admin-surveys.component';
import { AdminCommissionRulesComponent } from './pages/commission/admin-commission-rules.component';
import { ImportStudioComponent } from './components/import-studio/import-studio.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'import-studio', component: ImportStudioComponent },
  { path: 'dashboard', component: AdminDashboardComponent },
  { path: 'users', component: AdminUsersComponent },
  { path: 'products', component: AdminProductsComponent },
  { path: 'sellers', component: AdminSellersComponent },
  { path: 'suppliers', component: AdminSuppliersComponent },
  { path: 'agents', component: AdminAgentsComponent },
  { path: 'reports', component: AdminReportsComponent },
  { path: 'costs', component: AdminCostsComponent },
  { path: 'payouts', component: AdminPayoutsComponent },
  { path: 'locations', component: AdminLocationsComponent },
  { path: 'discounts', component: AdminDiscountsComponent },
  { path: 'surveys', component: AdminSurveysComponent },
  { path: 'commission', component: AdminCommissionRulesComponent },
  { path: 'settings', component: AdminSettingsComponent }
];

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminUsersComponent,
    AdminSellersComponent,
    AdminSuppliersComponent,
    AdminAgentsComponent,
    AdminProductsComponent,
    AdminSettingsComponent,
    AdminReportsComponent,
    AdminCostsComponent,
    AdminPayoutsComponent,
    AdminLocationsComponent,
    AdminDiscountsComponent,
    AdminSurveysComponent,
    AdminCommissionRulesComponent,
    ImportStudioComponent
  ],
    imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, PanelSharedModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminModule { }
