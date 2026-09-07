import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** یک پیام در چت سفارش */
export interface OrderChatMessage {
  id: string;
  threadId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  body: string;
  createdAt: string;
  isMine: boolean;
}

/** خلاصه‌ی گفتگوی یک سفارش */
export interface OrderChatThreadSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  title: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

/** گفتگوی کامل یک سفارش (تاریخچه پیام‌ها) */
export interface OrderChatThreadDetail {
  id: string;
  orderId: string;
  orderNumber: string;
  title: string;
  messages: OrderChatMessage[];
}

/**
 * سرویس چت سفارش — هر سفارش یک گفتگوی یکتا بین فروشنده و تأمین‌کننده دارد
 * تا همه چیز (قیمت، موجودی، ارسال) قابل پیگیری باشد.
 */
@Injectable({ providedIn: 'root' })
export class OrderChatService {
  /** پس از بازکردن/ارسال پیام fire می‌شود تا نشان سایدبار فوراً refresh شود */
  readonly badgeRefresh$ = new Subject<void>();

  constructor(private readonly api: ApiService) {}

  /** دریافت (یا ساخت خودکار) گفتگوی یک سفارش با تاریخچه پیام‌ها */
  getChat(orderId: string): Observable<Result<OrderChatThreadDetail>> {
    // سرور هنگام بازکردن، پیام‌ها را خوانده‌شده علامت می‌زند — پس از موفقیت نشان را تازه کن.
    return this.api
      .get<Result<OrderChatThreadDetail>>(`/v1/order-chats/orders/${orderId}`)
      .pipe(tap(() => this.badgeRefresh$.next()));
  }

  /** ارسال پیام به گفتگوی سفارش */
  sendMessage(orderId: string, body: string): Observable<Result<OrderChatMessage>> {
    // نشانگر خواندن فرستنده در سرور جلو می‌رود — پس از موفقیت نشان را تازه کن.
    return this.api
      .post<Result<OrderChatMessage>>(`/v1/order-chats/orders/${orderId}/messages`, { body })
      .pipe(tap(() => this.badgeRefresh$.next()));
  }

  /** فهرست گفتگوهای قابل مشاهده برای کاربر جاری */
  getMyThreads(): Observable<Result<OrderChatThreadSummary[]>> {
    return this.api.get<Result<OrderChatThreadSummary[]>>('/v1/order-chats/threads');
  }
}
