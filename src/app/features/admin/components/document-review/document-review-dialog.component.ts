import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  AdminDocumentRow,
  DOCUMENT_STATUS_LABELS,
  DocumentOwnerStatus,
  documentTypeLabel,
  formatFileSize
} from './document-review.util';

/** نتیجه‌ی تصمیم ادمین در مدال بازبینی مدارک. */
export interface DocumentReviewResult {
  approved: boolean;
  note: string;
}

export interface DocumentReviewDialogData {
  ownerName: string;
  ownerSubtitle?: string;
  status: DocumentOwnerStatus;
  documents: AdminDocumentRow[];
}

/**
 * مدال بازبینی مدارک (TASK-FE-ADMIN-DOC-VERIFY-SELLER / -SUPPLIER):
 * پیش‌نمایش تصویر یا لینک PDF برای هر مدرک + دکمه‌های تأیید/رد با ورود دلیل.
 */
@Component({
    selector: 'app-document-review-dialog',
    templateUrl: './document-review-dialog.component.html',
    styleUrls: ['./document-review-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DocumentReviewDialogComponent {
  note = '';
  decision: 'approved' | 'rejected' | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DocumentReviewDialogData,
    private readonly dialogRef: MatDialogRef<DocumentReviewDialogComponent, DocumentReviewResult>
  ) {}

  isImage(doc: AdminDocumentRow): boolean {
    return doc.contentType.startsWith('image/');
  }

  typeLabel(doc: AdminDocumentRow): string {
    return documentTypeLabel(doc.documentType);
  }

  sizeLabel(doc: AdminDocumentRow): string {
    return formatFileSize(doc.fileSizeBytes);
  }

  statusLabel(status: DocumentOwnerStatus): string {
    return DOCUMENT_STATUS_LABELS[status];
  }

  choose(approved: boolean): void {
    this.decision = approved ? 'approved' : 'rejected';
  }

  submit(): void {
    if (!this.decision) return;
    this.dialogRef.close({ approved: this.decision === 'approved', note: this.note.trim() });
  }
}
