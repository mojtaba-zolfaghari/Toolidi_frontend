import {
  Directive,
  Input,
  ViewContainerRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  OnInit,
  OnDestroy,
  NgModule,
} from '@angular/core';

import { RefundBadgeComponent } from './refund-badge.component';

/**
 * دایرکتیو پوششی که درون المنتทำการ로 RefundBadgeComponent را رندر می‌کند.
 *
 * TODO(task: TASK-FE-PRODUCT-CARD-REFUND-DISPLAY):
 * - رنگ سبز وقتی پوشش فعال است، خاکستری وقتی غیرفعال
 * - استفاده از EnvironmentInjector به جای ComponentFactoryResolver
 */
@Directive({
  selector: '[appRefundBadge]',
})
export class RefundBadgeDirective implements OnInit, OnDestroy {
  @Input('appRefundBadge') covered = false;

  private componentRef: ComponentRef<RefundBadgeComponent> | null = null;

  constructor(
    private readonly viewContainerRef: ViewContainerRef,
    private readonly injector: EnvironmentInjector,
  ) {}

  ngOnInit(): void {
    this.componentRef = createComponent(RefundBadgeComponent, {
      environmentInjector: this.injector,
    });
    this.componentRef.instance.covered = this.covered;
  }

  ngOnDestroy(): void {
    this.componentRef?.destroy();
  }
}

@NgModule({
  declarations: [RefundBadgeDirective],
  exports: [RefundBadgeDirective],
})
export class RefundBadgeDirectiveModule { }
