import { Component, OnInit } from '@angular/core';

import { ConfirmService } from '../../../../shared/services/confirm.service';
import {
  AdminService,
  AdminUser,
  AdminUserAddress,
  AdminUserOrder,
} from '../../../../core/services/api/admin.service';
import { TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';

/** تب‌های مودال جزئیات کاربر */
type UserDetailTab = 'info' | 'orders' | 'addresses';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html'
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  roleSelection: Record<string, string> = {};
  selectedUser: AdminUser | null = null;

  roles = [
    { value: 'Customer', label: 'مشتری' },
    { value: 'Seller', label: 'فروشنده' },
    { value: 'Admin', label: 'مدیر' }
  ];

  roleFilterOptions = [
    { value: '', label: 'همه نقش‌ها' },
    { value: 'Customer', label: 'مشتری' },
    { value: 'Seller', label: 'فروشنده' },
    { value: 'Admin', label: 'مدیر' }
  ];

  statusFilterOptions = [
    { value: '', label: 'همه وضعیت‌ها' },
    { value: 'Active', label: 'فعال' },
    { value: 'Inactive', label: 'غیرفعال' }
  ];

  tableColumns: TableColumn[] = [
    { key: 'username', label: 'نام کاربری', sortable: true },
    { key: 'nationalCode', label: 'کد ملی' },
    { key: 'email', label: 'ایمیل' },
    { key: 'mobileNumber', label: 'موبایل' },
    { key: 'roleName', label: 'نقش', type: 'badge', badgeMap: {
      'Customer': { label: 'مشتری', color: 'bg-blue-100 text-blue-700' },
      'Seller': { label: 'فروشنده', color: 'bg-amber-100 text-amber-700' },
      'Admin': { label: 'مدیر', color: 'bg-purple-100 text-purple-700' }
    }},
    { key: 'isActive', label: 'وضعیت', type: 'badge', badgeMap: {
      'true': { label: 'فعال', color: 'bg-green-100 text-green-700' },
      'false': { label: 'غیرفعال', color: 'bg-red-100 text-red-700' }
    }},
    { key: 'createdAt', label: 'تاریخ عضویت', type: 'date' }
  ];

  tableActions: TableAction[] = [
    { label: 'جزئیات', icon: '👁️', color: 'primary', click: (row) => this.viewUser(row) },
    { label: 'فعال/غیرفعال', icon: '🔄', color: 'warning', click: (row) => this.toggleStatus(row) },
    { label: 'حذف', icon: '🗑️', color: 'danger', click: (row) => this.remove(row) }
  ];

  searchTerm = '';
  filterRole = '';
  filterStatus = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // ── مودال جزئیات کاربر ──
  detailTab: UserDetailTab = 'info';
  detailOrders: AdminUserOrder[] = [];
  detailOrdersTotal = 0;
  detailOrdersPage = 1;
  detailOrdersLoading = false;
  detailOrdersError = '';
  detailAddresses: AdminUserAddress[] = [];
  detailAddressesLoading = false;
  detailAddressesError = '';

  page = 1;
  readonly pageSize = 15;
  totalCount = 0;
  activeCount = 0;
  sellerCount = 0;
  adminCount = 0;
  loading = true;
  busyId = '';
  errorMessage = '';
  successMessage = '';
  private readonly roleIds: Record<string, string> = {};

  constructor(private readonly adminService: AdminService, private readonly confirm: ConfirmService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    // Backend GetUsersQuery binds: page, pageSize, role, status, search.
    this.adminService.getUsers({
      page: this.page,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      role: this.filterRole || undefined,
      status: this.filterStatus === 'Active' ? 'Active' : this.filterStatus === 'Inactive' ? 'Inactive' : undefined
    }).subscribe({
      next: (result) => {
        this.users = result.data?.items ?? [];
        this.totalCount = result.data?.totalCount ?? this.users.length;
        this.updateCounts();
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

  private updateCounts(): void {
    this.activeCount = this.users.filter(u => u.isActive).length;
    this.sellerCount = this.users.filter(u => this.normalizedRole(u.roleName) === 'Seller').length;
    this.adminCount = this.users.filter(u => this.normalizedRole(u.roleName) === 'Admin').length;
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.loadUsers();
    }, 400);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.totalCount / this.pageSize)) {
      this.page = page;
      this.loadUsers();
    }
  }

  normalizedRole(roleName?: string): string {
    const value = (roleName ?? '').trim().toLowerCase();
    if (value === 'مشتری' || value === 'customer') return 'Customer';
    if (value === 'فروشنده' || value === 'seller') return 'Seller';
    if (value === 'مدیر' || value === 'admin') return 'Admin';
    return value ? roleName ?? '' : 'Customer';
  }

  getRoleLabel(roleName?: string): string {
    const normalized = this.normalizedRole(roleName);
    return this.roles.find(r => r.value === normalized)?.label ?? roleName ?? '—';
  }

  viewUser(user: AdminUser): void {
    this.selectedUser = user;
    this.detailTab = 'info';
    this.detailOrders = [];
    this.detailOrdersTotal = 0;
    this.detailOrdersPage = 1;
    this.detailOrdersError = '';
    this.detailAddresses = [];
    this.detailAddressesError = '';
    // Orders are the most relevant tab for every role; addresses lazy-load on click.
    this.selectDetailTab('orders');
  }

  selectDetailTab(tab: UserDetailTab): void {
    this.detailTab = tab;
    if (tab === 'orders' && this.selectedUser && this.detailOrders.length === 0 && !this.detailOrdersLoading) {
      this.loadUserOrders();
    }
    if (tab === 'addresses' && this.selectedUser && this.detailAddresses.length === 0 && !this.detailAddressesLoading) {
      this.loadUserAddresses();
    }
  }

  loadUserOrders(): void {
    if (!this.selectedUser) return;
    this.detailOrdersLoading = true;
    this.detailOrdersError = '';
    this.adminService.getUserOrders(this.selectedUser.id, this.detailOrdersPage, 5).subscribe({
      next: (result) => {
        this.detailOrders = result.data?.items ?? [];
        this.detailOrdersTotal = result.data?.totalCount ?? 0;
        this.detailOrdersLoading = false;
      },
      error: (error: Error) => { this.detailOrdersLoading = false; this.detailOrdersError = error.message; }
    });
  }

  changeDetailOrdersPage(delta: number): void {
    const maxPage = Math.max(1, Math.ceil(this.detailOrdersTotal / 5));
    const next = this.detailOrdersPage + delta;
    if (next < 1 || next > maxPage) return;
    this.detailOrdersPage = next;
    this.loadUserOrders();
  }

  loadUserAddresses(): void {
    if (!this.selectedUser) return;
    this.detailAddressesLoading = true;
    this.detailAddressesError = '';
    this.adminService.getUserAddresses(this.selectedUser.id).subscribe({
      next: (result) => {
        this.detailAddresses = result.data ?? [];
        this.detailAddressesLoading = false;
      },
      error: (error: Error) => { this.detailAddressesLoading = false; this.detailAddressesError = error.message; }
    });
  }

  closeUserDetail(): void {
    this.selectedUser = null;
  }

  orderStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'در انتظار', Processing: 'در حال پردازش', Shipped: 'ارسال شده',
      Delivered: 'تحویل شده', Cancelled: 'لغو شده', Returned: 'مرجوع شده'
    };
    return map[status] ?? status;
  }

  paymentStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Pending: 'در انتظار پرداخت', Paid: 'پرداخت شده', Failed: 'ناموفق',
      Refunded: 'بازگشت داده شده', Cancelled: 'لغو شده'
    };
    return map[status] ?? status;
  }

  saveRole(user: AdminUser): void {
    const roleId = this.roleSelection[user.id] ?? '';
    const currentRoleId = user.roleId ?? this.roleIds[this.normalizedRole(user.roleName)] ?? this.normalizedRole(user.roleName);
    if (!roleId || roleId === currentRoleId) return;

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
    this.confirm.confirmDanger(`آیا از حذف کاربر «${user.username}» مطمئن هستید؟`).subscribe(ok => {
      if (!ok) return;
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
