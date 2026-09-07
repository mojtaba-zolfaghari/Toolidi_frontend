import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopPerformersRoutingModule } from './top-performers-routing.module';
import { TopPerformersComponent } from './top-performers.component';
import { PersianNumberPipe } from '../../shared/persian-number.pipe';

@NgModule({
  declarations: [TopPerformersComponent],
  imports: [
    CommonModule,
    PersianNumberPipe,
    TopPerformersRoutingModule
  ]
})
export class TopPerformersModule {}
