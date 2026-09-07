import { NgClass } from '@angular/common';
import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

/** ورودی دیالوگ تأیید */
export interface ConfirmDialogData {
  title: string;
  message: string;
  /** برچسب دکمه تأیید (پیش‌فرض: «تأیید») */
  confirmLabel?: string;
  /** برچسب دکمه انصراف (پیش‌فرض: «انصراف») */
  cancelLabel?: string;
  /** ظاهر قرمز/هشدار برای عملیات مخرب مانند حذف */
  danger?: boolean;
}

/**
 * دیالوگ تأیید Material برای جایگزینی window.confirm در پنل مدیریت
 * (TASK-FE-ADMIN-REDESIGN follow-up: consistent UX).
 */
@Component({
    selector: 'app-confirm-dialog',
    imports: [NgClass, MatButtonModule, MatDialogModule],
    templateUrl: './confirm-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  constructor(
    public readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ConfirmDialogData
  ) {}

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
