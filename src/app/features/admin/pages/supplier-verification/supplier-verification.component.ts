import { Component, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

import {
  AdminSupplier,
  AdminService,
  SupplierDocument
} from '../../../../core/services/api/admin.service';
import {
  AdminDocumentRow,
  DOCUMENT_STATUS_LABELS,
  DocumentOwnerStatus,
  computeDocumentStatus,
  documentTypeLabel,
  toDocumentRow
} from '../../components/document-review/document-review.util';
import {
  DocumentReviewDialogComponent,
  DocumentReviewResult
} from '../../components/document-review/document-review-dialog.component';

interface SupplierVerificationRow extends AdminSupplier {
  docStatus: DocumentOwnerStatus;
  statusLabel: string;
  documents: AdminDocumentRow[];
}

/**
 * تأیید مدارک تولیدکنندگان توسط ادمین (TASK-FE-ADMIN-DOC-VERIFY-SUPPLIER).
 * جدول تولیدکنندگان + وضعیت مدارک؛ مدال پیش‌نمایش و تأیید/رد هر مدرک.
 */
@Component({
    selector: 'app-supplier-verification',
    templateUrl: './supplier-verification.component.html',
    styleUrls: ['./supplier-verification.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SupplierVerificationComponent implements OnInit {
  headerActions = [
    { label: 'بازخوانی', icon: '🔄', color: 'ghost', click: () => this.loadSuppliers() }
  ];

  displayedColumns = ['name', 'contactInfo', 'location', 'docStatus', 'actions'];
  dataSource = new MatTableDataSource<SupplierVerificationRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly statusLabels = DOCUMENT_STATUS_LABELS;

  loading = true;
  errorMessage = '';
  busySupplierId = '';
  statusFilter: DocumentOwnerStatus | 'all' = 'all';

  constructor(
    private readonly adminService: AdminService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  /** فهرست تولیدکنندگان + وضعیت مدارک هرکدام (به‌موازات، از API مدارک). */
  loadSuppliers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getSuppliers().pipe(
      map(res => (res.data ?? []) as AdminSupplier[]),
      switchMap(suppliers => {
        if (!suppliers.length) return of([] as SupplierVerificationRow[]);
        const docRequests = suppliers.map(supplier =>
          this.adminService.getSupplierDocuments(supplier.id).pipe(
            map((docRes: { data?: SupplierDocument[] }) => (docRes.data ?? []) as SupplierDocument[]),
            catchError(() => of([] as SupplierDocument[]))
          )
        );
        return forkJoin(docRequests).pipe(
          map(docLists => suppliers.map((supplier, i) => this.toRow(supplier, docLists[i])))
        );
      }),
      finalize(() => {
        this.loading = false;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      })
    ).subscribe({
      next: rows => {
        this.dataSource.data = rows;
      },
      error: () => {
        this.errorMessage = 'بارگذاری تولیدکنندگان ناموفق بود.';
      }
    });
  }

  get filteredData(): SupplierVerificationRow[] {
    if (this.statusFilter === 'all') return this.dataSource.data;
    return this.dataSource.data.filter(row => row.docStatus === this.statusFilter);
  }

  openReview(row: SupplierVerificationRow): void {
    if (!row.documents.length) {
      this.snackBar.open('این تولیدکننده مدرکی بارگذاری نکرده است.', 'بستن', { duration: 3000 });
      return;
    }
    const dialogRef = this.dialog.open<
      DocumentReviewDialogComponent,
      { ownerName: string; ownerSubtitle?: string; status: DocumentOwnerStatus; documents: AdminDocumentRow[] },
      DocumentReviewResult
    >(DocumentReviewDialogComponent, {
      width: '640px',
      data: {
        ownerName: row.name,
        ownerSubtitle: row.contactInfo,
        status: row.docStatus,
        documents: row.documents
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.applyDecision(row, result);
    });
  }

  /** اعمال تصمیم ادمین روی همه‌ی مدارکِ در انتظارِ تولیدکننده. */
  private applyDecision(row: SupplierVerificationRow, result: DocumentReviewResult): void {
    const pendingDocs = row.documents.filter(doc => !doc.isVerified);
    if (!pendingDocs.length) return;

    this.busySupplierId = row.id;
    const calls = pendingDocs.map(doc =>
      result.approved
        ? this.adminService.verifySupplierDocument(doc.id, result.note || undefined)
        : this.adminService.rejectSupplierDocument(doc.id, result.note || undefined)
    );

    forkJoin(calls).pipe(finalize(() => {
      this.busySupplierId = '';
    })).subscribe({
      next: () => {
        row.documents = row.documents.map(doc =>
          doc.isVerified ? doc : { ...doc, isVerified: result.approved, verificationNote: result.note || doc.verificationNote }
        );
        row.docStatus = computeDocumentStatus(row.documents);
        row.statusLabel = this.statusLabels[row.docStatus];
        this.dataSource.data = [...this.dataSource.data];
        this.snackBar.open(
          result.approved ? `مدارک «${row.name}» تأیید شد و اعلان ارسال گردید.` : `مدارک «${row.name}» رد شد.`,
          'بستن',
          { duration: 4000 }
        );
      },
      error: () => {
        this.snackBar.open('ثبت تصمیم ناموفق بود. دوباره تلاش کنید.', 'بستن', { duration: 4000 });
      }
    });
  }

  private toRow(supplier: AdminSupplier, docs: SupplierDocument[]): SupplierVerificationRow {
    const documents = (docs ?? []).map(toDocumentRow);
    const docStatus = computeDocumentStatus(documents);
    return {
      ...supplier,
      documents,
      docStatus,
      statusLabel: DOCUMENT_STATUS_LABELS[docStatus]
    };
  }

  typeLabel(doc: AdminDocumentRow): string {
    return documentTypeLabel(doc.documentType);
  }
}
