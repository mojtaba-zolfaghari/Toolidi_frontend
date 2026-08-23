import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PlaceholderComponent } from './placeholder/placeholder.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { MegaMenuComponent } from './mega-menu/mega-menu.component';
import { GlobeComponent } from './globe/globe.component';
import { AddToCartButtonComponent } from './components/add-to-cart-button/add-to-cart-button.component';
import { FloatingCartComponent } from './components/floating-cart/floating-cart.component';
import { PersianDatePipe } from './persian-date.pipe';

@NgModule({
  declarations: [
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent,
    SpinnerComponent,
    BarChartComponent,
    StatusBadgeComponent,
    MegaMenuComponent,
    GlobeComponent,
    AddToCartButtonComponent,
    FloatingCartComponent,
    PersianDatePipe
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    CommonModule,
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent,
    SpinnerComponent,
    BarChartComponent,
    StatusBadgeComponent,
    MegaMenuComponent,
    GlobeComponent,
    AddToCartButtonComponent,
    FloatingCartComponent,
    PersianDatePipe
  ]
})
export class SharedModule { }
