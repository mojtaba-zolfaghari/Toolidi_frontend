import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { LocationService, Province, City } from '../../../core/services/api/location.service';

@Component({
    selector: 'app-location-selector',
    templateUrl: './location-selector.component.html',
    styles: [`
    :host { display: block; }

    .location-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .location-field {
      display: block;
    }

    .location-field__label {
      display: block;
      margin-bottom: 0.25rem;
      color: #1B2A4A;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .location-field__select {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      background: #fff;
      padding: 0.625rem 1rem;
      color: #1B2A4A;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;

      &:focus {
        border-color: var(--mat-sys-primary, #6C3FC5);
        box-shadow: 0 0 0 3px rgba(108, 63, 197, 0.15);
      }

      &:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
      }
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LocationSelectorComponent implements OnInit {
  @Input() formGroup?: FormGroup;
  @Input() provinceControl = 'provinceId';
  @Input() cityControl = 'cityId';
  @Input() provinceLabel = 'استان';
  @Input() cityLabel = 'شهرستان';
  @Input() required = true;
  @Output() locationChange = new EventEmitter<{ provinceId: string; cityId: string }>();

  provinces: Province[] = [];
  cities: City[] = [];
  loadingProvinces = false;
  loadingCities = false;

  constructor(
    private readonly locationService: LocationService,
    private readonly controlContainer: ControlContainer
  ) {}

  ngOnInit(): void {
    this.loadProvinces();
    const provinceId = this.group.get(this.provinceControl)?.value;
    if (provinceId) this.loadCities(provinceId);
  }

  get group(): FormGroup {
    return this.formGroup ?? this.controlContainer.control as FormGroup;
  }

  onProvinceChange(): void {
    const provinceId = String(this.group.get(this.provinceControl)?.value ?? '');
    this.cities = [];
    this.group.get(this.cityControl)?.setValue('');
    this.group.get(this.cityControl)?.disable({ emitEvent: false });
    if (!provinceId) {
      this.emitChange();
      return;
    }
    this.loadCities(provinceId);
  }

  onCityChange(): void { this.emitChange(); }

  private loadProvinces(): void {
    this.loadingProvinces = true;
    this.locationService.getProvinces().subscribe({
      next: result => {
        this.provinces = (result.data ?? []).filter(item => item.isActive !== false);
        this.loadingProvinces = false;
      },
      error: () => { this.loadingProvinces = false; }
    });
  }

  private loadCities(provinceId: string): void {
    this.loadingCities = true;
    this.locationService.getCitiesByProvince(provinceId).subscribe({
      next: result => {
        this.cities = (result.data ?? []).filter(item => item.isActive !== false);
        this.group.get(this.cityControl)?.enable({ emitEvent: false });
        this.loadingCities = false;
        this.emitChange();
      },
      error: () => {
        this.group.get(this.cityControl)?.enable({ emitEvent: false });
        this.loadingCities = false;
      }
    });
  }

  private emitChange(): void {
    this.locationChange.emit({
      provinceId: String(this.group.get(this.provinceControl)?.value ?? ''),
      cityId: String(this.group.get(this.cityControl)?.value ?? '')
    });
  }
}
