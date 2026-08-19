import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlaceholderComponent } from './placeholder/placeholder.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { PaginationComponent } from './components/pagination/pagination.component';

@NgModule({
  declarations: [
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent
  ],
  imports: [CommonModule],
  exports: [
    CommonModule,
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent
  ]
})
export class SharedModule { }
