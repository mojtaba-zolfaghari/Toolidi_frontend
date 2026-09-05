import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ImportFieldConfig, ImportFlow, ImportFlowConfig, ImportJobStatus, ImportProductFailure, ImportStudioService, ImportValidationSummary, SaveImportFlowData, ScrapedProduct } from '../../../../core/services/api/import-studio.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

@Component({ selector: 'app-import-studio', templateUrl: './import-studio.component.html', styleUrls: ['./import-studio.component.scss'] })
export class ImportStudioComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  flows: ImportFlow[] = []; selectedFlow: ImportFlow | null = null; history: ImportJobStatus[] = []; loadingHistory = false;
  sellerId = '';
  loadingFlows = true; formOpen = false; editingId: string | null = null; saving = false;
  flowForm: FormGroup; step = 0; previewing = false; products: ScrapedProduct[] = []; selectedUrls = new Set<string>(); scrapeErrors: string[] = []; previewReady = false;
  sourceHtml = ''; sourcePreviewUrl = ''; sourceLoading = false; selectorMode: 'listing' | 'detail' = 'listing'; visualField: ImportFieldConfig | null = null; visualSelectionEnabled = false;
  @ViewChild('sourceCanvas') sourceCanvas?: ElementRef<HTMLElement>;

  // ── Visual tag picker: load the source site in a sandboxed iframe and pick
  // listing selectors by clicking the real page — TASK-BE-STUDIO-001.
  pickerOpen = false;
  pickerLoading = false;
  pickerTarget: 'card' | 'link' = 'card';
  pickerLastPicked = '';
  private pickerIframe?: HTMLIFrameElement;
  private pickerMessageHandler?: (event: MessageEvent) => void;

  validating = false; validationSummary: ImportValidationSummary | null = null; importing = false; currentJob: ImportJobStatus | null = null; retrying = false;
  expandedHistoryJob: string | null = null;
  mappingFields: ImportFieldConfig[] = []; rules: ImportFlowConfig['validationRules']; categoryId = ''; errorMessage = ''; successMessage = ''; private pollTimer: any;
  readonly steps = ['فلو', 'انتخاب محصولات', 'نگاشت فیلدها', 'قوانین', 'پیش‌نمایش', 'ایمپورت', 'تاریخچه'];

  constructor(private readonly fb: FormBuilder, private readonly importStudio: ImportStudioService, private readonly confirm: ConfirmService, private readonly ngZone: NgZone, private readonly ref: ChangeDetectorRef) {
    this.flowForm = this.fb.group({ siteName: ['', Validators.required], sourceUrl: ['', [Validators.required, Validators.pattern('https?://.+')]] });
    this.rules = this.defaultFlowConfig().validationRules;
  }
  ngOnInit(): void { this.loadFlows(); }
  ngOnDestroy(): void { this.closePicker(); this.stopPolling(); this.destroy$.next(); this.destroy$.complete(); }

  loadFlows(): void { this.loadingFlows = true; this.importStudio.getFlows().pipe(takeUntil(this.destroy$)).subscribe({ next: r => { this.flows = r.data ?? []; this.loadingFlows = false; }, error: () => { this.errorMessage = 'خطا در دریافت فلوها'; this.loadingFlows = false; } }); }
  openCreateForm(): void { this.editingId = null; this.flowForm.reset({ siteName: '', sourceUrl: '' }); this.formOpen = true; }
  openEditForm(flow: ImportFlow): void { this.editingId = flow.id; this.flowForm.patchValue({ siteName: flow.siteName, sourceUrl: flow.sourceUrl }); this.formOpen = true; }
  saveFlow(): void {
    if (this.flowForm.invalid || this.saving) { this.flowForm.markAllAsTouched(); return; }
    this.saving = true; const data: SaveImportFlowData = { siteName: this.flowForm.value.siteName, sourceUrl: this.flowForm.value.sourceUrl, flowConfig: this.flowConfig(), isActive: true };
    const request$ = this.editingId ? this.importStudio.updateFlow(this.editingId, data) : this.importStudio.createFlow(data);
    request$.pipe(takeUntil(this.destroy$)).subscribe({ next: r => { this.saving = false; if (r.isSuccess) { this.formOpen = false; this.successMessage = 'فلو ذخیره شد'; this.loadFlows(); } else this.errorMessage = r.errorMessage ?? 'خطا در ذخیره فلو'; }, error: () => { this.saving = false; this.errorMessage = 'خطا در ذخیره فلو'; } });
  }
  removeFlow(flow: ImportFlow): void { this.confirm.confirmDanger(`فلو «${flow.siteName}» حذف شود؟`).subscribe(ok => { if (!ok) return; this.importStudio.deleteFlow(flow.id).pipe(takeUntil(this.destroy$)).subscribe({ next: () => this.loadFlows(), error: () => this.errorMessage = 'خطا در حذف فلو' }); }); }

  selectFlow(flow: ImportFlow): void {
    this.closePicker();
    this.selectedFlow = { ...flow, flowConfig: { ...this.defaultFlowConfig(), ...(flow.flowConfig ?? {}) } }; this.step = 1; this.products = []; this.selectedUrls.clear(); this.validationSummary = null; this.currentJob = null; this.errorMessage = ''; this.successMessage = '';
    const config = flow.flowConfig ?? this.defaultFlowConfig(); this.mappingFields = [...(config.fields ?? [])]; this.rules = { ...this.defaultFlowConfig().validationRules, ...(config.validationRules ?? {}) };
    // Do not scrape with placeholder selectors immediately. Configure the listing
    // selectors first, then explicitly run Preview.
  }
  backToFlows(): void { this.closePicker(); this.stopPolling(); this.step = 0; this.selectedFlow = null; this.currentJob = null; }
  go(step: number): void { if (!this.selectedFlow) return; if (step === 2 && !this.selectedCount) { this.errorMessage = 'حداقل یک محصول انتخاب کنید'; return; } if (step === 4 && !this.validationSummary) { this.errorMessage = 'ابتدا اعتبارسنجی را اجرا کنید'; return; } if (step === 5 && (!this.validationSummary || !this.validationSummary.isValid || !this.categoryId)) { this.errorMessage = 'قبل از ایمپورت، اعتبارسنجی موفق و CategoryId الزامی است'; return; } this.step = step; if (step === 6) this.loadHistory(); }

  loadSourceForVisualSelection(): void { if (!this.selectedFlow) return; this.sourceLoading = true; this.sourcePreviewUrl = this.selectedFlow.sourceUrl; this.importStudio.getSourceHtml(this.selectedFlow.id).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { this.sourceLoading = false; if (r.isSuccess && r.data) this.sourceHtml = r.data; else this.errorMessage = r.errorMessage ?? 'دریافت HTML سایت منبع ناموفق بود'; }, error: e => { this.sourceLoading = false; this.errorMessage = e?.message ?? 'دریافت HTML سایت منبع ناموفق بود'; } }); }
  startVisualSelection(field: ImportFieldConfig): void { this.visualField = field; this.visualSelectionEnabled = true; if (!this.sourceHtml) this.loadSourceForVisualSelection(); }
  selectSourceElement(event: MouseEvent): void {
    if (!this.visualSelectionEnabled || !this.visualField) return;
    event.preventDefault(); event.stopPropagation();
    const target = event.target as HTMLElement;
    if (!target || !this.sourceCanvas?.nativeElement.contains(target)) return;
    const selector = this.cssSelector(target);
    this.visualField.selector = selector;
    this.visualSelectionEnabled = false;
    this.successMessage = `سلکتور ${selector} برای ${this.visualField.sourceField || 'فیلد'} ثبت شد`;
  }
  private cssSelector(element: HTMLElement): string {
    const parts: string[] = [];
    let current: HTMLElement | null = element;
    while (current && current !== this.sourceCanvas?.nativeElement && parts.length < 5) {
      let part = current.tagName.toLowerCase();
      if (current.id) part += `#${CSS.escape(current.id)}`;
      else if (current.classList.length) part += Array.from(current.classList).slice(0, 2).map(c => `.${CSS.escape(c)}`).join('');
      parts.unshift(part); current = current.parentElement;
    }
    return parts.join(' ');
  }
  preview(autoDetect = false): void {
    if (!this.selectedFlow) return;
    const config = { ...this.selectedFlow.flowConfig, autoDetect };
    if (!autoDetect && !config.productItemSelector?.trim() && !config.productLinkSelector?.trim()) {
      // If neither selector is set, fall back to auto-detection.
      config.autoDetect = true;
    }
    this.previewing = true; this.previewReady = false; this.errorMessage = '';
    this.importStudio.previewWithConfig(this.selectedFlow.id, config).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.previewing = false;
        if (r.isSuccess && r.data) {
          this.products = r.data.products ?? []; this.scrapeErrors = r.data.errors ?? [];
          this.selectedUrls.clear(); this.products.forEach(p => this.selectedUrls.add(p.url));
          this.previewReady = true; this.successMessage = `${this.products.length} محصول یافت شد`;
        } else this.errorMessage = r.errorMessage ?? 'خطا در پیش‌نمایش';
      },
      error: (error) => { this.previewing = false; this.errorMessage = error?.message ?? 'خطا در خواندن سایت منبع'; }
    });
  }

  /** Highlights an auto-detected product card so the user can visually confirm the card region. */
  previewProductCard(): void {
    // Backend auto-detection; no card preview lives in the browser for server markup.
    if (!this.selectedFlow) return;
    this.loadSourceForVisualSelection();
  }

  // ── Visual tag picker ─────────────────────────────────────────────
  // The source page is fetched by the backend (browser-rendered when available),
  // injected with a small picker bootstrap and rendered inside a sandboxed
  // iframe. Clicks report selectors back via postMessage; the first pick sets
  // the product-card selector, the second the product-link selector, then a
  // preview runs automatically so the user sees the detected products.

  /** Loads the site for visual tag selection. */
  openPicker(): void {
    if (!this.selectedFlow || this.pickerLoading) return;
    this.errorMessage = ''; this.successMessage = '';
    const listingUrl = (this.selectedFlow.sourceUrl || '').trim();
    if (!/^https?:\/\//i.test(listingUrl)) { this.errorMessage = 'ابتدا آدرس معتبر لیست را وارد کنید'; return; }

    this.pickerOpen = true;
    this.pickerLoading = true;
    this.pickerLastPicked = '';
    this.pickerTarget = 'card';
    this.ensurePickerListener();
    this.ref.markForCheck();

    // Defer so the iframe mount point from *ngIf is rendered first.
    setTimeout(() => {
      this.importStudio.getSourceHtml(this.selectedFlow!.id, listingUrl).pipe(takeUntil(this.destroy$)).subscribe({
        next: r => {
          if (r.isSuccess && r.data) this.buildPickerIframe(r.data, listingUrl);
          else { this.pickerLoading = false; this.errorMessage = r.errorMessage ?? 'دریافت سایت منبع ناموفق بود'; }
          this.ref.markForCheck();
        },
        error: e => { this.pickerLoading = false; this.errorMessage = e?.message ?? 'دریافت سایت منبع ناموفق بود'; this.ref.markForCheck(); }
      });
    });
  }

  setPickerTarget(target: 'card' | 'link'): void { this.pickerTarget = target; }

  private ensurePickerListener(): void {
    if (this.pickerMessageHandler) return;
    this.pickerMessageHandler = (event: MessageEvent) => this.handlePickerMessage(event);
    window.addEventListener('message', this.pickerMessageHandler);
  }

  /** Renders fetched HTML via srcdoc so the picker bootstrap can be injected. */
  private buildPickerIframe(html: string, listingUrl: string): void {
    const injected = html.replace(/<base\b[^>]*>/i, '');
    const head = `<base href="${listingUrl}">\n<script>${this.pickerBootstrap(listingUrl)}<\/script>`;
    const htmlTagIndex = injected.search(/<html[^>]*>/i);
    const doc = htmlTagIndex >= 0 ? injected.replace(/<html[^>]*>/i, m => m + head) : head + injected;

    this.pickerIframe = document.createElement('iframe');
    // allow-scripts only: the page keeps an opaque origin, so source-site
    // scripts cannot reach the dashboard, while the picker can postMessage us.
    this.pickerIframe.setAttribute('sandbox', 'allow-scripts');
    this.pickerIframe.setAttribute('title', 'پیش‌نمایش سایت منبع');
    this.pickerIframe.srcdoc = doc;
    this.pickerIframe.addEventListener('load', () => {
      this.ngZone.run(() => { this.pickerLoading = false; this.ref.markForCheck(); });
    });
    this.tryMountIframe(10);
  }

  private tryMountIframe(attempts: number): void {
    const mount = document.getElementById('import-studio-picker-mount');
    if (mount && this.pickerIframe) { mount.replaceChildren(this.pickerIframe); this.ref.markForCheck(); return; }
    if (attempts > 0) setTimeout(() => this.tryMountIframe(attempts - 1), 50);
    else { this.pickerLoading = false; this.errorMessage = 'قاب پیش‌نمایش آماده نیست؛ دوباره تلاش کنید'; this.ref.markForCheck(); }
  }

  /** ES5 script injected into the iframe: hover ring + click reporting. */
  private pickerBootstrap(pageUrl: string): string {
    const page = JSON.stringify(pageUrl);
    return [
      '(function () {',
      '  if (window.__toolidiPicker) return;',
      '  window.__toolidiPicker = true;',
      '  var PAGE = ' + page + ';',
      '  var hovered = null;',
      '  var ring = null;',
      '  function post(type, payload) {',
      "    try { parent.postMessage({ source: 'toolidi-picker', type: type, payload: payload }, '*'); } catch (e) { }",
      '  }',
      '  function compact(el) {',
      "    if (!el || el.nodeType !== 1) return '';",
      '    var tag = el.tagName.toLowerCase();',
      "    var cls = (el.classList && el.classList.length) ? Array.prototype.slice.call(el.classList, 0, 2).map(function (c) { return '.' + c; }).join('') : '';",
      '    return tag + cls;',
      '  }',
      '  function pathSelector(el) {',
      '    var parts = [];',
      '    var cur = el;',
      '    while (cur && cur.nodeType === 1 && parts.length < 5) {',
      '      var part = cur.tagName.toLowerCase();',
      "      if (cur.id) { parts.unshift(part + '#' + cur.id); break; }",
      '      if (cur.classList && cur.classList.length) part += Array.prototype.slice.call(cur.classList, 0, 2).map(function (c) { return \'.\' + c; }).join(\'\');',
      '      parts.unshift(part);',
      '      cur = cur.parentElement;',
      '    }',
      "    return parts.join(' ');",
      '  }',
      '  function cardSelectorFor(el) {',
      '    var cur = el;',
      '    var depth = 0;',
      '    while (cur && cur.parentElement && depth < 8) {',
      '      var parent = cur.parentElement;',
      "      var sig = cur.tagName.toLowerCase() + ' ' + (cur.classList && cur.classList.length ? cur.classList[0] : '');",
      '      var count = 0;',
      '      for (var i = 0; i < parent.children.length; i++) {',
      '        var sib = parent.children[i];',
      "        var sibSig = sib.tagName.toLowerCase() + ' ' + (sib.classList && sib.classList.length ? sib.classList[0] : '');",
      '        if (sibSig === sig) count++;',
      '      }',
      '      if (count >= 2) return compact(cur);',
      '      cur = parent;',
      '      depth++;',
      '    }',
      "    return '';",
      '  }',
      '  function linkFor(el) {',
      "    var a = el.closest ? el.closest('a[href]') : null;",
      "    return a ? compact(a) : '';",
      '  }',
      '  function showRing(el) {',
      '    clearRing();',
      '    if (!el || el === document.documentElement || el === document.body) return;',
      '    var r = el.getBoundingClientRect();',
      '    if (!r || (r.width === 0 && r.height === 0)) return;',
      "    ring = document.createElement('div');",
      "    ring.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #6c3fc5;background:rgba(108,63,197,.14);border-radius:4px;left:' + Math.max(0, r.left) + 'px;top:' + Math.max(0, r.top) + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';",
      '    document.body.appendChild(ring);',
      '  }',
      '  function clearRing() {',
      '    if (ring && ring.parentNode) ring.parentNode.removeChild(ring);',
      '    ring = null;',
      '  }',
      "  document.addEventListener('mousemove', function (e) {",
      '    if (hovered === e.target) return;',
      '    hovered = e.target;',
      '    showRing(e.target);',
      '  }, true);',
      "  document.addEventListener('mouseleave', clearRing, true);",
      "  document.addEventListener('scroll', clearRing, true);",
      "  document.addEventListener('click', function (e) {",
      '    e.preventDefault(); e.stopPropagation();',
      '    var el = e.target;',
      '    if (!el || el.nodeType !== 1) return;',
      "    var tag = el.tagName.toLowerCase();",
      "    if (tag === 'html' || tag === 'body') return;",
      "    var link = el.closest ? el.closest('a[href]') : null;",
      "    post('pick', { selector: pathSelector(el), card: cardSelectorFor(el), link: linkFor(el), tag: tag, href: link ? link.href : null, page: PAGE });",
      '  }, true);',
      "  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);",
      "  post('ready', {});",
      '})();'
    ].join('\n');
  }

  /** Handles postMessage events coming from the picker iframe. */
  private handlePickerMessage(event: MessageEvent): void {
    if (!this.pickerIframe || event.source !== this.pickerIframe.contentWindow) return;
    const data = event.data as { source?: string; type?: string; payload?: { selector?: string; card?: string; link?: string } } | null;
    if (!data || data.source !== 'toolidi-picker') return;
    if (data.type === 'ready') { this.ngZone.run(() => { this.pickerLoading = false; this.ref.markForCheck(); }); return; }
    if (data.type === 'pick' && data.payload?.selector) {
      this.ngZone.run(() => { this.applyPick(data.payload as { selector: string; card?: string; link?: string }); this.ref.markForCheck(); });
    }
  }

  /** Maps a picked element to the scraper's selector semantics. */
  private applyPick(payload: { selector: string; card?: string; link?: string }): void {
    const cfg = this.selectedFlow?.flowConfig;
    if (!cfg) return;

    if (this.pickerTarget === 'card') {
      // Prefer the sibling-repeated ancestor detected in the iframe; fall back
      // to the clicked element's own compact selector.
      const fallback = payload.selector.split(' ').filter(Boolean).pop() ?? '';
      cfg.productItemSelector = payload.card || fallback;
      if (!cfg.productLinkSelector?.trim()) cfg.productLinkSelector = payload.link || 'a';
      this.pickerLastPicked = cfg.productItemSelector;
      this.pickerTarget = 'link';
      this.successMessage = 'کارت محصول ثبت شد؛ حالا روی لینک یک محصول کلیک کنید';
    } else {
      // The scraper looks for the link INSIDE each card, so a compact `a`-based
      // selector is what matches its XPath semantics.
      cfg.productLinkSelector = payload.link || 'a';
      this.pickerLastPicked = cfg.productLinkSelector;
      this.successMessage = 'سلکتورها ثبت شد؛ در حال تشخیص محصولات…';
      this.closePicker();
      this.preview(false);
    }
  }

  /** Detaches the message listener and removes the iframe. */
  closePicker(): void {
    if (this.pickerMessageHandler) {
      window.removeEventListener('message', this.pickerMessageHandler);
      this.pickerMessageHandler = undefined;
    }
    this.pickerIframe?.remove();
    this.pickerIframe = undefined;
    this.pickerOpen = false;
    this.pickerLoading = false;
  }

  /** Keeps the flow's detected config for reuse, then re-opens source for detail selection. */
  goToDetails(): void {
    if (!this.selectedFlow || !this.selectedCount) { this.errorMessage = 'حداقل یک محصول انتخاب کنید'; return; }
    this.step = 2;
  }
  toggleProduct(url: string): void { this.selectedUrls.has(url) ? this.selectedUrls.delete(url) : this.selectedUrls.add(url); }
  selectAll(value: boolean): void { this.products.forEach(p => value ? this.selectedUrls.add(p.url) : this.selectedUrls.delete(p.url)); }
  get selectedCount(): number { return this.selectedUrls.size; }
  get selectedProducts(): ScrapedProduct[] { return this.products.filter(p => this.selectedUrls.has(p.url)); }
  addMapping(): void { this.mappingFields.push({ sourceField: '', targetField: '', selector: '', attribute: 'text', replacements: {}, expectedType: 'Text', required: false }); }
  removeMapping(index: number): void { this.mappingFields.splice(index, 1); }
  updateMapping(field: ImportFieldConfig, key: keyof ImportFieldConfig, event: Event): void { (field as any)[key] = (event.target as HTMLInputElement).value; }
  goToValidation(): void { if (!this.selectedFlow || !this.selectedCount) { this.errorMessage = 'حداقل یک محصول انتخاب کنید'; return; } this.step = 2; this.validate(); }
  validate(): void { if (!this.selectedFlow) return; this.validating = true; this.importStudio.validate(this.selectedFlow.id, [...this.selectedUrls], this.categoryId || this.emptyCategory()).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { this.validating = false; this.validationSummary = r.data ?? null; }, error: () => { this.validating = false; this.errorMessage = 'خطا در اعتبارسنجی'; } }); }
  goToImport(): void { if (!this.validationSummary?.isValid || !this.categoryId) { this.errorMessage = 'اعتبارسنجی موفق و CategoryId الزامی است'; return; } this.step = 5; }
  startImport(): void { if (!this.selectedFlow || this.importing) return; this.importing = true; this.importStudio.import(this.selectedFlow.id, { productUrls: [...this.selectedUrls], categoryId: this.categoryId || this.emptyCategory(), uploadImages: true, publishStatus: 'Draft', ...(this.sellerId ? { sellerId: this.sellerId } : {}) }).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { if (r.isSuccess && r.data) { this.successMessage = `${r.data.queuedProducts} محصول در صف قرار گرفت`; this.pollJob(r.data.jobId); } else { this.importing = false; this.errorMessage = r.errorMessage ?? 'خطا در شروع ایمپورت'; } }, error: () => { this.importing = false; this.errorMessage = 'خطا در شروع ایمپورت'; } }); }
  retry(): void { this.errorMessage = 'Retry در قرارداد فعلی backend وجود ندارد؛ ابتدا باید API retry پیاده‌سازی شود.'; }
  loadHistory(): void { if (!this.selectedFlow) return; this.loadingHistory = true; this.importStudio.getJobs(this.selectedFlow.id).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { this.history = r.data ?? []; this.loadingHistory = false; }, error: () => { this.loadingHistory = false; this.errorMessage = 'خطا در دریافت تاریخچه'; } }); }
  private pollJob(jobId: string): void { this.stopPolling(); this.pollTimer = interval(2000).pipe(takeUntil(this.destroy$)).subscribe(() => this.importStudio.getJobStatus(jobId).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { if (r.isSuccess && r.data) { this.currentJob = r.data; if (['Completed', 'CompletedWithErrors', 'Failed', 'Cancelled'].includes(r.data.status)) { this.stopPolling(); this.importing = false; } } }, error: () => this.stopPolling() })); }
  private stopPolling(): void { this.pollTimer?.unsubscribe(); this.pollTimer = null; }
  private emptyCategory(): string { return '00000000-0000-0000-0000-000000000000'; }
  private flowConfig(): ImportFlowConfig { return { ...this.defaultFlowConfig(), fields: this.mappingFields.length ? this.mappingFields : this.defaultFlowConfig().fields, validationRules: this.rules }; }
  private defaultFlowConfig(): ImportFlowConfig { return { autoDetect: true, productItemSelector: '.product-item', productLinkSelector: 'a', maxPages: 1, maxProducts: 50, fields: [{ sourceField: 'title', targetField: 'name', selector: '.product-title', attribute: 'text', replacements: {}, expectedType: 'Text', required: true }, { sourceField: 'price', targetField: 'unitPrice', selector: '.product-price', attribute: 'text', replacements: {}, expectedType: 'Number', required: true }, { sourceField: 'description', targetField: 'fullDescription', selector: '.product-description', attribute: 'html', replacements: {}, expectedType: 'Html', required: false }, { sourceField: 'images', selector: 'img', attribute: 'src', replacements: {}, expectedType: 'Url', required: false }], tags: [], validationRules: { checkDuplicateName: true, checkRequiredFields: true, checkPriceFormat: true, checkImages: true, checkSkuUniqueness: true, checkCategoryExists: false, requiredFields: [] } }; }
  invalid(control: string): boolean { const c = this.flowForm.get(control); return !!c && c.invalid && (c.dirty || c.touched); }
  progress(job: ImportJobStatus): number { return job.totalProducts ? Math.round(job.importedProducts / job.totalProducts * 100) : 0; }

  /** Per-product failure list of the current job (scrape/write/image stages). */
  get currentJobErrors(): ImportProductFailure[] { return this.currentJob?.errors ?? []; }

  /** History rows are expandable when they carry per-product failures. */
  historyErrors(job: ImportJobStatus): ImportProductFailure[] { return job.errors ?? []; }

  toggleHistoryDetail(job: ImportJobStatus): void {
    if (this.expandedHistoryJob === job.jobId) this.expandedHistoryJob = null;
    else this.expandedHistoryJob = job.jobId;
  }

  /** Persian label for the pipeline stage recorded on a failure entry. */
  stageLabel(stage: string): string {
    switch (stage) {
      case 'scrape': return 'اسکرپ';
      case 'write': return 'ذخیره';
      case 'image': return 'تصویر';
      default: return stage;
    }
  }

  /** Short status badge text; CompletedWithErrors is the honest partial-failure state. */
  statusLabel(status: string): string {
    switch (status) {
      case 'Queued': return 'در صف';
      case 'Running': return 'در حال اجرا';
      case 'Completed': return 'موفق';
      case 'CompletedWithErrors': return 'موفق با خطا';
      case 'Failed': return 'ناموفق';
      case 'Cancelled': return 'لغو شده';
      default: return status;
    }
  }
}
