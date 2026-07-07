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
  // Configurable-column values, keyed by field id.
  fieldValues: Record<string, string>;
}

/** Shape returned by GET /api/students. */
interface StudentResponse {
  id: string;
  name: string;
  studentNo: string;
  rfid: string | null;
  fieldValues: Record<string, string> | null;
  photo: string | null;
}

/** Fields sent to POST /api/students (as multipart/form-data). */
export interface NewStudent {
  idNumber: string;
  name: string;
  rfid: string;
  fieldValues: Record<string, string>;
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
    const form = this.toFormData(input);

    return this.http
      .post<StudentResponse>(`${this.apiUrl}/students`, form)
      .pipe(
        tap((created) => {
          this.students.update((list) => [this.toStudent(created), ...list]);
        }),
      );
  }

  update(id: string, input: NewStudent): Observable<StudentResponse> {
    const form = this.toFormData(input);

    return this.http
      .put<StudentResponse>(`${this.apiUrl}/students/${id}`, form)
      .pipe(
        tap((updated) => {
          this.students.update((list) =>
            list.map((s) => (s.id === id ? this.toStudent(updated) : s)),
          );
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

  private toFormData(input: NewStudent): FormData {
    const form = new FormData();
    form.append('idNumber', input.idNumber);
    form.append('name', input.name);
    form.append('rfid', input.rfid);
    form.append('fieldValues', JSON.stringify(input.fieldValues ?? {}));
    if (input.image) {
      form.append('image', input.image);
    }
    return form;
  }

  private toStudent(r: StudentResponse): Student {
    return {
      id: r.id,
      name: r.name,
      studentNo: r.studentNo,
      rfid: r.rfid ?? null,
      fieldValues: r.fieldValues ?? {},
      photo: r.photo ? `${this.fileHost}${r.photo}` : undefined,
    };
  }
}
