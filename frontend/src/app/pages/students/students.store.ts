import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

export interface Student {
  id: string;
  name: string;
  studentNo: string;
  photo?: string;
  rfid: string | null;
  department: string;
  course: string;
  school: string;
}

/** Shape returned by GET /api/students. */
interface StudentResponse {
  id: string;
  name: string;
  studentNo: string;
  rfid: string | null;
  department: string | null;
  course: string | null;
  school: string | null;
  photo: string | null;
}

/** Fields sent to POST /api/students (as multipart/form-data). */
export interface NewStudent {
  idNumber: string;
  name: string;
  rfid: string;
  department: string;
  course: string;
  school: string;
  image: File | null;
}

@Injectable({ providedIn: 'root' })
export class StudentsStore {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly apiUrl =
    (import.meta as any).env?.API_URL || 'http://localhost:8080/api';
  // The static file host is the API host without the trailing /api segment.
  private readonly fileHost = this.apiUrl.replace(/\/api\/?$/, '');

  readonly students = signal<Student[]>([]);
  readonly loading = signal(false);

  constructor() {
    if (this.isBrowser) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.http.get<StudentResponse[]>(`${this.apiUrl}/students`).subscribe({
      next: (rows) => {
        this.students.set(rows.map((r) => this.toStudent(r)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  add(input: NewStudent): Observable<StudentResponse> {
    const form = new FormData();
    form.append('idNumber', input.idNumber);
    form.append('name', input.name);
    form.append('rfid', input.rfid);
    form.append('department', input.department);
    form.append('course', input.course);
    form.append('school', input.school);
    if (input.image) {
      form.append('image', input.image);
    }

    return this.http
      .post<StudentResponse>(`${this.apiUrl}/students`, form)
      .pipe(
        tap((created) => {
          this.students.update((list) => [this.toStudent(created), ...list]);
        }),
      );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/students/${id}`).pipe(
      tap(() => {
        this.students.update((list) => list.filter((s) => s.id !== id));
      }),
    );
  }

  getById(id: string): Student | undefined {
    return this.students().find((s) => s.id === id);
  }

  private toStudent(r: StudentResponse): Student {
    return {
      id: r.id,
      name: r.name,
      studentNo: r.studentNo,
      rfid: r.rfid ?? null,
      department: r.department ?? '',
      course: r.course ?? '',
      school: r.school ?? '',
      photo: r.photo ? `${this.fileHost}${r.photo}` : undefined,
    };
  }
}
