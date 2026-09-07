import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';

import {
  AdminSeller,
  AdminService,
  SellerDocument
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

interface SellerVerificationRow extends AdminSeller {
  docStatus: DocumentOwnerStatus;
  statusLabel: string;
  documents: AdminDocumentRow[];
}

/**
 * تأیید مدارک فروشندگان توسط ادمین (TASK-FE-ADMIN-DOC-VERIFY-SELLER).
 * جدول فروشندگان + وضعیت مدارک؛ مدال پیش‌نمایش و تأیید/رد هر مدرک.
 */
@Component({
  selector: 'app-seller-verification',
  templateUrl: './seller-verification.component.html',
  styleUrls: ['./seller-verification.component.scss']
})
export class SellerVerificationComponent implements OnInit {
  headerActions = [
    { label: 'بازخوانی', icon: '🔄', color: 'ghost', click: () => this.loadSellers() }
  ];

  displayedColumns = ['companyName', 'contactName', 'city', 'docStatus', 'actions'];
  dataSource = new MatTableDataSource<SellerVerificationRow>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly statusLabels = DOCUMENT_STATUS_LABELS;

  loading = true;
  errorMessage = '';
  busySellerId = '';
  statusFilter: DocumentOwnerStatus | 'all' = 'all';

  constructor(
    private readonly adminService: AdminService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSellers();
  }

  /** فهرست فروشندگان + وضعیت مدارک هرکدام (به‌موازات، از API مدارک). */
  loadSellers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminService.getSellers({ page: 1, pageSize: 100 }).pipe(
      switchMap(res => {
        const sellers = res.data?.items ?? [];
        if (!sellers.length) return of([] as SellerVerificationRow[]);
        const docRequests = sellers.map(seller =>
          this.adminService.getSellerDocuments(seller.id).pipe(
            map((docRes: { data?: SellerDocument[] }) => (docRes.data ?? []) as SellerDocument[]),
            catchError(() => of([] as SellerDocument[]))
          )
        );
        return forkJoin(docRequests).pipe(
          map(docLists => sellers.map((seller, i) => this.toRow(seller, docLists[i])))
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
        this.errorMessage = 'بارگذاری فروشندگان ناموفق بود.';
      }
    });
  }

  get filteredData(): SellerVerificationRow[] {
    if (this.statusFilter === 'all') return this.dataSource.data;
    return this.dataSource.data.filter(row => row.docStatus === this.statusFilter);
  }

  openReview(row: SellerVerificationRow): void {
    if (!row.documents.length) {
      this.snackBar.open('این فروشنده مدرکی بارگذاری نکرده است.', 'بستن', { duration: 3000 });
      return;
    }
    const dialogRef = this.dialog.open<
      DocumentReviewDialogComponent,
      { ownerName: string; ownerSubtitle?: string; status: DocumentOwnerStatus; documents: AdminDocumentRow[] },
      DocumentReviewResult
    >(DocumentReviewDialogComponent, {
      width: '640px',
      data: {
        ownerName: row.companyName,
        ownerSubtitle: row.contactName,
        status: row.docStatus,
        documents: row.documents
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.applyDecision(row, result);
    });
  }

  /** اعمال تصمیم ادمین روی همه‌ی مدارکِ در انتظارِ فروشنده. */
  private applyDecision(row: SellerVerificationRow, result: DocumentReviewResult): void {
    const pendingDocs = row.documents.filter(doc => !doc.isVerified);
    if (!pendingDocs.length) return;

    this.busySellerId = row.id;
    const calls = pendingDocs.map(doc =>
      result.approved
        ? this.adminService.verifySellerDocument(doc.id, result.note || undefined)
        : this.adminService.rejectSellerDocument(doc.id, result.note || undefined)
    );

    forkJoin(calls).pipe(finalize(() => {
      this.busySellerId = '';
    })).subscribe({
      next: () => {
        row.documents = row.documents.map(doc =>
          doc.isVerified ? doc : { ...doc, isVerified: result.approved, verificationNote: result.note || doc.verificationNote }
        );
        row.docStatus = computeDocumentStatus(row.documents);
        row.statusLabel = this.statusLabels[row.docStatus];
        this.dataSource.data = [...this.dataSource.data];
        this.snackBar.open(
          result.approved ? `مدارک «${row.companyName}» تأیید شد و اعلان ارسال گردید.` : `مدارک «${row.companyName}» رد شد.`,
          'بستن',
          { duration: 4000 }
        );
      },
      error: () => {
        this.snackBar.open('ثبت تصمیم ناموفق بود. دوباره تلاش کنید.', 'بستن', { duration: 4000 });
      }
    });
  }

  private toRow(seller: AdminSeller, docs: SellerDocument[]): SellerVerificationRow {
    const documents = (docs ?? [])
      .filter(doc => !!doc.id)
      .map(doc => toDocumentRow({
        id: doc.id as string,
        documentType: doc.documentType ?? doc.type ?? 'other',
        fileName: doc.fileName ?? doc.name,
        url: doc.url,
        contentType: doc.contentType ?? '',
        fileSizeBytes: doc.fileSizeBytes ?? 0,
        isVerified: !!doc.isVerified,
        verificationNote: doc.verificationNote,
        createdAt: doc.createdAt ?? ''
      }));
    const docStatus = computeDocumentStatus(documents);
    return {
      ...seller,
      documents,
      docStatus,
      statusLabel: DOCUMENT_STATUS_LABELS[docStatus]
    };
  }

  typeLabel(doc: AdminDocumentRow): string {
    return documentTypeLabel(doc.documentType);
  }
}
