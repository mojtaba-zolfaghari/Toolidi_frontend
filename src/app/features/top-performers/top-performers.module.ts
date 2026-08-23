import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopPerformersRoutingModule } from './top-performers-routing.module';
import { TopPerformersComponent } from './top-performers.component';

@NgModule({
  declarations: [TopPerformersComponent],
  imports: [
    CommonModule,
    TopPerformersRoutingModule
  ]
})
export class TopPerformersModule {}
