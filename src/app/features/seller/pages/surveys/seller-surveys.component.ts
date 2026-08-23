import { Component, OnInit } from '@angular/core';

import { Survey, SurveyQuestion, SurveyService } from '../../../../core/services/api/survey.service';

@Component({
  selector: 'app-seller-surveys',
  template: `
    <section dir="rtl" class="mx-auto max-w-5xl space-y-6"><header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">نظرسنجی</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">نظرسنجی‌های فعال</h1><p class="mt-2 text-sm text-gray-500">نظر شما به بهبود پلتفرم کمک می‌کند</p></div><button type="button" (click)="loadSurveys()" class="rounded-xl border border-primary px-4 py-2 font-bold text-primary">بازخوانی</button></header><p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p><div *ngIf="loading" class="rounded-2xl bg-white p-12 text-center text-gray-500 shadow-card">در حال بارگذاری نظرسنجی‌ها…</div><div *ngIf="!loading" class="grid gap-4"><article *ngFor="let survey of surveys" class="rounded-2xl bg-white p-6 shadow-card"><div class="flex flex-wrap items-center justify-between gap-4"><div><h2 class="text-xl font-bold text-secondary">{{ survey.title }}</h2><p class="mt-2 text-sm text-gray-500">{{ survey.description || 'لطفاً در این نظرسنجی شرکت کنید.' }}</p><p class="mt-2 text-xs text-gray-400">مهلت پاسخ: {{ survey.endDate | persianDate:'yyyy/MM/dd' }}</p></div><button type="button" (click)="openSurvey(survey)" class="rounded-xl bg-primary px-5 py-2.5 font-bold text-white">شرکت در نظرسنجی</button></div></article><p *ngIf="!surveys.length" class="rounded-2xl bg-white p-10 text-center text-gray-400 shadow-card">نظرسنجی فعالی برای شما وجود ندارد.</p></div>
      <div *ngIf="selectedSurvey" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeSurvey()"><form (ngSubmit)="submitResponse()" (click)="$event.stopPropagation()" class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">{{ selectedSurvey.title }}</h2><button type="button" (click)="closeSurvey()" class="text-2xl text-gray-400">×</button></div><p *ngIf="questionsLoading" class="py-8 text-center text-gray-500">در حال بارگذاری سؤالات…</p><div *ngIf="!questionsLoading" class="mt-5 space-y-5"><div *ngFor="let question of questions; let i = index" class="rounded-xl border border-gray-200 p-4"><p class="font-bold text-secondary">{{ i + 1 }}. {{ question.text }} <span *ngIf="question.isRequired" class="text-red-500">*</span></p><textarea *ngIf="question.type === 'Text'" [(ngModel)]="answers[answerKey(question)]" [ngModelOptions]="{standalone:true}" rows="3" class="mt-3 w-full rounded-xl border border-gray-300 px-3 py-2" placeholder="پاسخ شما"></textarea><div *ngIf="question.type === 'YesNo'" class="mt-3 flex gap-5"><label class="flex items-center gap-2"><input type="radio" [name]="'question-' + i" [value]="'بله'" [(ngModel)]="answers[answerKey(question)]" [ngModelOptions]="{standalone:true}" /> بله</label><label class="flex items-center gap-2"><input type="radio" [name]="'question-' + i" [value]="'خیر'" [(ngModel)]="answers[answerKey(question)]" [ngModelOptions]="{standalone:true}" /> خیر</label></div><div *ngIf="question.type === 'MultipleChoice'" class="mt-3 space-y-2"><label *ngFor="let option of question.options ?? []" class="flex items-center gap-2"><input type="radio" [name]="'question-' + i" [value]="option" [(ngModel)]="answers[answerKey(question)]" [ngModelOptions]="{standalone:true}" /> {{ option }}</label></div></div></div><p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p><div class="mt-6 flex justify-end gap-3"><button type="button" (click)="closeSurvey()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button><button type="submit" [disabled]="submitting || questionsLoading" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">{{ submitting ? 'در حال ارسال…' : 'ارسال پاسخ' }}</button></div></form></div>
    </section>
  `
})
export class SellerSurveysComponent implements OnInit {
  surveys: Survey[] = [];
  selectedSurvey: Survey | null = null;
  questions: SurveyQuestion[] = [];
  answers: Record<string, string | string[]> = {};
  loading = true;
  questionsLoading = false;
  submitting = false;
  errorMessage = '';
  formError = '';
  successMessage = '';

  constructor(private readonly surveyService: SurveyService) {}

  ngOnInit(): void { this.loadSurveys(); }

  loadSurveys(): void { this.loading = true; this.surveyService.getSurveys({ pageNumber: 1, pageSize: 100 }).subscribe({ next: (result) => { const now = Date.now(); this.surveys = (result.data?.items ?? []).filter((survey) => survey.isActive !== false && new Date(survey.startDate).getTime() <= now && new Date(survey.endDate).getTime() >= now); this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } }); }

  openSurvey(survey: Survey): void { this.selectedSurvey = survey; this.questions = []; this.answers = {}; this.formError = ''; this.questionsLoading = true; this.surveyService.getSurveyById(survey.id).subscribe({ next: (result) => { this.questions = result.data?.questions ?? []; this.questionsLoading = false; }, error: (error: Error) => { this.formError = error.message; this.questionsLoading = false; } }); }
  closeSurvey(): void { if (!this.submitting) this.selectedSurvey = null; }
  answerKey(question: SurveyQuestion): string { return question.id ?? question.text; }

  submitResponse(): void {
    if (!this.selectedSurvey) return;
    const missing = this.questions.some((question) => question.isRequired && !this.answers[this.answerKey(question)]);
    if (missing) { this.formError = 'لطفاً به همه سؤالات الزامی پاسخ دهید.'; return; }
    this.submitting = true; this.formError = '';
    this.surveyService.respond(this.selectedSurvey.id, this.answers).subscribe({ next: (result) => { this.submitting = false; if (result.isSuccess) { this.selectedSurvey = null; this.successMessage = 'پاسخ شما با موفقیت ثبت شد.'; } else this.formError = result.errorMessage ?? 'ثبت پاسخ انجام نشد.'; }, error: (error: Error) => { this.submitting = false; this.formError = error.message; } });
  }
}
