import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'image' | 'date' | 'number' | 'currency' | 'flag' | 'actions';
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  badgeMap?: Record<string, { label: string; color: string }>;
}

export interface TableAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success';
  click: (row: any) => void;
  visible?: (row: any) => boolean;
}

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading = false;
  @Input() searchPlaceholder = 'جستجو...';
  @Input() emptyMessage = 'داده‌ای موجود نیست';
  @Input() emptyIcon = '📋';
  @Input() pageSize = 20;
  @Input() selectable = false;
  @Input() actions: TableAction[] = [];
  @Input() totalItems = 0;

  @Output() search = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() sort = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

  searchTerm = '';
  currentPage = 1;
  selectedRows = new Set<any>();
  sortKey = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  totalPages = 1;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize'] || changes['totalItems']) {
      this.totalPages = this.totalItems > 0 ? Math.ceil(this.totalItems / this.pageSize) : Math.ceil(this.data.length / this.pageSize);
      if (this.currentPage > this.totalPages) {
        this.currentPage = 1;
      }
    }
  }

  /** Column ids for MatTable: optional select column + data columns + optional actions column. */
  get displayedColumns(): string[] {
    return [
      ...(this.selectable ? ['select'] : []),
      ...this.columns.map(c => c.key),
      ...(this.actions.length > 0 ? ['actions'] : [])
    ];
  }

  get paginatedData(): any[] {
    if (this.totalItems > 0) {
      return this.data;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(start, start + this.pageSize);
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.search.emit(term);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }

  toggleSort(column: TableColumn): void {
    if (!column.sortable) return;
    if (this.sortKey === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = column.key;
      this.sortDirection = 'asc';
    }
    this.sort.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  /** MatSort adapter — keeps the existing public sort EventEmitter contract. */
  onSortChange(event: { active: string; direction: string }): void {
    if (!event.direction) {
      this.sortKey = '';
      return;
    }
    this.sortKey = event.active;
    this.sortDirection = event.direction as 'asc' | 'desc';
    this.sort.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  /** MatPaginator adapter — keeps the existing pageChange EventEmitter contract. */
  onPageChange(event: { pageIndex: number }): void {
    this.currentPage = event.pageIndex + 1;
    this.pageChange.emit(this.currentPage);
  }

  toggleRow(row: any): void {
    if (this.selectedRows.has(row)) {
      this.selectedRows.delete(row);
    } else {
      this.selectedRows.add(row);
    }
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  toggleAll(): void {
    if (this.selectedRows.size === this.paginatedData.length) {
      this.selectedRows.clear();
    } else {
      this.paginatedData.forEach(r => this.selectedRows.add(r));
    }
    this.selectionChange.emit(Array.from(this.selectedRows));
  }

  isSelected(row: any): boolean {
    return this.selectedRows.has(row);
  }

  isAllSelected(): boolean {
    return this.paginatedData.length > 0 && this.selectedRows.size === this.paginatedData.length;
  }

  getCellValue(row: any, column: TableColumn): any {
    const keys = column.key.split('.');
    let value = row;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  }

  getBadgeClass(row: any, column: TableColumn): string {
    const value = this.getCellValue(row, column);
    if (column.badgeMap && value !== undefined && value !== null) {
      return column.badgeMap[String(value)]?.color || 'bg-gray-100 text-gray-600';
    }
    return 'bg-gray-100 text-gray-600';
  }

  getBadgeLabel(row: any, column: TableColumn): string {
    const value = this.getCellValue(row, column);
    if (column.badgeMap && value !== undefined && value !== null) {
      return column.badgeMap[String(value)]?.label || String(value);
    }
    return value === false || value === 0 ? String(value) : (value || '-');
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
