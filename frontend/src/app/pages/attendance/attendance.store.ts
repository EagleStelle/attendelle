import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

export interface AttendanceRecord {
  id: string;
  name: string;
  studentNo: string;
  photo?: string;
  department: string;
  course: string;
  school: string;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

/** Shape returned by GET /api/attendance. */
interface AttendanceRecordResponse {
  id: string;
  name: string;
  studentNo: string;
  photo: string | null;
  department: string | null;
  course: string | null;
  school: string | null;
  date: string;
  timeIn: string;
  timeOut: string | null;
}

/** Shape returned by POST /api/attendance/scan. */
export interface ScanResponse {
  name: string;
  schoolId: string;
  photo: string | null;
  logType: 'ENTRY' | 'EXIT';
}

@Injectable({ providedIn: 'root' })
export class AttendanceStore {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly apiUrl = (import.meta as any).env?.API_URL || 'http://localhost:8080/api';
  // The static file host is the API host without the trailing /api segment.
  private readonly fileHost = this.apiUrl.replace(/\/api\/?$/, '');

  readonly records = signal<AttendanceRecord[]>([]);
  readonly loading = signal(false);

  constructor() {
    if (this.isBrowser) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.http.get<AttendanceRecordResponse[]>(`${this.apiUrl}/attendance`).subscribe({
      next: (rows) => {
        this.records.set(rows.map((r) => this.toRecord(r)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Record an RFID / ID scan on the kiosk. The backend enforces the rule
   * (first scan of the day = time in, later scans = time out). Refreshes the
   * records list on success.
   */
  scan(identifier: string): Observable<ScanResponse> {
    return this.http
      .post<ScanResponse>(`${this.apiUrl}/attendance/scan`, {
        identifier,
        gateName: 'Attendelle',
      })
      .pipe(tap(() => this.load()));
  }

  photoUrl(photo: string | null): string | undefined {
    return photo ? `${this.fileHost}${photo}` : undefined;
  }

  private toRecord(r: AttendanceRecordResponse): AttendanceRecord {
    return {
      id: r.id,
      name: r.name,
      studentNo: r.studentNo,
      photo: this.photoUrl(r.photo),
      department: r.department ?? '',
      course: r.course ?? '',
      school: r.school ?? '',
      date: r.date,
      timeIn: r.timeIn,
      timeOut: r.timeOut,
    };
  }
}
