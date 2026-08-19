import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

export type SurveyQuestionType = 'MultipleChoice' | 'Text' | 'YesNo';

export interface SurveyQuestion {
  id?: string;
  text: string;
  type: SurveyQuestionType;
  isRequired: boolean;
  options?: string[];
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  responsesCount?: number;
  questions?: SurveyQuestion[];
}

export interface SurveyData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  questions?: SurveyQuestion[];
}

export interface SurveyResult {
  questionId?: string;
  questionText: string;
  answers: Array<{ label: string; count: number }>;
  textAnswers?: string[];
}

@Injectable({ providedIn: 'root' })
export class SurveyService {
  constructor(private readonly api: ApiService) {}

  getSurveys(params?: { pageNumber?: number; pageSize?: number }): Observable<Result<PagedList<Survey>>> {
    return this.api.get<Result<PagedList<Survey>>>(`/surveys${buildQueryString(params)}`);
  }

  getSurveyById(id: string): Observable<Result<Survey>> {
    return this.api.get<Result<Survey>>(`/surveys/${id}`);
  }

  createSurvey(data: SurveyData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/surveys', data);
  }

  updateSurvey(id: string, data: SurveyData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/surveys/${id}`, data);
  }

  deleteSurvey(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/surveys/${id}`);
  }

  getResults(id: string): Observable<Result<SurveyResult[]>> {
    return this.api.get<Result<SurveyResult[]>>(`/surveys/${id}/results`);
  }

  respond(id: string, answers: Record<string, string | string[]>): Observable<Result<string>> {
    return this.api.post<Result<string>>(`/surveys/${id}/respond`, { answers: JSON.stringify(answers) });
  }
}
