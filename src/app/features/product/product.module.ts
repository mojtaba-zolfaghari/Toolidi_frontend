import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { ProductDetailComponent } from './product-detail.component';
import { RefundProtectionComponent } from './refund-protection/refund-protection.component';
import { ProductInfoSections } from './product-info/product-info.models';
import { RefundPolicySummaryComponent } from './product-info/refund-policy-summary.component';
import { CertificationsSectionComponent } from './product-info/certifications-section.component';
import { TieredPricingBlockComponent } from './product-info/tiered-pricing-block.component';
import { ShippingInfoBlockComponent } from './product-info/shipping-info-block.component';
import { QnaSectionComponent } from './product-info/qna-section.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: 'slug/:slug', component: ProductDetailComponent, data: { bySlug: true } },
  { path: ':id', component: ProductDetailComponent }
];

@NgModule({
  declarations: [
    ProductDetailComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatIconModule,
    RefundProtectionComponent,
    RefundPolicySummaryComponent,
    CertificationsSectionComponent,
    TieredPricingBlockComponent,
    ShippingInfoBlockComponent,
    QnaSectionComponent
  ]
})
export class ProductModule { }
