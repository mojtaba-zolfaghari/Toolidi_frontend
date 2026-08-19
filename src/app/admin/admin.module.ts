import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { AdminPanelComponent } from './admin-panel.component';

const routes: Routes = [
  { path: '', component: AdminPanelComponent }
];

@NgModule({
  declarations: [AdminPanelComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }
