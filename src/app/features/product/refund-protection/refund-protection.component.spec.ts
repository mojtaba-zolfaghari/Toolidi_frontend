import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RefundProtectionComponent } from './refund-protection.component';

describe('RefundProtectionComponent', () => {
  let component: RefundProtectionComponent;
  let fixture: ComponentFixture<RefundProtectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundProtectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RefundProtectionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('hasAnyCoverage should be false when eligibility is null', () => {
    component.eligibility = null;
    expect(component.hasAnyCoverage).toBe(false);
  });

  it('hasAnyCoverage should be false when all levels are false', () => {
    component.eligibility = { supplierVerified: false, sellerVerified: false, platformGuarantee: false };
    expect(component.hasAnyCoverage).toBe(false);
  });

  it('hasAnyCoverage should be true when any level is true', () => {
    component.eligibility = { supplierVerified: true, sellerVerified: false, platformGuarantee: false };
    expect(component.hasAnyCoverage).toBe(true);
  });

  it('hasAnyCoverage should be true when supplier is verified', () => {
    component.eligibility = { supplierVerified: true };
    expect(component.hasAnyCoverage).toBe(true);
  });

  it('hasAnyCoverage should be true when seller is verified', () => {
    component.eligibility = { sellerVerified: true };
    expect(component.hasAnyCoverage).toBe(true);
  });

  it('hasAnyCoverage should be true when platform guarantee is active', () => {
    component.eligibility = { platformGuarantee: true };
    expect(component.hasAnyCoverage).toBe(true);
  });

  it('should navigate to protected doc URL on navigateToDoc', () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
    component['router'] = routerSpy;
    component.navigateToDoc();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/help/refund-protection');
  });
});
