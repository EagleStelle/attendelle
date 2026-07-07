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
import { HlmInput } from '@spartan-ng/helm/input';
import { AttendanceStore, ScanResponse } from '../attendance/attendance.store';

interface ScannedStudent {
  name: string;
  studentNo: string;
  photo?: string;
}

@Component({
  selector: 'app-attendelle',
  imports: [DatePipe, FormsModule, NgIcon, HlmInput],
  viewProviders: [provideIcons({ lucideSearch, lucideUser })],
  templateUrl: './attendelle.html',
})
export class Attendelle implements OnDestroy {
  private readonly store = inject(AttendanceStore);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // How long a scan result (student card or error state) stays on screen.
  private static readonly RESULT_MS = 3000;

  protected readonly identifier = signal('');
  protected readonly now = signal(new Date());
  protected readonly student = signal<ScannedStudent | null>(null);
  protected readonly error = signal(false);

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('scanInput');
  private timer?: ReturnType<typeof setInterval>;
  private resetTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (this.isBrowser) {
      this.timer = setInterval(() => this.now.set(new Date()), 1000);
      // Keep the scan field focused so RFID keyboard input always lands here.
      afterNextRender(() => this.focusInput());
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }

  protected focusInput(): void {
    this.input()?.nativeElement.focus();
  }

  protected onSubmit(): void {
    const id = this.identifier().trim();
    if (!id) return;

    this.identifier.set('');
    this.focusInput();

    this.store.scan(id).subscribe({
      next: (res: ScanResponse) => {
        this.student.set({
          name: res.name,
          studentNo: res.schoolId,
          photo: this.store.photoUrl(res.photo),
        });
        this.error.set(false);
        this.scheduleReset();
      },
      error: () => {
        this.student.set(null);
        this.error.set(true);
        this.scheduleReset();
      },
    });
  }

  // Clear the shown result after a few seconds, back to the idle state.
  private scheduleReset(): void {
    if (!this.isBrowser) return;
    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.student.set(null);
      this.error.set(false);
    }, Attendelle.RESULT_MS);
  }

  protected initials(name: string): string {
    const parts = name.replace(',', '').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
