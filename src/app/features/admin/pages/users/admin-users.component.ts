import { Component, OnInit } from '@angular/core';

import { AdminService, AdminUser } from '../../../../core/services/api/admin.service';

@Component({
  selector: 'app-admin-users',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div><p class="text-sm font-medium text-primary">مدیریت سامانه</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">کاربران</h1><p class="mt-2 text-sm text-gray-500">مدیریت نقش و وضعیت دسترسی کاربران</p></div>
        <button type="button" (click)="loadUsers()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">بازخوانی</button>
      </header>

      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
      <p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>

      <div class="overflow-x-auto rounded-2xl bg-white shadow-card">
        <div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری کاربران…</div>
        <table *ngIf="!loading" class="w-full min-w-[760px] text-right text-sm">
          <thead><tr class="border-b bg-gray-50 text-gray-500"><th class="p-4">نام کاربری</th><th class="p-4">کد ملی</th><th class="p-4">نقش</th><th class="p-4">وضعیت</th><th class="p-4">عملیات</th></tr></thead>
          <tbody>
            <tr *ngFor="let user of users" class="border-b last:border-0 hover:bg-gray-50/70">
              <td class="p-4"><strong class="block text-secondary">{{ user.username }}</strong><span class="text-xs text-gray-400">{{ user.email || 'ایمیل ثبت نشده' }}</span></td>
              <td class="p-4">{{ user.nationalCode || '—' }}</td>
              <td class="p-4"><div class="flex items-center gap-2"><select [value]="roleSelection[user.id] || user.roleId || normalizedRole(user.roleName)" (change)="roleSelection[user.id] = $any($event.target).value" class="rounded-lg border border-gray-300 bg-white px-3 py-2"><option *ngFor="let role of roleOptionsFor(user)" [value]="role.value">{{ role.label }}</option></select><button type="button" (click)="saveRole(user)" [disabled]="busyId === user.id" class="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-50">ذخیره</button></div></td>
              <td class="p-4"><span class="rounded-full px-3 py-1 text-xs font-bold" [class.bg-green-50]="user.isActive" [class.text-green-700]="user.isActive" [class.bg-red-50]="!user.isActive" [class.text-red-700]="!user.isActive">{{ user.isActive ? 'فعال' : 'غیرفعال' }}</span></td>
              <td class="p-4"><div class="flex flex-wrap gap-2"><button type="button" (click)="toggleStatus(user)" [disabled]="busyId === user.id" class="rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50" [class.bg-accent-danger]="user.isActive" [class.bg-accent-success]="!user.isActive">{{ user.isActive ? 'غیرفعال کردن' : 'فعال کردن' }}</button><button type="button" (click)="remove(user)" [disabled]="busyId === user.id" class="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">حذف</button></div></td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && !users.length" class="p-10 text-center text-gray-400">کاربری برای نمایش وجود ندارد.</p>
      </div>

      <div *ngIf="!loading && totalPages > 1" class="flex items-center justify-center gap-3 text-sm"><button type="button" (click)="goToPage(page - 1)" [disabled]="page === 1" class="rounded-lg border px-4 py-2 disabled:opacity-40">قبلی</button><span class="text-gray-500">صفحه {{ page }} از {{ totalPages }}</span><button type="button" (click)="goToPage(page + 1)" [disabled]="page === totalPages" class="rounded-lg border px-4 py-2 disabled:opacity-40">بعدی</button></div>
    </section>
  `
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  roleSelection: Record<string, string> = {};
  roles = [
    { value: 'Customer', label: 'مشتری' },
    { value: 'Seller', label: 'فروشنده' },
    { value: 'Admin', label: 'مدیر' }
  ];
  page = 1;
  readonly pageSize = 15;
  totalCount = 0;
  loading = true;
  busyId = '';
  errorMessage = '';
  successMessage = '';
  private readonly roleIds: Record<string, string> = {};

  constructor(private readonly adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getUsers({ pageNumber: this.page, pageSize: this.pageSize }).subscribe({
      next: (result) => {
        this.users = result.data?.items ?? [];
        this.totalCount = result.data?.totalCount ?? this.users.length;
        for (const user of this.users) {
          const role = this.normalizedRole(user.roleName);
          if (user.roleId && role) this.roleIds[role] = user.roleId;
        }
        for (const user of this.users) {
          const role = this.normalizedRole(user.roleName);
          this.roleSelection[user.id] = user.roleId ?? this.roleIds[role] ?? role;
        }
        this.loading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.loadUsers();
    }
  }

  roleOptionsFor(_user: AdminUser): Array<{ value: string; label: string }> {
    return this.roles.map((role) => ({ ...role, value: this.roleIds[role.value] ?? role.value }));
  }

  normalizedRole(roleName?: string): string {
    const value = (roleName ?? '').trim().toLowerCase();
    if (value === 'مشتری' || value === 'customer') return 'Customer';
    if (value === 'فروشنده' || value === 'seller') return 'Seller';
    if (value === 'مدیر' || value === 'admin') return 'Admin';
    return value ? roleName ?? '' : 'Customer';
  }

  saveRole(user: AdminUser): void {
    const roleId = this.roleSelection[user.id] ?? '';
    const currentRoleId = user.roleId ?? this.roleIds[this.normalizedRole(user.roleName)] ?? this.normalizedRole(user.roleName);
    if (!roleId || roleId === currentRoleId) {
      return;
    }
    this.busyId = user.id;
    this.clearMessages();
    this.adminService.updateUserRole(user.id, roleId).subscribe({
      next: (result) => {
        this.busyId = '';
        if (result.isSuccess) {
          user.roleId = roleId;
          const selectedRole = this.roles.find((role) => (this.roleIds[role.value] ?? role.value) === roleId);
          user.roleName = selectedRole?.value ?? roleId;
          this.roleSelection[user.id] = roleId;
          this.successMessage = 'نقش کاربر با موفقیت به‌روزرسانی شد.';
        } else {
          this.errorMessage = result.errorMessage ?? 'تغییر نقش انجام نشد.';
        }
      },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  remove(user: AdminUser): void {
    if (!window.confirm(`آیا از حذف کاربر «${user.username}» مطمئن هستید؟`)) return;
    this.busyId = user.id;
    this.clearMessages();
    this.adminService.deleteUser(user.id).subscribe({
      next: (result) => {
        this.busyId = '';
        if (result.isSuccess) { this.successMessage = 'کاربر حذف شد.'; this.loadUsers(); }
        else this.errorMessage = result.errorMessage ?? 'حذف کاربر انجام نشد.';
      },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  toggleStatus(user: AdminUser): void {
    this.busyId = user.id;
    this.clearMessages();
    this.adminService.toggleUserStatus(user.id, !user.isActive).subscribe({
      next: (result) => {
        this.busyId = '';
        if (result.isSuccess) {
          user.isActive = !user.isActive;
          this.successMessage = 'وضعیت کاربر با موفقیت به‌روزرسانی شد.';
        } else {
          this.errorMessage = result.errorMessage ?? 'تغییر وضعیت انجام نشد.';
        }
      },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
