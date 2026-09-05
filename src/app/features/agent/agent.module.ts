import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { AgentReadyItemsComponent } from './pages/ready-items/agent-ready-items.component';
import { AgentPickupScheduleComponent } from './pages/pickup-schedule/agent-pickup-schedule.component';
import { AgentEarningsComponent } from './pages/earnings/agent-earnings.component';

const routes: Routes = [
  { path: '', redirectTo: 'ready-items', pathMatch: 'full' },
  { path: 'ready-items', component: AgentReadyItemsComponent },
  { path: 'pickup-schedule', component: AgentPickupScheduleComponent },
  { path: 'earnings', component: AgentEarningsComponent }
];

@NgModule({
  declarations: [
    AgentReadyItemsComponent,
    AgentPickupScheduleComponent,
    AgentEarningsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule
  ]
})
export class AgentModule {}
