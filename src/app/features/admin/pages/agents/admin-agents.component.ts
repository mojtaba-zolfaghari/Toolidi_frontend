import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminAgent, AdminService, CreateAgentData } from '../../../../core/services/api/admin.service';
import { Result } from '../../../../core/models/api-response.model';
import { TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { LocationService, Province, City } from '../../../../core/services/api/location.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

@Component({
    selector: 'app-admin-agents', templateUrl: './admin-agents.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AdminAgentsComponent implements OnInit {
  headerActions = [
    { label: 'افزودن کارپخش', icon: '➕', color: 'primary', click: () => this.openCreate() },
    { label: 'بازخوانی', icon: '🔄', color: 'ghost', click: () => this.loadAgents() }
  ];

  agents: AdminAgent[] = []; activeCount = 0; verifiedCount = 0; loading = true; errorMessage = ''; successMessage = '';
  agentForm: FormGroup; formOpen = false; editingAgent: AdminAgent | null = null; saving = false; formError = ''; busyId = '';
  provinces: Province[] = []; cities: City[] = []; loadingCities = false;
  tableColumns: TableColumn[] = [
    { key: 'fullName', label: 'نام کارپخش', sortable: true }, { key: 'nationalId', label: 'کد ملی' }, { key: 'phone', label: 'شماره تماس' }, { key: 'city', label: 'شهر' },
    { key: 'isVerified', label: 'تأیید شده', type: 'badge', badgeMap: { 'true': { label: 'بله', color: 'data-table__badge--success' }, 'false': { label: 'خیر', color: 'data-table__badge--warning' } } }, { key: 'status', label: 'وضعیت' }
  ];
  tableActions: TableAction[] = [{ label: 'ویرایش', icon: '✏️', color: 'primary', click: row => this.openEdit(row) }, { label: 'حذف', icon: '🗑️', color: 'danger', click: row => this.remove(row) }];

  constructor(private readonly fb: FormBuilder, private readonly adminService: AdminService, private readonly locationService: LocationService, private readonly confirm: ConfirmService) {
    this.agentForm = this.fb.group({ fullName: ['', Validators.required], nationalId: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]], phone: ['', [Validators.required, Validators.pattern(/^09\d{9}$/)]], email: ['', [Validators.required, Validators.email]], provinceId: ['', Validators.required], cityId: ['', Validators.required], province: [''], city: [''], vehicleType: [''], vehiclePlate: [''] });
  }
  ngOnInit(): void { this.loadAgents(); this.locationService.getProvinces().subscribe(result => this.provinces = result.data ?? []); }
  onProvinceChange(): void { const id = this.agentForm.get('provinceId')?.value; this.cities = []; this.agentForm.patchValue({ cityId: '', city: '' }); if (!id) return; this.loadingCities = true; this.locationService.getCitiesByProvince(id).subscribe({ next: r => { this.cities = r.data ?? []; this.loadingCities = false; }, error: () => this.loadingCities = false }); }
  onCityChange(): void { const id = this.agentForm.get('cityId')?.value; const city = this.cities.find(x => String(x.id) === String(id)); const province = this.provinces.find(x => String(x.id) === String(this.agentForm.get('provinceId')?.value)); this.agentForm.patchValue({ city: city?.name ?? '', province: province?.name ?? '' }, { emitEvent: false }); }
  loadAgents(): void { this.loading = true; this.adminService.getAgents().subscribe({ next: r => { this.agents = r.data ?? []; this.activeCount = this.agents.filter(a => a.isActive).length; this.verifiedCount = this.agents.filter(a => a.isVerified).length; this.loading = false; }, error: e => { this.errorMessage = e.message; this.loading = false; } }); }
  openCreate(): void { this.agentForm.reset(); this.cities = []; this.formError = ''; this.editingAgent = null; this.formOpen = true; }
  openEdit(agent: AdminAgent): void {
    this.editingAgent = agent;
    this.agentForm.patchValue(agent);
    this.formError = '';
    this.formOpen = true;
    // Prefill استان/شهر selects by matching names so the required validators pass.
    const province = this.provinces.find(p => p.name === agent.province);
    this.agentForm.patchValue({ provinceId: province?.id ?? '', cityId: '' });
    this.cities = [];
    if (province) {
      this.loadingCities = true;
      this.locationService.getCitiesByProvince(province.id).subscribe({
        next: r => {
          this.cities = r.data ?? [];
          this.loadingCities = false;
          const city = this.cities.find(c => c.name === agent.city);
          if (city) this.agentForm.patchValue({ cityId: city.id });
        },
        error: () => this.loadingCities = false
      });
    }
  }
  closeForm(): void { if (!this.saving) this.formOpen = false; }
  saveAgent(): void { this.agentForm.markAllAsTouched(); if (this.agentForm.invalid) { this.formError = 'لطفاً همه فیلدهای الزامی را با فرمت صحیح تکمیل کنید.'; return; } this.saving = true; const raw = this.agentForm.getRawValue(); const data: CreateAgentData = { fullName: String(raw.fullName).trim(), nationalId: String(raw.nationalId).trim(), phone: String(raw.phone).trim(), email: String(raw.email).trim(), city: String(raw.city).trim(), province: String(raw.province).trim(), vehicleType: raw.vehicleType ? String(raw.vehicleType).trim() : null, vehiclePlate: raw.vehiclePlate ? String(raw.vehiclePlate).trim() : null }; const request = (this.editingAgent ? this.adminService.updateAgent(this.editingAgent.id, data) : this.adminService.createAgent(data)) as Observable<Result<unknown>>; request.subscribe({ next: r => { this.saving = false; if (r.isSuccess) { this.formOpen = false; this.successMessage = 'اطلاعات با موفقیت ذخیره شد.'; this.loadAgents(); } else this.formError = r.errorMessage ?? 'ذخیره انجام نشد.'; }, error: e => { this.saving = false; this.formError = e.message; } }); }
  remove(agent: AdminAgent): void { this.confirm.confirmDanger(`آیا از حذف کارپخش «${agent.fullName}» مطمئن هستید؟`).subscribe(ok => { if (!ok) return; this.busyId = agent.id; this.adminService.deleteAgent(agent.id).subscribe(() => { this.busyId = ''; this.loadAgents(); }); }); }
}