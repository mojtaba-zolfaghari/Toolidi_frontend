import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

import { ConfirmDialogComponent, ConfirmDialogData } from '../components/confirm-dialog/confirm-dialog.component';

/**
 * سرویس دیالوگ تأیید Material — جایگزین window.confirm برای UX یکپارچه.
 * استفاده: this.confirm.confirm({ title, message, danger }).subscribe(ok => { if (ok) ... });
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  constructor(private readonly dialog: MatDialog) {}

  /** باز کردن دیالوگ تأیید؛ خروجی true اگر کاربر تأیید کند، وگرنه false. */
  confirm(options: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '26rem',
        maxWidth: 'calc(100vw - 2rem)',
        direction: 'rtl',
        autoFocus: 'dialog',
        data: options
      })
      .afterClosed()
      .pipe(map((result) => result === true));
  }

  /** میان‌بر برای عملیات مخرب (حذف). */
  confirmDanger(message: string, confirmLabel = 'حذف', title = 'تأیید عملیات'): Observable<boolean> {
    return this.confirm({ title, message, confirmLabel, danger: true });
  }
}
