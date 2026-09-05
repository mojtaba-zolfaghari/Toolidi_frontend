import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** Province entity */
export interface Province {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** City entity */
export interface City {
  id: string;
  provinceId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Registration restriction entity */
export interface RegistrationRestriction {
  id: string;
  provinceId?: string;
  cityId?: string;
  provinceName?: string;
  cityName?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Data for creating/updating a province */
export interface ProvinceData {
  name: string;
  code: string;
  isActive: boolean;
}

/** Data for creating/updating a city */
export interface CityData {
  provinceId: string;
  name: string;
  code: string;
  isActive: boolean;
}

/** Data for creating a registration restriction */
export interface RestrictionData {
  provinceId?: string;
  cityId?: string;
}

/**
 * سرویس مدیریت مکان‌ها (استان‌ها، شهرها و محدودیت‌های ثبت‌نام)
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  constructor(private readonly api: ApiService) {}

  // ─── Province Operations ────────────────────────────────────────

  /** دریافت تمام استان‌ها */
  getProvinces(): Observable<Result<Province[]>> {
    return this.api.get<Result<Province[]>>('/v1/locations/provinces');
  }

  /** ایجاد استان جدید */
  createProvince(data: ProvinceData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/admin/locations/provinces', data);
  }

  /** به‌روزرسانی استان */
  updateProvince(id: string, data: ProvinceData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/admin/locations/provinces/${id}`, data);
  }

  // ─── City Operations ────────────────────────────────────────────

  /** دریافت شهرهای یک استان */
  getCitiesByProvince(provinceId: string): Observable<Result<City[]>> {
    return this.api.get<Result<City[]>>(`/v1/locations/provinces/${provinceId}/cities`);
  }

  /** ایجاد شهر جدید */
  createCity(data: CityData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/admin/locations/cities', data);
  }

  /** به‌روزرسانی شهر */
  updateCity(id: string, data: CityData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/admin/locations/cities/${id}`, data);
  }

  // ─── Supplier Registration Restrictions ─────────────────────────

  /** دریافت محدودیت‌های ثبت‌نام فروشنده */
  getSupplierRestrictions(): Observable<Result<RegistrationRestriction[]>> {
    return this.api.get<Result<RegistrationRestriction[]>>('/v1/admin/locations/supplier-restrictions');
  }

  /** افزودن محدودیت ثبت‌نام فروشنده */
  addSupplierRestriction(data: RestrictionData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/admin/locations/supplier-restrictions', data);
  }

  /** حذف محدودیت ثبت‌نام فروشنده */
  removeSupplierRestriction(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/admin/locations/supplier-restrictions/${id}`);
  }

  // ─── Agent Registration Restrictions ────────────────────────────

  /** دریافت محدودیت‌های ثبت‌نام کارپخش */
  getAgentRestrictions(): Observable<Result<RegistrationRestriction[]>> {
    return this.api.get<Result<RegistrationRestriction[]>>('/v1/admin/locations/agent-restrictions');
  }

  /** افزودن محدودیت ثبت‌نام کارپخش */
  addAgentRestriction(data: RestrictionData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/admin/locations/agent-restrictions', data);
  }

  /** حذف محدودیت ثبت‌نام کارپخش */
  removeAgentRestriction(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/admin/locations/agent-restrictions/${id}`);
  }

  // ─── Registration Availability Checks ───────────────────────────

  /** بررسی در دسترس بودن ثبت‌نام فروشنده در یک مکان */
  isSupplierRegistrationAvailable(provinceId: string, cityId: string): Observable<Result<boolean>> {
    return this.api.get<Result<boolean>>(
      `/locations/supplier-registration-available?provinceId=${provinceId}&cityId=${cityId}`
    );
  }

  /** بررسی در دسترس بودن ثبت‌نام کارپخش در یک مکان */
  isAgentRegistrationAvailable(provinceId: string, cityId: string): Observable<Result<boolean>> {
    return this.api.get<Result<boolean>>(
      `/locations/agent-registration-available?provinceId=${provinceId}&cityId=${cityId}`
    );
  }
}
