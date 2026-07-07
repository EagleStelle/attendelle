import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

export interface FieldOption {
  id: string;
  value: string;
  displayOrder: number;
}

/** An admin-configurable student column (and its combobox options). */
export interface Field {
  id: string;
  name: string;
  displayOrder: number;
  options: FieldOption[];
}

/**
 * Single source of truth for the configurable field definitions. Shared by the
 * Manage page (CRUD), the students table (dynamic columns) and the student
 * dialog (combobox options).
 */
@Injectable({ providedIn: 'root' })
export class FieldsStore {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly apiUrl =
    (import.meta as any).env?.API_URL || 'http://localhost:8080/api';

  readonly fields = signal<Field[]>([]);
  readonly loading = signal(false);

  constructor() {
    if (this.isBrowser) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);
    this.http.get<Field[]>(`${this.apiUrl}/fields`).subscribe({
      next: (rows) => {
        this.fields.set(this.sort(rows));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  createField(name: string): Observable<Field> {
    return this.http
      .post<Field>(`${this.apiUrl}/fields`, { name })
      .pipe(tap((f) => this.fields.update((l) => this.sort([...l, f]))));
  }

  renameField(id: string, name: string): Observable<Field> {
    return this.http
      .put<Field>(`${this.apiUrl}/fields/${id}`, { name })
      .pipe(tap((f) => this.replaceField(f)));
  }

  deleteField(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/fields/${id}`)
      .pipe(tap(() => this.fields.update((l) => l.filter((f) => f.id !== id))));
  }

  reorderFields(ids: string[]): Observable<Field[]> {
    return this.http
      .put<Field[]>(`${this.apiUrl}/fields/reorder`, { ids })
      .pipe(tap((rows) => this.fields.set(this.sort(rows))));
  }

  addOption(fieldId: string, value: string): Observable<Field> {
    return this.http
      .post<Field>(`${this.apiUrl}/fields/${fieldId}/options`, { value })
      .pipe(tap((f) => this.replaceField(f)));
  }

  renameOption(optionId: string, value: string): Observable<Field> {
    return this.http
      .put<Field>(`${this.apiUrl}/fields/options/${optionId}`, { value })
      .pipe(tap((f) => this.replaceField(f)));
  }

  deleteOption(optionId: string): Observable<Field> {
    return this.http
      .delete<Field>(`${this.apiUrl}/fields/options/${optionId}`)
      .pipe(tap((f) => this.replaceField(f)));
  }

  private replaceField(field: Field): void {
    this.fields.update((l) => this.sort(l.map((f) => (f.id === field.id ? field : f))));
  }

  private sort(rows: Field[]): Field[] {
    return [...rows]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((f) => ({
        ...f,
        options: [...(f.options ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
      }));
  }
}
