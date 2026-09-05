import { Component, Input } from '@angular/core';

/** Timeline step definition */
export interface TimelineStep {
  key: string;
  label: string;
  icon: string;
  date?: string;
  completed: boolean;
  current: boolean;
}

@Component({
  selector: 'app-tracking-timeline',
  template: `
    <div class="relative">
      <!-- Vertical line -->
      <div class="absolute right-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

      <div class="space-y-6">
        <div *ngFor="let step of steps; let last = last" class="relative flex items-start gap-4">
          <!-- Circle indicator -->
          <div class="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all"
               [class.bg-green-500]="step.completed"
               [class.text-white]="step.completed"
               [class.bg-primary]="step.current && !step.completed"
               [class.text-white]="step.current && !step.completed"
               [class.bg-gray-200]="!step.completed && !step.current"
               [class.text-gray-500]="!step.completed && !step.current">
            <span *ngIf="step.completed">✓</span>
            <span *ngIf="step.current && !step.completed">{{ step.icon }}</span>
            <span *ngIf="!step.completed && !step.current">{{ step.icon }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 pb-2" [class.opacity-50]="!step.completed && !step.current">
            <p class="font-bold text-secondary"
               [class.text-green-700]="step.completed"
               [class.text-primary]="step.current && !step.completed">
              {{ step.label }}
            </p>
            <p *ngIf="step.date" class="text-xs text-gray-400 mt-0.5">{{ step.date }}</p>
            <p *ngIf="step.current && !step.completed" class="text-xs text-primary font-medium mt-0.5">وضعیت فعلی</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TrackingTimelineComponent {
  @Input() steps: TimelineStep[] = [];
}
