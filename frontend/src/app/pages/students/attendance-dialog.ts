import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronsUpDown,
  lucideChevronUp,
  lucideEraser,
  lucideFileUp,
} from '@ng-icons/lucide';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { infiniteScroll } from '../../shared/infinite-scroll';
import { AttendanceStore } from '../attendance/attendance.store';
import { StudentsStore } from './students.store';

type LogSortKey = 'date' | 'timeIn';

@Component({
  selector: 'app-attendance-logs-dialog',
  imports: [
    FormsModule,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmDialogHeader,
    HlmDialogTitle,
    HlmAvatarImports,
    HlmTableImports,
  ],
  viewProviders: [
    provideIcons({
      lucideEraser,
      lucideFileUp,
      lucideChevronsUpDown,
      lucideChevronUp,
      lucideChevronDown,
    }),
  ],
  templateUrl: './attendance-dialog.html',
})
export class AttendanceLogsDialog {
  private readonly store = inject(StudentsStore);
  private readonly attendance = inject(AttendanceStore);
  private readonly context = injectBrnDialogContext<{ studentId: string }>();

  protected readonly student = this.store.getById(this.context.studentId);

  // Real attendance records for this student, aggregated per day by the API.
  private readonly logs = computed(() => {
    const no = this.student?.studentNo;
    if (!no) return [];
    return this.attendance.records().filter((r) => r.studentNo === no);
  });

  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly sortKey = signal<LogSortKey>('date');
  protected readonly sortAsc = signal(false);
  protected readonly scroll = infiniteScroll();

  constructor() {
    // Reset the reveal window when the filtered result set changes.
    effect(() => {
      this.startDate();
      this.endDate();
      this.scroll.reset();
    });
  }

  protected readonly rows = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    const key = this.sortKey();
    const dir = this.sortAsc() ? 1 : -1;

    return this.logs()
      .filter((l) => (!start || l.date >= start) && (!end || l.date <= end))
      .sort((a, b) => {
        const av = key === 'date' ? a.date : this.toSeconds(a.timeIn);
        const bv = key === 'date' ? b.date : this.toSeconds(b.timeIn);
        return av < bv ? -dir : av > bv ? dir : 0;
      });
  });

  protected initials(name: string): string {
    const parts = name.replace(',', '').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected sortBy(key: LogSortKey): void {
    if (this.sortKey() === key) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortKey.set(key);
      this.sortAsc.set(true);
    }
  }

  protected sortIcon(key: LogSortKey): string {
    if (this.sortKey() !== key) return 'lucideChevronsUpDown';
    return this.sortAsc() ? 'lucideChevronUp' : 'lucideChevronDown';
  }

  protected clear(): void {
    this.startDate.set('');
    this.endDate.set('');
  }

  private toSeconds(time: string): number {
    const [clock, period] = time.split(' ');
    const [h, m, s] = clock.split(':').map(Number);
    let hour = h % 12;
    if (period === 'PM') hour += 12;
    return hour * 3600 + m * 60 + s;
  }
}
