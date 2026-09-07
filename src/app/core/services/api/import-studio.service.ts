import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

export interface ImportFieldConfig {
  sourceField: string;
  targetField?: string;
  selector: string;
  attribute: string;
  replacements: { [find: string]: string };
  expectedType: 'Text' | 'Number' | 'Url' | 'Html' | 'Date';
  required: boolean;
  /** Which page(s) this selector applies to: Both | Listing | Detail. */
  scope?: 'Both' | 'Listing' | 'Detail';
}

export interface ImportValidationRules {
  checkDuplicateName: boolean;
  checkRequiredFields: boolean;
  checkPriceFormat: boolean;
  checkImages: boolean;
  checkSkuUniqueness: boolean;
  checkCategoryExists: boolean;
  requiredFields: string[];
}

export interface ImportFlowConfig {
  autoDetect: boolean;
  productItemSelector: string;
  productLinkSelector: string;
  nextPageSelector?: string;
  prevPageSelector?: string;
  maxPages: number;
  maxProducts: number;
  fields: ImportFieldConfig[];
  tags: string[];
  validationRules: ImportValidationRules;
}

export interface ImportFlowAction {
  actionType: 'scrape' | 'map' | 'validate' | 'import';
  order: number;
  config: string;
}

export interface ImportFlow {
  id: string;
  userId: string;
  siteName: string;
  sourceUrl: string;
  flowConfig: ImportFlowConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  actions: ImportFlowAction[];
}

export interface SaveImportFlowData {
  siteName: string;
  sourceUrl: string;
  flowConfig: ImportFlowConfig;
  isActive: boolean;
  actions?: ImportFlowAction[];
}

export interface ScrapedProduct {
  url: string;
  title: string;
  price: string;
  description: string;
  imageUrls: string[];
  attributes?: { [field: string]: string };
  mappedFields: { [field: string]: string };
  tags: string[];
  validationErrors: ImportValidationIssue[];
}

export interface ImportValidationIssue { field?: string; error: string; severity: 'error' | 'warning'; }
export interface ScrapeResult { products: ScrapedProduct[]; errors: string[]; completedAt: string; total: number; }
export interface ImportProductIssue { productUrl: string; field?: string; error: string; severity: string; }
export interface ImportValidationSummary { isValid: boolean; errors: ImportProductIssue[]; warnings: ImportProductIssue[]; total: number; valid: number; errorCount: number; warningCount: number; }
export interface ImportBatchRequest { productUrls: string[]; categoryId: string; brandId?: string; uploadImages: boolean; publishStatus: string; }
export interface ImportBatchResult { jobId: string; imagesQueued: boolean; queuedProducts: number; scrapeErrorCount?: number; scrapeErrors?: ImportScrapeError[]; }
export type ImportJobState = 'Queued' | 'Running' | 'Completed' | 'CompletedWithErrors' | 'Failed' | 'Cancelled';
export interface ImportScrapeError { url: string; error: string; }
export interface ImportProductFailure { url: string; stage: 'scrape' | 'write' | 'image' | string; error: string; }
export interface ImportJobStatus { jobId: string; status: ImportJobState; totalProducts: number; importedProducts: number; totalImages: number; uploadedImages: number; failedProducts?: number; failedImages?: number; errors?: ImportProductFailure[]; resultLog?: string; completedAt?: string; }
export interface ImportCategory { id: string; name: string; parentId?: string | null; productCount?: number; }

@Injectable({ providedIn: 'root' })
export class ImportStudioService {
  private readonly baseUrl = '/v1/admin/imports';

  constructor(private readonly api: ApiService) {}

  getFlows(siteName?: string): Observable<Result<ImportFlow[]>> { const query = siteName ? `?siteName=${encodeURIComponent(siteName)}` : ''; return this.api.get<Result<ImportFlow[]>>(`${this.baseUrl}/flows${query}`); }
  getFlow(id: string): Observable<Result<ImportFlow>> { return this.api.get<Result<ImportFlow>>(`${this.baseUrl}/flows/${id}`); }
  createFlow(data: SaveImportFlowData): Observable<Result<ImportFlow>> { return this.api.post<Result<ImportFlow>>(`${this.baseUrl}/flows`, data); }
  updateFlow(id: string, data: SaveImportFlowData): Observable<Result<ImportFlow>> { return this.api.put<Result<ImportFlow>>(`${this.baseUrl}/flows/${id}`, data); }
  deleteFlow(id: string): Observable<Result<boolean>> { return this.api.delete<Result<boolean>>(`${this.baseUrl}/flows/${id}`); }
  getSourceHtml(id: string, url?: string): Observable<Result<string>> { return this.api.post<Result<string>>(`${this.baseUrl}/flows/${id}/source-html`, url ? { url } : {}); }
  previewWithConfig(id: string, flowConfig: ImportFlowConfig, url?: string): Observable<Result<ScrapeResult>> { return this.api.post<Result<ScrapeResult>>(`${this.baseUrl}/flows/${id}/preview`, { ...(url ? { url } : {}), flowConfig }); }
  preview(id: string, url?: string): Observable<Result<ScrapeResult>> { return this.api.post<Result<ScrapeResult>>(`${this.baseUrl}/flows/${id}/preview`, url ? { url } : {}); }
  scrape(id: string, productUrls: string[]): Observable<Result<ScrapeResult>> { return this.api.post<Result<ScrapeResult>>(`${this.baseUrl}/flows/${id}/scrape`, { productUrls }); }
  validate(id: string, productUrls: string[], categoryId: string, brandId?: string): Observable<Result<ImportValidationSummary>> { return this.api.post<Result<ImportValidationSummary>>(`${this.baseUrl}/flows/${id}/validate`, { productUrls, categoryId, brandId: brandId || null }); }
  import(id: string, request: ImportBatchRequest): Observable<Result<ImportBatchResult>> { return this.api.post<Result<ImportBatchResult>>(`${this.baseUrl}/flows/${id}/import`, request); }
  getJobStatus(jobId: string): Observable<Result<ImportJobStatus>> { return this.api.get<Result<ImportJobStatus>>(`${this.baseUrl}/jobs/${jobId}`); }
  getJobs(id: string): Observable<Result<ImportJobStatus[]>> { return this.api.get<Result<ImportJobStatus[]>>(`${this.baseUrl}/flows/${id}/jobs`); }

}
