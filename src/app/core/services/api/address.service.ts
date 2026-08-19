import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** آدرس کاربر */
export interface Address {
  id: string;
  userId: string;
  addressType: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

/** داده‌ی ایجاد یا ویرایش آدرس */
export interface AddressData {
  addressType: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  phoneNumber?: string;
}

/** سرویس آدرس‌های کاربر جاری */
@Injectable({ providedIn: 'root' })
export class AddressService {
  constructor(private readonly api: ApiService) {}

  /** دریافت آدرس‌های کاربر جاری */
  getAddresses(): Observable<Result<Address[]>> {
    return this.api.get<Result<Address[]>>('/Profile/addresses');
  }

  /** افزودن آدرس */
  addAddress(data: AddressData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/Profile/addresses', data);
  }

  /** ویرایش آدرس */
  updateAddress(id: string, data: Partial<AddressData>): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/Profile/addresses/${id}`, data);
  }

  /** حذف آدرس */
  deleteAddress(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/Profile/addresses/${id}`);
  }
}
