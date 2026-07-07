import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideUser } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { AttendanceStore } from '../attendance/attendance.store';
import { Student } from '../students/students.store';

@Component({
  selector: 'app-attendelle',
  imports: [DatePipe, FormsModule, NgIcon, HlmInput, HlmButton],
  viewProviders: [provideIcons({ lucideSearch, lucideUser })],
  templateUrl: './attendelle.html',
})
export class Attendelle implements OnDestroy {
  private readonly store = inject(AttendanceStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly identifier = signal('');
  protected readonly now = signal(new Date());
  protected readonly student = signal<Student | null>(null);
  protected readonly feedback = signal<{ kind: 'in' | 'out' | 'error'; text: string } | null>(null);

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('scanInput');
  private timer?: ReturnType<typeof setInterval>;

  constructor() {
    if (this.isBrowser) {
      this.timer = setInterval(() => this.now.set(new Date()), 1000);
      // Keep the scan field focused so RFID keyboard input always lands here.
      afterNextRender(() => this.focusInput());
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  protected focusInput(): void {
    this.input()?.nativeElement.focus();
  }

  protected onSubmit(): void {
    const id = this.identifier().trim();
    if (!id) return;

    const result = this.store.scan(id);
    this.identifier.set('');
    this.focusInput();

    if (result.status === 'not-found') {
      this.student.set(null);
      this.feedback.set({ kind: 'error', text: `No record found for "${id}".` });
      return;
    }

    this.student.set(result.student);
    this.feedback.set(
      result.status === 'in'
        ? { kind: 'in', text: `Time in recorded at ${result.record.timeIn}.` }
        : { kind: 'out', text: `Time out recorded at ${result.record.timeOut}.` },
    );
  }

  protected initials(name: string): string {
    const parts = name.replace(',', '').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
