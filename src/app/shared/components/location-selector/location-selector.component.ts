import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { LocationService, Province, City } from '../../../core/services/api/location.service';

@Component({
  selector: 'app-location-selector',
  templateUrl: './location-selector.component.html'
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
