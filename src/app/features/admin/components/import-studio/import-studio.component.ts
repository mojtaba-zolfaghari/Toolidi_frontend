import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { interval, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { takeUntil } from 'rxjs/operators';
import { ImportFieldConfig, ImportFlow, ImportFlowConfig, ImportJobStatus, ImportProductFailure, ImportStudioService, ImportValidationSummary, SaveImportFlowData, ScrapedProduct } from '../../../../core/services/api/import-studio.service';
import { Category, CategoryService } from '../../../../core/services/api/category.service';
import { AdminSeller, AdminService } from '../../../../core/services/api/admin.service';
import { AuthStateService } from '../../../../core/services/auth-state.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

@Component({ selector: 'app-import-studio', templateUrl: './import-studio.component.html', styleUrls: ['./import-studio.component.scss'] })
export class ImportStudioComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  flows: ImportFlow[] = []; selectedFlow: ImportFlow | null = null; history: ImportJobStatus[] = []; loadingHistory = false;
  sellerId = '';

  // ── Step 3 dropdowns: destination category and (admin-only) destination seller.
  // Values stay UUIDs; users pick a human-readable name instead of pasting UUIDs.
  categories: Category[] = [];
  sellers: AdminSeller[] = [];
  isAdmin = false;
  loadingCategories = false;
  loadingSellers = false;

  /** Flattened dropdown options — child categories are indented under their parent. */
  get categoryOptions(): { id: string; label: string }[] {
    const label = (name: string, depth: number): string => (depth > 0 ? '— '.repeat(depth) + name : name);
    const flatten = (nodes: Category[], depth: number, out: { id: string; label: string }[]): void => {
      for (const node of nodes) {
        out.push({ id: node.id, label: label(node.name, depth) });
        const children = this.categories.filter(c => c.parentId === node.id);
        flatten(children, depth + 1, out);
      }
    };
    const roots = this.categories.filter(c => !c.parentId);
    const options: { id: string; label: string }[] = [];
    flatten(roots, 0, options);
    // Fallback: any category whose parent is missing/unknown still appears (unindented).
    if (options.length < this.categories.length) {
      const known = new Set(options.map(o => o.id));
      for (const c of this.categories) if (!known.has(c.id)) options.push({ id: c.id, label: c.name });
    }
    return options;
  }

  /** Seller options only matter for admins; sellers import into their own account. */
  get sellerOptions(): AdminSeller[] {
    return this.isAdmin ? this.sellers : [];
  }
  loadingFlows = true; formOpen = false; editingId: string | null = null; saving = false;
  flowForm: FormGroup; step = 0; previewing = false; products: ScrapedProduct[] = []; selectedUrls = new Set<string>(); scrapeErrors: string[] = []; previewReady = false;
  sourceHtml = ''; sourcePreviewUrl = ''; sourceLoading = false; selectorMode: 'listing' | 'detail' = 'listing'; visualField: ImportFieldConfig | null = null; visualSelectionEnabled = false;
  @ViewChild('sourceCanvas') sourceCanvas?: ElementRef<HTMLElement>;

  // ── Visual tag picker: load the source site in a sandboxed iframe and pick
  // listing selectors by clicking the real page — TASK-BE-STUDIO-001.
  // Targets: 'card' | 'link' | 'next' | 'prev' | 'field:<sourceField>'.
  pickerOpen = false;
  pickerLoading = false;
  pickerError = '';
  /** Live extraction preview: outlines what the current selectors match inside the iframe. */
  pickerPreviewEnabled = true;
  pickerMode: 'listing' | 'detail' = 'listing';
  pickerDetailUrl = '';
  pickerTarget = 'card';
  pickerLastPicked = '';
  private pickerIframe?: HTMLIFrameElement;
  private pickerMessageHandler?: (event: MessageEvent) => void;

  validating = false; validationSummary: ImportValidationSummary | null = null; importing = false; currentJob: ImportJobStatus | null = null; retrying = false;
  expandedHistoryJob: string | null = null;
  mappingFields: ImportFieldConfig[] = []; rules: ImportFlowConfig['validationRules']; categoryId = ''; errorMessage = ''; successMessage = ''; private pollTimer: any;
  readonly steps = ['فلو', 'انتخاب محصولات', 'نگاشت فیلدها', 'قوانین', 'پیش‌نمایش', 'ایمپورت', 'تاریخچه'];

  constructor(private readonly fb: FormBuilder, private readonly importStudio: ImportStudioService, private readonly confirm: ConfirmService, private readonly ngZone: NgZone, private readonly ref: ChangeDetectorRef, private readonly categoryService: CategoryService, private readonly adminService: AdminService, private readonly authState: AuthStateService) {
    this.flowForm = this.fb.group({ siteName: ['', Validators.required], sourceUrl: ['', [Validators.required, Validators.pattern('https?://.+')]] });
    this.rules = this.defaultFlowConfig().validationRules;
  }
  ngOnInit(): void { this.loadFlows(); this.loadDropdownData(); }

  /** Loads category list for the step-3 dropdown; sellers list only for admins. */
  private loadDropdownData(): void {
    this.loadingCategories = true;
    this.categoryService.getCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: paged => { this.categories = paged?.items ?? []; this.loadingCategories = false; },
      error: () => { this.loadingCategories = false; }
    });
    this.authState.currentUser$.pipe(take(1)).subscribe(user => {
      this.isAdmin = (user?.role ?? '').toLowerCase() === 'admin';
      if (!this.isAdmin) return;
      this.loadingSellers = true;
      this.adminService.getSellers({ page: 1, pageSize: 200 }).pipe(takeUntil(this.destroy$)).subscribe({
        next: r => { this.sellers = r.data?.items ?? []; this.loadingSellers = false; },
        error: () => { this.loadingSellers = false; }
      });
    });
  }
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
    const config = flow.flowConfig ?? this.defaultFlowConfig(); this.mappingFields = [...(config.fields ?? [])].map(f => ({ ...f, scope: f.scope ?? 'Both' })); this.rules = { ...this.defaultFlowConfig().validationRules, ...(config.validationRules ?? {}) };
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

  /** Loads the site for visual tag selection (listing page or a product's detail page). */
  openPicker(mode: 'listing' | 'detail' = 'listing', url?: string): void {
    if (!this.selectedFlow || this.pickerLoading) return;
    this.errorMessage = ''; this.successMessage = '';
    const pageUrl = (url ?? this.selectedFlow.sourceUrl ?? '').trim();
    if (!/^https?:\/\//i.test(pageUrl)) { this.errorMessage = 'ابتدا آدرس معتبر صفحه را وارد کنید'; return; }

    this.pickerMode = mode;
    this.pickerDetailUrl = mode === 'detail' ? pageUrl : '';
    this.pickerOpen = true;
    this.pickerLoading = true;
    this.pickerError = '';
    this.pickerLastPicked = '';
    this.pickerTarget = this.firstUndonePickerTarget();
    this.ensurePickerListener();
    this.ref.markForCheck();

    // Defer so the iframe mount point from *ngIf is rendered first.
    setTimeout(() => {
      this.importStudio.getSourceHtml(this.selectedFlow!.id, pageUrl).pipe(takeUntil(this.destroy$)).subscribe({
        next: r => {
          if (r.isSuccess && r.data) this.buildPickerIframe(r.data, pageUrl);
          else { this.pickerLoading = false; this.pickerError = r.errorMessage ?? 'دریافت سایت منبع ناموفق بود'; }
          this.ref.markForCheck();
        },
        error: e => { this.pickerLoading = false; this.pickerError = e?.message ?? 'دریافت سایت منبع ناموفق بود'; this.ref.markForCheck(); }
      });
    });
  }

  setPickerTarget(target: string): void { this.pickerTarget = target; this.pickerLastPicked = ''; }

  /** Toggle for the live extraction preview overlay inside the picker iframe. */
  togglePickerPreview(): void {
    this.pickerPreviewEnabled = !this.pickerPreviewEnabled;
    this.postPickerHighlights();
  }

  /** One highlighted selector group shown on the source page. */
  private buildPickerHighlights(): { selector: string; color: string; label: string }[] {
    const cfg = this.selectedFlow?.flowConfig;
    const out: { selector: string; color: string; label: string }[] = [];
    const add = (selector: string | undefined, color: string, label: string): void => {
      const trimmed = (selector ?? '').trim();
      // `xpath:` selectors cannot be evaluated with querySelectorAll in the browser.
      if (trimmed && !trimmed.toLowerCase().startsWith('xpath:')) out.push({ selector: trimmed, color, label });
    };
    if (this.pickerMode === 'detail') {
      this.mappingFields.filter(f => f.scope !== 'Listing').forEach(f => add(f.selector, '#0d9488', this.fieldLabel(f)));
    } else {
      add(cfg?.productItemSelector, '#6c3fc5', 'کارت محصول');
      add(cfg?.productLinkSelector, '#2563eb', 'لینک');
      this.mappingFields.filter(f => f.scope !== 'Detail').forEach(f => add(f.selector, '#0d9488', this.fieldLabel(f)));
      add(cfg?.nextPageSelector, '#16a34a', 'صفحه بعدی');
      add(cfg?.prevPageSelector, '#d97706', 'صفحه قبلی');
    }
    return out;
  }

  /** Pushes (or clears) the highlight overlay inside the picker iframe. */
  private postPickerHighlights(): void {
    const win = this.pickerIframe?.contentWindow;
    if (!win) return;
    const highlights = this.pickerPreviewEnabled ? this.buildPickerHighlights() : [];
    win.postMessage({ source: 'toolidi-picker-host', type: 'highlight', payload: { highlights } }, '*');
  }

  /** Ordered pick targets for the current mode (listing: card → link → fields → next/prev). */
  pickerChips(): { key: string; label: string; done: boolean; active: boolean }[] {
    const cfg = this.selectedFlow?.flowConfig;
    const chip = (key: string, label: string, done: boolean) => ({ key, label, done, active: this.pickerTarget === key });
    if (this.pickerMode === 'detail') {
      return this.mappingFields.filter(f => f.scope !== 'Listing')
        .map(f => chip('field:' + f.sourceField, this.fieldLabel(f), !!f.selector));
    }
    const chips = [
      chip('card', 'کارت محصول', !!(cfg?.productItemSelector)),
      chip('link', 'لینک محصول', !!(cfg?.productLinkSelector)),
    ];
    this.mappingFields.filter(f => f.scope !== 'Detail')
      .forEach(f => chips.push(chip('field:' + f.sourceField, this.fieldLabel(f), !!f.selector)));
    chips.push(chip('next', 'صفحه بعدی', !!(cfg?.nextPageSelector)));
    chips.push(chip('prev', 'صفحه قبلی', !!(cfg?.prevPageSelector)));
    return chips;
  }

  private firstUndonePickerTarget(): string {
    const undone = this.pickerChips().find(c => !c.done);
    return undone ? undone.key : (this.pickerMode === 'detail' ? 'field:' + (this.mappingFields.find(f => f.scope !== 'Listing')?.sourceField ?? 'title') : 'card');
  }

  private nextUndonePickerTarget(after: string): string {
    const chips = this.pickerChips();
    const idx = chips.findIndex(c => c.key === after);
    const undone = chips.slice(idx + 1).find(c => !c.done);
    return undone ? undone.key : '';
  }

  /** Persian label for a mapping field chip. */
  fieldLabel(field: ImportFieldConfig): string {
    const labels: Record<string, string> = { title: 'عنوان', price: 'قیمت', images: 'تصویر', image: 'تصویر', imageurl: 'تصویر', description: 'توضیحات', sku: 'SKU', brand: 'برند', variations: 'تنوع' };
    return labels[(field.sourceField || '').toLowerCase()] ?? field.sourceField;
  }

  /** Opens the visual picker targeting one specific field (on the right page for its scope). */
  pickFieldVisual(field: ImportFieldConfig): void {
    if (!this.selectedFlow) return;
    if (field.scope === 'Detail') {
      const url = this.products.find(p => this.selectedUrls.has(p.url))?.url;
      this.openPicker('detail', url || this.selectedFlow.sourceUrl);
    } else {
      this.openPicker('listing');
    }
    this.pickerTarget = 'field:' + field.sourceField;
  }

  private ensurePickerListener(): void {
    if (this.pickerMessageHandler) return;
    this.pickerMessageHandler = (event: MessageEvent) => this.handlePickerMessage(event);
    window.addEventListener('message', this.pickerMessageHandler);
  }

  /**
   * Renders fetched HTML via srcdoc so the picker bootstrap can be injected.
   *
   * The document is sanitized first: scripts are stripped because the page
   * keeps an opaque `allow-scripts` origin — re-running the source site's own
   * hydration code (React/Next.js/Vue) inside the iframe would re-render and
   * blank the DOM, which is exactly why the picker used to show an empty page.
   * Links are pointed at the source origin so relative images/CSS still load,
   * and the sandbox keeps the remote page from reaching the dashboard.
   */
  private buildPickerIframe(html: string, listingUrl: string): void {
    const sanitized = this.sanitizeSourceHtml(html);
    const head = `<base href="${listingUrl}">\n<style>img,video{max-width:100%;height:auto}</style>\n<script>${this.pickerBootstrap(listingUrl)}<\/script>`;
    const htmlTagIndex = sanitized.search(/<html[^>]*>/i);
    const doc = htmlTagIndex >= 0 ? sanitized.replace(/<html[^>]*>/i, m => m + head) : head + sanitized;

    this.pickerIframe = document.createElement('iframe');
    // allow-scripts only: the page keeps an opaque origin, so source-site
    // resources cannot reach the dashboard, while the picker can postMessage us.
    this.pickerIframe.setAttribute('sandbox', 'allow-scripts');
    this.pickerIframe.setAttribute('title', 'پیش‌نمایش سایت منبع');
    this.pickerIframe.srcdoc = doc;
    this.pickerIframe.addEventListener('load', () => {
      this.ngZone.run(() => { this.pickerLoading = false; this.ref.markForCheck(); });
    });
    this.tryMountIframe(10);
  }

  /**
   * Makes the source document safe and useful for visual selector picking:
   * removes every <script> (no server-side hydration), strips event-handler
   * attributes and <noscript> duplicates, and drops <meta http-equiv=refresh>.
   * Static markup (tags/classes/structure) is left untouched — that is what
   * selectors are picked against.
   */
  private sanitizeSourceHtml(html: string): string {
    return html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<script\b[^>]*\/>/gi, '')
      .replace(/<noscript\b[^>]*>([\s\S]*?)<\/noscript\s*>/gi, '$1')
      .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
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
      '    // Highlight-preview boxes carry the exact outlined element; the real page element is resolved host-side.',
      "    var picked = el.getAttribute && el.getAttribute('data-tag') ? el : null;",
      "    var tag = (picked || el).tagName.toLowerCase();",
      "    if (!picked && (tag === 'html' || tag === 'body')) return;",
      "    var link = (picked || el).closest ? (picked || el).closest('a[href]') : null;",
      "    post('pick', { selector: pathSelector(picked || el), card: picked ? picked.getAttribute('data-tag') : cardSelectorFor(el), link: linkFor(picked || el), tag: tag, href: link ? link.href : null, page: PAGE });",
      '  }, true);',
      "  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);",
      '  var overlay = null;',
      '  var lastHighlights = null;',
      '  function clearHighlights() {',
      '    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);',
      '    overlay = null;',
      '  }',
      '  function renderHighlights(list) {',
      '    clearHighlights();',
      '    lastHighlights = list || null;',
      '    if (!list || !list.length) return;',
      '    overlay = document.createElement("div");',
      '    overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:0;pointer-events:auto;z-index:2147483646;";',
      '    document.documentElement.appendChild(overlay);',
      '    for (var i = 0; i < list.length; i++) {',
      '      var item = list[i];',
      '      if (!item || !item.selector) continue;',
      '      var matches = null;',
      '      try { matches = document.querySelectorAll(item.selector); } catch (err) { continue; }',
      '      if (!matches || !matches.length) continue;',
      '      var total = matches.length;',
      '      var shown = Array.prototype.slice.call(matches, 0, 40);',
      '      item.tag = compact(shown[0]);',
      '      for (var j = 0; j < shown.length; j++) {',
      '        var box = shown[j].getBoundingClientRect();',
      '        if (!box || (box.width === 0 && box.height === 0)) continue;',
      '        var div = document.createElement("div");',
      '        div.style.cssText = "position:absolute;border:2px solid " + item.color + ";background:" + item.color + "26;border-radius:4px;cursor:pointer;transition:background .1s;box-sizing:border-box;left:" + (box.left + window.pageXOffset) + "px;top:" + (box.top + window.pageYOffset) + "px;width:" + box.width + "px;height:" + box.height + "px;";',
      '        div.setAttribute("data-tag", item.tag);',
      '        div.setAttribute("data-color", item.color);',
      '        div.addEventListener("mouseenter", function () { this.style.backgroundColor = this.getAttribute("data-color"); });',
      '        div.addEventListener("mouseleave", function () { this.style.backgroundColor = this.getAttribute("data-color") + "26"; });',
      '        overlay.appendChild(div);',
      '      }',
      '      var first = shown[0].getBoundingClientRect();',
      '      if (!first) continue;',
      '      var badge = document.createElement("div");',
      '      badge.style.cssText = "position:absolute;direction:rtl;background:" + item.color + ";color:#fff;font:bold 11px/1.5 Tahoma,sans-serif;padding:1px 8px;border-radius:999px;white-space:nowrap;pointer-events:none;box-shadow:0 1px 4px rgba(0,0,0,.25);left:" + (first.left + window.pageXOffset) + "px;top:" + Math.max(0, first.top + window.pageYOffset - 18) + "px;";',
      '      badge.textContent = item.label + " (" + total + ")";',
      '      overlay.appendChild(badge);',
      '    }',
      '  }',
      '  window.addEventListener("message", function (e) {',
      '    var d = e.data;',
      '    if (!d || d.source !== "toolidi-picker-host") return;',
      '    if (d.type === "highlight") renderHighlights(d.payload && d.payload.highlights);',
      '    else if (d.type === "clear-highlights") renderHighlights(null);',
      '  });',
      '  window.addEventListener("resize", function () { if (lastHighlights) renderHighlights(lastHighlights); });',
      '  window.addEventListener("load", function () { if (lastHighlights) renderHighlights(lastHighlights); });',
      "  post('ready', {});",
      '})();'
    ].join('\n');
  }

  /** Handles postMessage events coming from the picker iframe. */
  private handlePickerMessage(event: MessageEvent): void {
    if (!this.pickerIframe || event.source !== this.pickerIframe.contentWindow) return;
    const data = event.data as { source?: string; type?: string; payload?: { selector?: string; card?: string; link?: string; tag?: string } } | null;
    if (!data || data.source !== 'toolidi-picker') return;
    if (data.type === 'ready') { this.ngZone.run(() => { this.pickerLoading = false; this.postPickerHighlights(); this.ref.markForCheck(); }); return; }
    if (data.type === 'pick' && data.payload?.selector) {
      this.ngZone.run(() => { this.applyPick(data.payload as { selector: string; card?: string; link?: string; tag?: string }); this.ref.markForCheck(); });
    }
  }

  /** Maps a picked element to the scraper's selector semantics. */
  private applyPick(payload: { selector: string; card?: string; link?: string; tag?: string }): void {
    const cfg = this.selectedFlow?.flowConfig;
    if (!cfg) return;

    const fieldKey = (target: string): string | null => target.startsWith('field:') ? target.slice('field:'.length) : null;

    if (this.pickerTarget === 'card') {
      // Preview-box picks carry the exact outlined card selector; raw page picks
      // fall back to the sibling-repeated ancestor detected in the iframe.
      const fallback = payload.selector.split(' ').filter(Boolean).pop() ?? '';
      cfg.productItemSelector = payload.tag || payload.card || fallback;
      if (!cfg.productLinkSelector?.trim()) cfg.productLinkSelector = payload.link || 'a';
      cfg.autoDetect = false;
      this.pickerLastPicked = cfg.productItemSelector;
      this.successMessage = 'کارت محصول ثبت شد؛ حالا روی لینک یک محصول کلیک کنید';
    } else if (this.pickerTarget === 'link') {
      cfg.productLinkSelector = payload.link || 'a';
      cfg.autoDetect = false;
      this.pickerLastPicked = cfg.productLinkSelector;
      this.successMessage = 'لینک محصول ثبت شد';
    } else if (this.pickerTarget === 'next') {
      cfg.nextPageSelector = payload.selector;
      this.pickerLastPicked = cfg.nextPageSelector;
      this.successMessage = 'سلکتور «صفحه بعدی» ثبت شد';
    } else if (this.pickerTarget === 'prev') {
      cfg.prevPageSelector = payload.selector;
      this.pickerLastPicked = cfg.prevPageSelector;
      this.successMessage = 'سلکتور «صفحه قبلی» ثبت شد';
    } else if (fieldKey(this.pickerTarget)) {
      const field = this.mappingFields.find(f => f.sourceField === fieldKey(this.pickerTarget));
      if (field) {
        field.selector = payload.selector;
        if (['images', 'image', 'imageurl'].includes(field.sourceField.toLowerCase())) field.attribute = 'src';
        field.scope = this.pickerMode === 'detail' ? 'Detail' : 'Listing';
        this.pickerLastPicked = field.selector;
        this.successMessage = `سلکتور «${this.fieldLabel(field)}» ثبت شد`;
      }
    }

    const next = this.nextUndonePickerTarget(this.pickerTarget);
    if (next) {
      this.pickerTarget = next;
    } else {
      this.successMessage = 'همه سلکتورها ثبت شدند؛ دکمه «ذخیره» را بزنید';
    }
    this.postPickerHighlights();
    this.ref.markForCheck();
  }

  /** Persists the in-memory flow config (selectors, fields, rules) to the backend. */
  saveFlowConfig(onDone?: (ok: boolean) => void): void {
    if (!this.selectedFlow) { onDone?.(false); return; }
    if (this.saving) { onDone?.(true); return; }
    this.saving = true;
    const flow = this.selectedFlow;
    this.importStudio.updateFlow(flow.id, {
      siteName: flow.siteName,
      sourceUrl: flow.sourceUrl,
      flowConfig: this.flowConfig(),
      isActive: flow.isActive,
      actions: flow.actions?.length ? flow.actions : undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.saving = false;
        if (r.isSuccess && r.data) {
          this.selectedFlow = { ...flow, flowConfig: r.data.flowConfig };
          this.mappingFields = [...(r.data.flowConfig.fields ?? [])].map(f => ({ ...f, scope: f.scope ?? 'Both' }));
          this.successMessage = 'تنظیمات فلو ذخیره شد';
          onDone?.(true);
        } else { this.errorMessage = r.errorMessage ?? 'خطا در ذخیره تنظیمات فلو'; onDone?.(false); }
      },
      error: () => { this.saving = false; this.errorMessage = 'خطا در ذخیره تنظیمات فلو'; onDone?.(false); }
    });
  }

  /** Saves picked selectors, closes the picker and runs the listing preview. */
  savePickerAndPreview(): void {
    this.saveFlowConfig(() => { this.closePicker(); this.preview(false); });
  }

  /** Saves the detail-page selectors and returns to the listing view. */
  saveDetailSelectors(): void {
    this.saveFlowConfig(() => { this.closePicker(); });
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
    this.pickerError = '';
  }

  /** Keeps the flow's detected config for reuse, then re-opens source for detail selection. */
  goToDetails(): void {
    if (!this.selectedFlow || !this.selectedCount) { this.errorMessage = 'حداقل یک محصول انتخاب کنید'; return; }
    this.saveFlowConfig();
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
  validate(advanceToPreview = false): void {
    if (!this.selectedFlow) return;
    this.validating = true;
    this.importStudio.validate(this.selectedFlow.id, [...this.selectedUrls], this.categoryId || this.emptyCategory()).pipe(takeUntil(this.destroy$)).subscribe({
      next: r => {
        this.validating = false;
        this.validationSummary = r.data ?? null;
        // Validation is async; advance only once the summary is back so the
        // wizard moves forward on the same click.
        if (advanceToPreview && this.validationSummary) this.step = 4;
      },
      error: () => { this.validating = false; this.errorMessage = 'خطا در اعتبارسنجی'; }
    });
  }
  goToImport(): void { if (!this.validationSummary?.isValid || !this.categoryId) { this.errorMessage = 'اعتبارسنجی موفق و CategoryId الزامی است'; return; } this.step = 5; }
  startImport(): void {
    if (!this.selectedFlow || this.importing) return;
    this.importing = true;
    const doImport = (): void => {
      this.importStudio.import(this.selectedFlow!.id, { productUrls: [...this.selectedUrls], categoryId: this.categoryId || this.emptyCategory(), uploadImages: true, publishStatus: 'Draft', ...(this.sellerId ? { sellerId: this.sellerId } : {}) }).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { if (r.isSuccess && r.data) { this.successMessage = `${r.data.queuedProducts} محصول در صف قرار گرفت`; this.pollJob(r.data.jobId); } else { this.importing = false; this.errorMessage = r.errorMessage ?? 'خطا در شروع ایمپورت'; } }, error: () => { this.importing = false; this.errorMessage = 'خطا در شروع ایمپورت'; } });
    };
    // The import runs against the PERSISTED flow config, so save the in-memory
    // selectors first (preview may have used unsaved overrides).
    this.saveFlowConfig(ok => { if (ok) doImport(); else this.importing = false; });
  }
  retry(): void { this.errorMessage = 'Retry در قرارداد فعلی backend وجود ندارد؛ ابتدا باید API retry پیاده‌سازی شود.'; }
  loadHistory(): void { if (!this.selectedFlow) return; this.loadingHistory = true; this.importStudio.getJobs(this.selectedFlow.id).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { this.history = r.data ?? []; this.loadingHistory = false; }, error: () => { this.loadingHistory = false; this.errorMessage = 'خطا در دریافت تاریخچه'; } }); }
  private pollJob(jobId: string): void { this.stopPolling(); this.pollTimer = interval(2000).pipe(takeUntil(this.destroy$)).subscribe(() => this.importStudio.getJobStatus(jobId).pipe(takeUntil(this.destroy$)).subscribe({ next: r => { if (r.isSuccess && r.data) { this.currentJob = r.data; const terminal = ['Completed', 'CompletedWithErrors', 'Failed', 'Cancelled'].includes(r.data.status); const imagesStillUploading = terminal && !r.data.completedAt; if (terminal && !imagesStillUploading) { this.stopPolling(); this.importing = false; } } }, error: () => this.stopPolling() })); }
  private stopPolling(): void { this.pollTimer?.unsubscribe(); this.pollTimer = null; }
  private emptyCategory(): string { return '00000000-0000-0000-0000-000000000000'; }
  private flowConfig(): ImportFlowConfig {
    const base = this.selectedFlow?.flowConfig ?? this.defaultFlowConfig();
    // Merge over the loaded config so browser rendering, pagination and other
    // persisted settings are preserved instead of being reset to defaults.
    return { ...this.defaultFlowConfig(), ...base, fields: this.mappingFields.length ? this.mappingFields : base.fields, validationRules: this.rules };
  }
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

  /** Map an import job status to a studio-badge color token used in the history table. */
  jobStatusBadge(status: string): string {
    switch (status) {
      case 'Completed': return 'success';
      case 'CompletedWithErrors': return 'warning';
      case 'Failed': return 'danger';
      case 'Queued':
      case 'Running': return 'gray';
      case 'Cancelled': return 'danger';
      default: return 'gray';
    }
  }
}
