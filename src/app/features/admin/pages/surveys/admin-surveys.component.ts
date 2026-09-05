import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Result } from '../../../../core/models/api-response.model';
import { Survey, SurveyData, SurveyQuestion, SurveyResult, SurveyService } from '../../../../core/services/api/survey.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

@Component({
  selector: 'app-admin-surveys',
  templateUrl: './admin-surveys.component.html'
})
export class AdminSurveysComponent implements OnInit {
  surveys: Survey[] = [];
  questions: SurveyQuestion[] = [];
  form: FormGroup;
  formOpen = false;
  editingId: string | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';
  resultsSurvey: Survey | null = null;
  results: SurveyResult[] = [];
  resultsLoading = false;

  constructor(private readonly fb: FormBuilder, private readonly surveyService: SurveyService, private readonly confirm: ConfirmService) {
    this.form = this.fb.group({ title: ['', Validators.required], description: [''], startDate: ['', Validators.required], endDate: ['', Validators.required] });
  }

  ngOnInit(): void { this.loadSurveys(); }
  loadSurveys(): void { this.loading = true; this.surveyService.getSurveys({ pageNumber: 1, pageSize: 100 }).subscribe({ next: (result) => { this.surveys = result.data?.items ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } }); }
  isActive(survey: Survey): boolean { const now = Date.now(); return survey.isActive !== false && new Date(survey.startDate).getTime() <= now && new Date(survey.endDate).getTime() >= now; }
  openCreate(): void { this.editingId = null; this.form.reset({ title: '', description: '', startDate: '', endDate: '' }); this.questions = []; this.formError = ''; this.formOpen = true; }
  openEdit(survey: Survey): void { this.editingId = survey.id; this.form.patchValue({ title: survey.title, description: survey.description ?? '', startDate: survey.startDate.slice(0, 10), endDate: survey.endDate.slice(0, 10) }); this.questions = survey.questions ? survey.questions.map((question) => ({ ...question, options: [...(question.options ?? [])] })) : []; this.formError = ''; this.formOpen = true; }
  closeForm(): void { if (!this.saving) this.formOpen = false; }
  addQuestion(): void { this.questions.push({ text: '', type: 'MultipleChoice', isRequired: false, options: [''] }); }
  removeQuestion(index: number): void { this.questions.splice(index, 1); }
  addOption(question: SurveyQuestion): void { (question.options ??= []).push(''); }
  removeOption(question: SurveyQuestion, index: number): void { question.options?.splice(index, 1); }
  save(): void { this.form.markAllAsTouched(); const value = this.form.getRawValue(); if (this.form.invalid) { this.formError = 'عنوان و تاریخ‌های نظرسنجی الزامی هستند.'; return; } if (value.endDate < value.startDate) { this.formError = 'تاریخ پایان باید بعد از تاریخ شروع باشد.'; return; } if (this.questions.some((question) => !question.text.trim())) { this.formError = 'متن همه سؤالات را تکمیل کنید.'; return; } const data: SurveyData = { title: value.title.trim(), description: value.description || undefined, startDate: new Date(`${value.startDate}T00:00:00`).toISOString(), endDate: new Date(`${value.endDate}T23:59:59`).toISOString(), questions: this.questions }; this.saving = true; this.formError = ''; const request: Observable<Result<unknown>> = this.editingId ? this.surveyService.updateSurvey(this.editingId, data) : this.surveyService.createSurvey(data); request.subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = this.editingId ? 'نظرسنجی ویرایش شد.' : 'نظرسنجی ایجاد شد.'; this.loadSurveys(); } else this.formError = result.errorMessage ?? 'ذخیره نظرسنجی انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } }); }
  remove(survey: Survey): void { this.confirm.confirmDanger(`آیا از حذف «${survey.title}» مطمئن هستید؟`).subscribe(ok => { if (!ok) return; this.surveyService.deleteSurvey(survey.id).subscribe({ next: (result) => { if (result.isSuccess) { this.successMessage = 'نظرسنجی حذف شد.'; this.loadSurveys(); } else this.errorMessage = result.errorMessage ?? 'حذف نظرسنجی انجام نشد.'; }, error: (error: Error) => this.errorMessage = error.message }); }); }
  showResults(survey: Survey): void { this.resultsSurvey = survey; this.results = []; this.resultsLoading = true; this.surveyService.getResults(survey.id).subscribe({ next: (result) => { this.results = result.data ?? []; this.resultsLoading = false; }, error: () => { this.results = []; this.resultsLoading = false; } }); }
  resultMax(result: SurveyResult): number { return Math.max(0, ...result.answers.map((answer) => answer.count)); }
}
