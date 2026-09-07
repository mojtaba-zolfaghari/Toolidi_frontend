import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { OrderChatService, OrderChatMessage } from '../../../core/services/api/order-chat.service';

/**
 * پنل چت سفارش — هر سفارش یک گفتگوی یکتا بین فروشنده و تأمین‌کننده دارد.
 * در پنل فروشنده و پنل تأمین‌کننده به صورت یک modal یا بخش داخلی استفاده می‌شود.
 */
@Component({
  selector: 'app-order-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full min-h-[420px]">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
        <div>
          <p class="font-bold text-secondary">💬 گفتگوی سفارش</p>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ orderNumber ? 'سفارش ' + orderNumber : 'در حال بارگذاری…' }}
          </p>
        </div>
        <button *ngIf="closable" (click)="closed.emit()" class="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">×</button>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto space-y-2 px-1" #scrollHost>
        <div *ngFor="let msg of messages"
             class="flex"
             [class.justify-end]="msg.isMine"
             [class.justify-start]="!msg.isMine">
          <div class="max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm"
               [class]="msg.isMine ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-secondary'">
            <p class="text-[11px] opacity-70 mb-0.5">
              {{ roleLabel(msg.senderRole) }} · {{ msg.createdAt | date:'HH:mm' }}
            </p>
            <p class="text-sm whitespace-pre-wrap break-words">{{ msg.body }}</p>
          </div>
        </div>

        <p *ngIf="!loading && !messages.length" class="text-gray-400 text-center py-10 text-sm">
          هنوز پیامی رد و بدل نشده — اولین پیام را بفرستید.
        </p>
        <p *ngIf="error" class="text-red-500 text-center py-6 text-sm">{{ error }}</p>
      </div>

      <!-- Composer -->
      <div class="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <input type="text" [(ngModel)]="draft" (keyup.enter)="send()"
               [disabled]="sending"
               placeholder="پیام خود را بنویسید…"
               class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <button (click)="send()" [disabled]="sending || !draft.trim()"
                class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
          {{ sending ? '…' : 'ارسال' }}
        </button>
      </div>
    </div>
  `
})
export class OrderChatComponent implements OnInit, OnChanges {
  /** شناسه سفارشی که گفتگوی آن نمایش داده می‌شود */
  @Input() orderId = '';
  /** آیا دکمه بستن نمایش داده شود (حالت modal) */
  @Input() closable = true;
  @Output() closed = new EventEmitter<void>();

  messages: OrderChatMessage[] = [];
  orderNumber = '';
  draft = '';
  loading = false;
  sending = false;
  error: string | null = null;

  constructor(private readonly chatService: OrderChatService) {}

  ngOnInit(): void {
    if (this.orderId) this.load();
  }

  ngOnChanges(): void {
    if (this.orderId) this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.chatService.getChat(this.orderId).subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          this.messages = result.data.messages ?? [];
          this.orderNumber = result.data.orderNumber;
        } else {
          this.error = result.errorMessage ?? 'خطا در بارگذاری گفتگو';
          this.messages = [];
        }
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  send(): void {
    const body = this.draft.trim();
    if (!body || !this.orderId) return;

    this.sending = true;
    this.chatService.sendMessage(this.orderId, body).subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          this.messages = [...this.messages, result.data];
          this.draft = '';
        } else {
          this.error = result.errorMessage ?? 'خطا در ارسال پیام';
        }
        this.sending = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.sending = false;
      }
    });
  }

  roleLabel(role: string): string {
    const labels: { [k: string]: string } = {
      Seller: 'فروشنده',
      Supplier: 'تأمین‌کننده',
      Admin: 'پشتیبانی'
    };
    return labels[role] || role;
  }
}
