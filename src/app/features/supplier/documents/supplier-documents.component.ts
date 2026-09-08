import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { SupplierService, SupplierDocument } from '../../../core/services/api/supplier.service';
import { toDocumentFileUrl } from '../../../core/services/api/admin.service';
import { documentTypeLabel, DocumentOwnerStatus, DOCUMENT_STATUS_LABELS, computeDocumentStatus } from '../../admin/components/document-review/document-review.util';
import { getSupplierIdFromToken } from '../../../core/utils/jwt.util';
import { ACCESS_TOKEN_KEY } from '../../../core/interceptors/token.interceptor';

/** حداکثر حجم فایل مدرک (۵ مگابایت — هماهنگ با اعتبارسنجی بک‌اند) */
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** انواع مجاز فایل — هماهنگ با اعتبارسنجی بک‌اند (PDF/JPG/PNG) */
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
  selector: 'app-supplier-documents',
  templateUrl: './supplier-documents.component.html',
  styleUrls: ['./supplier-documents.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class SupplierDocumentsComponent implements OnInit {
  documents: SupplierDocument[] = [];
  loading = true;
  uploading = false;
  errorMessage = '';

  selectedFile: File | null = null;
  selectedType = 'license';

  readonly documentTypes = [
    { value: 'license', label: 'جواز کسب' },
    { value: 'national_card', label: 'کارت ملی' },
    { value: 'iban', label: 'شماره شبا' },
    { value: 'tax_certificate', label: 'گواهی مالیاتی' },
    { value: 'other', label: 'سایر' }
  ];

  readonly statusLabels = DOCUMENT_STATUS_LABELS;

  constructor(
    private readonly supplierService: SupplierService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  /** شناسه تولیدکننده از claim توکن — بدون آن آپلود/فهرست ممکن نیست. */
  private get supplierId(): string {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
    return getSupplierIdFromToken(token) ?? '';
  }

  get overallStatus(): DocumentOwnerStatus {
    return computeDocumentStatus(this.documents);
  }

  loadDocuments(): void {
    const id = this.supplierId;
    if (!id) {
      this.loading = false;
      this.errorMessage = 'شناسه تولیدکننده در توکن یافت نشد. لطفاً دوباره وارد شوید.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.supplierService.getMyDocuments(id).subscribe({
      next: (result) => {
        this.documents = result.data ?? [];
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'بارگذاری مدارک ناموفق بود.';
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage = '';

    if (!file) {
      this.selectedFile = null;
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.errorMessage = 'فقط فایل‌های PDF، JPG و PNG پذیرفته می‌شوند.';
      input.value = '';
      this.selectedFile = null;
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      this.errorMessage = 'حجم فایل نباید بیشتر از ۵ مگابایت باشد.';
      input.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  upload(): void {
    if (!this.selectedFile || this.uploading) {
      return;
    }

    this.uploading = true;
    this.errorMessage = '';
    this.supplierService.uploadDocument(this.selectedFile, this.selectedType).subscribe({
      next: () => {
        this.uploading = false;
        this.selectedFile = null;
        this.snackBar.open('مدرک با موفقیت بارگذاری شد و در انتظار بررسی است.', 'بستن', { duration: 4000 });
        this.loadDocuments();
      },
      error: (err: Error) => {
        this.uploading = false;
        this.errorMessage = err.message || 'بارگذاری فایل ناموفق بود.';
      }
    });
  }

  fileUrl(doc: SupplierDocument): string {
    return toDocumentFileUrl(doc.url);
  }

  typeLabel(doc: SupplierDocument): string {
    return documentTypeLabel(doc.documentType);
  }

  statusClass(doc: SupplierDocument): string {
    if (doc.isVerified) return 'doc-status--verified';
    return doc.verificationNote ? 'doc-status--rejected' : 'doc-status--pending';
  }

  statusLabel(doc: SupplierDocument): string {
    if (doc.isVerified) return DOCUMENT_STATUS_LABELS.verified;
    return doc.verificationNote ? DOCUMENT_STATUS_LABELS.rejected : DOCUMENT_STATUS_LABELS.pending;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} بایت`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} کیلوبایت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`;
  }
}
