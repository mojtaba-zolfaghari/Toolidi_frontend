import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


import { PlaceholderComponent } from './placeholder/placeholder.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { PaginationComponent } from './components/pagination/pagination.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { BarChartComponent } from './components/bar-chart/bar-chart.component';
import { MegaMenuComponent } from './mega-menu/mega-menu.component';
import { GlobeComponent } from './globe/globe.component';
import { AddToCartButtonComponent } from './components/add-to-cart-button/add-to-cart-button.component';
import { FloatingCartComponent } from './components/floating-cart/floating-cart.component';
import { TrackingTimelineComponent } from './components/tracking-timeline/tracking-timeline.component';
import { EstimatedDeliveryComponent } from './components/estimated-delivery/estimated-delivery.component';
import { BottomNavComponent } from './components/bottom-nav/bottom-nav.component';
import { SkeletonComponent, SkeletonProductGridComponent, SkeletonTableComponent } from './components/skeleton/skeleton.component';
import { PersianDatePipe } from './persian-date.pipe';
import { PersianNumberPipe } from './persian-number.pipe';
import { EmptyStateComponent, EmptyCartComponent, EmptyOrdersComponent, EmptySearchComponent } from './components/empty-state/empty-state.component';
import { ProductQuickViewComponent, GlobalErrorComponent } from './components/product-quick-view/product-quick-view.component';
import { PersianDatePickerComponent } from './components/persian-date-picker/persian-date-picker.component';
import { ProductGalleryComponent } from './components/product-gallery/product-gallery.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ImageGalleryComponent } from './components/image-gallery/image-gallery.component';
import { FieldErrorComponent } from './components/form-validation/form-validation.component';
import { LocationSelectorComponent } from './components/location-selector/location-selector.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { RefundBadgeComponent } from './components/refund-badge/refund-badge.component';
import { SearchAutocompleteComponent } from './components/search-autocomplete/search-autocomplete.component';
import { IranMapComponent } from './components/iran-map/iran-map.component';

@NgModule({
  declarations: [
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent,
    SpinnerComponent,
    BarChartComponent,
    MegaMenuComponent,
    GlobeComponent,
    AddToCartButtonComponent,
    FloatingCartComponent,
    TrackingTimelineComponent,
    EstimatedDeliveryComponent,
    BottomNavComponent,
    SkeletonComponent,
    SkeletonProductGridComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    EmptyCartComponent,
    EmptyOrdersComponent,
    EmptySearchComponent,
    ProductQuickViewComponent,
    PersianDatePickerComponent,
    ProductGalleryComponent,
    LoadingSpinnerComponent,
    ImageGalleryComponent,
    FieldErrorComponent,
    LocationSelectorComponent,
    StatusBadgeComponent,
    SearchAutocompleteComponent,
    IranMapComponent,
  ],

  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PersianDatePipe,
    PersianNumberPipe,
    RouterModule,
    RefundBadgeComponent,
  ],
  exports: [
    CommonModule,
    PersianDatePipe,
    PersianNumberPipe,
    PlaceholderComponent,
    ProductCardComponent,
    PaginationComponent,
    SpinnerComponent,
    BarChartComponent,
    MegaMenuComponent,
    GlobeComponent,
    AddToCartButtonComponent,
    FloatingCartComponent,
    TrackingTimelineComponent,
    EstimatedDeliveryComponent,
    BottomNavComponent,
    SkeletonComponent,
    SkeletonProductGridComponent,
    SkeletonTableComponent,
    EmptyStateComponent,
    EmptyCartComponent,
    EmptyOrdersComponent,
    EmptySearchComponent,
    ProductQuickViewComponent,
    PersianDatePickerComponent,
    ProductGalleryComponent,
    LoadingSpinnerComponent,
    ImageGalleryComponent,
    FieldErrorComponent,
    LocationSelectorComponent,
    StatusBadgeComponent,
    SearchAutocompleteComponent,
    IranMapComponent,
    RefundBadgeComponent,
  ]
})
export class SharedModule { }
