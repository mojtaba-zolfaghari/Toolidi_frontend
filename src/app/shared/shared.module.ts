import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlaceholderComponent } from './placeholder/placeholder.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';

@NgModule({
  declarations: [
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent,
    SpinnerComponent,
    BarChartComponent,
    StatusBadgeComponent
  ],
  imports: [CommonModule],
  exports: [
    CommonModule,
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent,
    SpinnerComponent,
    BarChartComponent,
    StatusBadgeComponent
  ]
})
export class SharedModule { }
