import { Injectable, RendererFactory2, Renderer2, Inject, PLATFORM_ID } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';

/**
 * TODO(task: TASK-FE-REGISTRATION-UX-INCOMPLETE):
 * Central helper for the incomplete-registration UX patterns:
 * - onbeforeunload unsaved-changes warning in Persian
 * - invalid-field inline scroll helper (RTL-aware)
 * - success-status-card display text for «در حال بررسی» state
 *
 * This is a lightweight service so registration pages do not need
 * a separate component for each banner. Builds are kept clean
 * because all strings are in Persian and RTL is handled at the CSS layer.
 */
@Injectable({ providedIn: 'root' })
export class RegistrationUxService {
  private renderer: Renderer2 | null = null;
  private readonly platformId: object;

  constructor(rendererFactory: RendererFactory2, @Inject(PLATFORM_ID) platformId: object) {
    this.platformId = platformId;
    if (isPlatformBrowser(platformId)) {
      this.renderer = rendererFactory.createRenderer(null, null);
    }
  }

  /** Enable unsaved-changes warning on the window. */
  enableUnsavedWarning(message: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const handler = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = message;
    };
    (window as unknown as { _regUxBeforeUnload?: (e: BeforeUnloadEvent) => void })._regUxBeforeUnload = handler;
    window.addEventListener('beforeunload', handler, { capture: false });
  }

  /** Remove the unsaved-changes warning. */
  disableUnsavedWarning(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const stored = (window as unknown as { _regUxBeforeUnload?: (e: BeforeUnloadEvent) => void })._regUxBeforeUnload;
    if (typeof stored === 'function') {
      window.removeEventListener('beforeunload', stored);
      delete (window as unknown as { _regUxBeforeUnload?: unknown })._regUxBeforeUnload;
    }
  }

  /** Scroll horizontally/vertically to the first invalid control in an RTL form. */
  scrollToFirstInvalid(form: FormGroup, selectorRoot: HTMLElement): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const invalidControls = Object.entries(form.controls)
      .map(([name, control]) => ({ name, control }))
      .filter((entry) => entry.control.invalid && entry.control.touched);

    if (!invalidControls.length) {
      return;
    }

    const first = invalidControls[0].name;
    const host = selectorRoot.querySelector(`[formcontrolname="${first}"], [formcontrolname="${first}" i], [formcontrolname="${first}"]`);
    const byId = selectorRoot.querySelector(`#${first}`);
    const target = (host ?? byId) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      if (this.renderer) {
        this.renderer.addClass(target, 'registration-ux__focused');
      }
    }
  }

  /** Persian success status card payload. */
  successStatusCard(titleKey: string): { title: string; subtitle: string; estimate: string } {
    return {
      title: titleKey === 'seller'
        ? 'حساب فروشنده ساخته شد'
        : titleKey === 'supplier'
          ? 'حساب تأمین‌کننده ساخته شد'
          : titleKey === 'agent'
            ? 'درخواست کارپخش ثبت شد'
            : 'حساب شما آماده شد',
      subtitle: 'در حال بررسی اطلاعات اولیه، لطفاً در کمتر از چند دقیقه پیگیری شود.',
      estimate: 'کمتر از ۳ دقیقه',
    };
  }
}
