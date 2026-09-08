import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RefundBadgeComponent } from './refund-badge.component';

describe('RefundBadgeComponent', () => {
  let component: RefundBadgeComponent;
  let fixture: ComponentFixture<RefundBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundBadgeComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RefundBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default covered to false', () => {
    expect(component.covered).toBeFalse();
  });

  it('should allow setting covered to true', () => {
    component.covered = true;
    expect(component.covered).toBeTrue();
  });
});
});
});
