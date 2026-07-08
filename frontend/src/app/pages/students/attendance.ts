import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { AttendanceLogsDialog } from './attendance-dialog';

/**
 * Route-driven opener: visiting /students/:id/logs opens the attendance
 * logs dialog; closing it navigates back to the students list.
 */
@Component({
  selector: 'app-attendance-logs',
  template: '',
})
export class AttendanceLogs {
  private readonly dialog = inject(HlmDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    const studentId = this.route.snapshot.paramMap.get('id') ?? '';
    const ref = this.dialog.open(AttendanceLogsDialog, {
      context: { studentId },
      contentClass: 'sm:max-w-2xl',
    });
    ref.closed$.subscribe(() => this.router.navigate(['/students']));
  }
}
