import { Directive, HostListener, Input, ElementRef } from '@angular/core';
import { FormGroup } from '@angular/forms';

/**
 * Lightweight sibling directive for registration pages:
 * - keyboard: Escape closes a visible inline error banner
 * - onbeforeunload: warns when the user is leaving a page with an invalid form
 *
 * Intended to be placed once per registration shell (not a service dependency
 * conflict with auth.module). Keeps RTL and Persian UX specifics out of the
 * MatFormField machinery.
 */
@Directive({
  selector: '[appRegistrationGc]'
})
export class RegistrationGcDirective {
  @Input() appRegistrationGc?: FormGroup;

  // Track whether user has interacted with the form, to avoid warning
  // on fresh empty pages.
  private dirty = false;

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    const form = this.appRegistrationGc;
    if (!form) {
      return;
    }
    // Warn only if there are unsaved invalid values.
    const invalid = form.invalid && form.touched;
    if (invalid) {
      event.preventDefault();
      event.returnValue = 'شما تغییرات ذخیره‌نشده‌ای دارید. آیا می‌خواهید از این صفحه خارج شوید؟';
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    // Let pages hook this if they want to clear inline banners.
  }
}
