import { Component, EventEmitter, Input, Output } from '@angular/core';

// ═══════════════════════════════════════════════════════════════════
// Jalali (Persian) calendar math — jalaali-js algorithm (MIT),
// implemented inline so no runtime dependency is needed.
// ═══════════════════════════════════════════════════════════════════

function div(a: number, b: number): number {
  return ~~(a / b);
}

function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

const JALALI_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

/** Leap status of a Jalali year (0 = leap). */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];
  let jump = 0;

  for (let i = 1; i < bl; i += 1) {
    const jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function isLeapJalaaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaaliYear(jy) ? 30 : 29;
}

function j2d(jy: number, jm: number, jd: number): number {
  // Months 1-6 have 31 days, months 7-11 have 30 days, Esfand (12) has 29/30.
  const march = jalCal(jy).march;
  const jdn = g2d(jy + 621, 3, march);
  const before = jm <= 7 ? (jm - 1) * 31 : 216 + (jm - 8) * 30;
  return jdn + before + jd - 1;
}

function g2d(gy: number, gm: number, gd: number): number {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * mod(gm + 9, 12) + 2, 5)
    + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** 0-based start index of each Jalali month within its year (months 1-6 = 31d, 7-11 = 30d, 12 = 29/30d). */
const MONTH_STARTS = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];

function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  let r = j2d(jy, 1, 1);
  if (jdn < r) {
    jy -= 1;
    r = j2d(jy, 1, 1);
  }
  const k = jdn - r; // 0-based day within the Jalali year
  let jm = 1;
  let jd = 1;
  for (let m = 11; m >= 0; m -= 1) {
    if (k >= MONTH_STARTS[m]) {
      jm = m + 1;
      jd = k - MONTH_STARTS[m] + 1;
      break;
    }
  }
  return { jy, jm, jd };
}

function jalaaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

function gregorianToJalaali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  return d2j(g2d(gy, gm, gd));
}

/** Saturday=0 … Friday=6 (Persian week start). JS getDay(): Sun=0. */
function persianWeekday(gy: number, gm: number, gd: number): number {
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

/**
 * Persian (Jalali) date / month picker.
 *
 * Displays and lets the user pick a Jalali date while emitting the
 * Gregorian equivalent for API calls:
 * - `dateSelected`    → Jalali display string, e.g. `1405/6/11` (or `1405/06` in month mode)
 * - `gregorianChange` → `2026-09-02` (date mode) or `2026-09` (month mode)
 */
@Component({
  selector: 'app-persian-date-picker',
  template: `
    <div class="relative inline-block">
      <button
        type="button"
        (click)="toggle()"
        class="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-right text-sm focus:border-primary focus:outline-none"
      >
        <span [class.text-gray-400]="!displayValue">{{ displayValue || placeholder }}</span>
        <span aria-hidden="true">📅</span>
      </button>

      <div
        *ngIf="open"
        (click)="$event.stopPropagation()"
        class="absolute z-50 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
      >
        <!-- Header -->
        <div class="mb-3 flex items-center justify-between">
          <button type="button" (click)="changeYear(-1)" class="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100">»</button>
          <button type="button" (click)="changeMonth(-1)" class="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100">›</button>
          <span class="font-bold text-secondary">{{ yearLabel }}</span>
          <button type="button" (click)="changeMonth(1)" class="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100">‹</button>
          <button type="button" (click)="changeYear(1)" class="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100">«</button>
        </div>

        <!-- Month mode: grid of 12 months -->
        <div *ngIf="mode === 'month'" class="grid grid-cols-3 gap-2">
          <button
            *ngFor="let m of monthNames; let i = index"
            type="button"
            (click)="selectMonth(i + 1)"
            class="rounded-lg border border-gray-100 py-2 text-sm hover:border-primary hover:text-primary"
            [class.border-primary!]="i + 1 === month && isCurrentYear"
          >
            {{ m }}
          </button>
        </div>

        <!-- Date mode: day grid -->
        <ng-container *ngIf="mode === 'date'">
          <div class="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-500">
            <span *ngFor="let w of weekDays">{{ w }}</span>
          </div>
          <div class="grid grid-cols-7 gap-1">
            <span *ngFor="let blank of blanks" class="text-center text-sm leading-8"></span>
            <button
              *ngFor="let day of daysOfMonth"
              type="button"
              (click)="selectDay(day)"
              class="rounded-lg text-center text-sm leading-8 transition-colors hover:bg-primary hover:text-white"
              [class.bg-primary!]="day === selectedDay && month === selectedMonth && year === selectedYear"
              [class.font-bold]="day === todayJd && month === todayJm && year === todayJy"
              [class.rounded-full]="day === todayJd && month === todayJm && year === todayJy"
            >
              {{ day }}
            </button>
          </div>
        </ng-container>

        <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
          <button type="button" (click)="goToday()" class="text-xs text-primary hover:underline">امروز</button>
          <button type="button" (click)="open = false" class="text-xs text-gray-500 hover:underline">بستن</button>
        </div>
      </div>
    </div>
  `
})
export class PersianDatePickerComponent {
  @Input() placeholder = 'انتخاب تاریخ';
  @Input() mode: 'date' | 'month' = 'date';
  @Input() set value(val: string | undefined) {
    if (!val) return;
    const m = val.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (m) {
      // Gregorian ISO input → show its Jalali equivalent.
      const j = gregorianToJalaali(+m[1], +m[2], m[3] ? +m[3] : 1);
      this.initFromJalali(j.jy, j.jm, m[3] ? j.jd : 0);
    } else {
      const jm2 = val.split('/').map(Number);
      if (jm2.length >= 2 && jm2[0] > 1300) this.initFromJalali(jm2[0], jm2[1], jm2[2] ?? 0);
    }
  }
  @Output() dateSelected = new EventEmitter<string>();
  @Output() gregorianChange = new EventEmitter<string>();

  open = false;
  weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
  monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  year = 1405;
  month = 1;
  selectedDay = 0;
  selectedMonth = 0;
  selectedYear = 0;

  todayJy = 1400;
  todayJm = 1;
  todayJd = 1;

  constructor() {
    const now = new Date();
    const j = gregorianToJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    this.todayJy = j.jy;
    this.todayJm = j.jm;
    this.todayJd = j.jd;
    this.initFromJalali(j.jy, j.jm, 0);
  }

  get isCurrentYear(): boolean { return this.year === this.todayJy; }
  get yearLabel(): string { return this.mode === 'month' ? String(this.year) : `${this.year} / ${this.monthNames[this.month - 1]}`; }
  get monthLength(): number { return jalaaliMonthLength(this.year, this.month); }
  get blanks(): number[] {
    const gy = jalaaliToGregorian(this.year, this.month, 1);
    return Array.from({ length: persianWeekday(gy.gy, gy.gm, gy.gd) }, () => 0);
  }
  get daysOfMonth(): number[] {
    return Array.from({ length: this.monthLength }, (_, i) => i + 1);
  }
  get displayValue(): string {
    if (this.mode === 'month') {
      if (!this.selectedMonth) return '';
      return `${this.selectedYear}/${pad2(this.selectedMonth)}`;
    }
    if (!this.selectedDay) return '';
    return `${this.selectedYear}/${pad2(this.selectedMonth)}/${pad2(this.selectedDay)}`;
  }

  private initFromJalali(jy: number, jm: number, jd: number): void {
    this.year = jy;
    this.month = jm;
    this.selectedYear = jy;
    this.selectedMonth = jm;
    this.selectedDay = jd;
  }

  toggle(): void { this.open = !this.open; }
  changeMonth(delta: number): void {
    this.month += delta;
    if (this.month > 12) { this.month = 1; this.year += 1; }
    if (this.month < 1) { this.month = 12; this.year -= 1; }
  }
  changeYear(delta: number): void { this.year += delta; }

  selectDay(day: number): void {
    this.selectedDay = day;
    this.selectedMonth = this.month;
    this.selectedYear = this.year;
    this.open = false;
    const j = jalaaliToGregorian(this.year, this.month, day);
    this.dateSelected.emit(`${this.year}/${this.month}/${day}`);
    this.gregorianChange.emit(`${j.gy}-${pad2(j.gm)}-${pad2(j.gd)}`);
  }

  selectMonth(month: number): void {
    this.month = month;
    this.selectedMonth = month;
    if (this.mode === 'month') {
      if (!this.selectedYear) this.selectedYear = this.year;
      this.selectedYear = this.year;
      this.open = false;
      const first = jalaaliToGregorian(this.year, month, 1);
      this.dateSelected.emit(`${this.year}/${month}`);
      this.gregorianChange.emit(`${first.gy}-${pad2(first.gm)}`);
    }
  }

  goToday(): void {
    this.year = this.todayJy;
    this.month = this.todayJm;
    if (this.mode === 'month') {
      this.selectMonth(this.todayJm);
    } else {
      this.selectDay(this.todayJd);
    }
  }
}