import { toDocumentFileUrl } from '../../../../core/services/api/admin.service';

/** یک مدرک نرمال‌شده برای نمایش در مدال بازبینی (فروشنده یا تولیدکننده). */
export interface AdminDocumentRow {
  id: string;
  documentType: string;
  fileName: string;
  /** آدرس مطلق فایل برای پیش‌نمایش/دانلود */
  fileUrl: string;
  contentType: string;
  fileSizeBytes: number;
  isVerified: boolean;
  verificationNote?: string;
  createdAt: string;
}

export type DocumentOwnerStatus = 'none' | 'pending' | 'rejected' | 'verified';

export const DOCUMENT_STATUS_LABELS: Record<DocumentOwnerStatus, string> = {
  none: 'بدون مدرک',
  pending: 'در انتظار بررسی',
  rejected: 'رد شده',
  verified: 'تأیید شده'
};

/** برچسب فارسی انواع مدرک؛ انواع ناشناخته همان مقدار خام را نشان می‌دهند. */
export function documentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    business_license: 'جواز کسب',
    national_card: 'کارت ملی',
    iban: 'شماره شبا',
    tax_certificate: 'گواهی مالیاتی',
    other: 'سایر'
  };
  return labels[type] ?? type;
}

/**
 * وضعیت کل مدارک یک فروشنده/تولیدکننده:
 * رد شده > در انتظار > تأیید شده > بدون مدرک.
 * (رد شده = بدون تأیید اما دارای یادداشت — نتیجه‌ی Reject در بک‌اند)
 */
export function computeDocumentStatus(docs: Array<{ isVerified: boolean; verificationNote?: string }>): DocumentOwnerStatus {
  if (!docs.length) return 'none';
  if (docs.some(d => !d.isVerified)) {
    return docs.some(d => !d.isVerified && d.verificationNote) ? 'rejected' : 'pending';
  }
  return 'verified';
}

/** تبدیل DTO بک‌اند به ردیف نمایشی با آدرس مطلق فایل. */
export function toDocumentRow(dto: {
  id: string; documentType: string; fileName: string; url: string;
  contentType: string; fileSizeBytes: number; isVerified: boolean; verificationNote?: string; createdAt: string;
}): AdminDocumentRow {
  return {
    id: dto.id,
    documentType: dto.documentType,
    fileName: dto.fileName,
    fileUrl: toDocumentFileUrl(dto.url),
    contentType: dto.contentType,
    fileSizeBytes: dto.fileSizeBytes,
    isVerified: dto.isVerified,
    verificationNote: dto.verificationNote,
    createdAt: dto.createdAt
  };
}

/** «۱۲۳٫۴ کیلوبایت» برای نمایش حجم فایل. */
export function formatFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} بایت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', '٫')} کیلوبایت`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', '٫')} مگابایت`;
}
