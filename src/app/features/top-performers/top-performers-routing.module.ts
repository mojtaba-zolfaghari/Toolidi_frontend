import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TopPerformersComponent } from './top-performers.component';

const routes: Routes = [
  { path: '', component: TopPerformersComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TopPerformersRoutingModule {}
