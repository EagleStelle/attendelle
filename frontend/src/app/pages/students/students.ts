import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronsUpDown,
  lucideChevronUp,
  lucideClock,
  lucideFileDown,
  lucideFileUp,
  lucidePencil,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideTrash2,
  lucideUpload,
} from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { StudentDialog } from './student-dialog';
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  createAngularTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/angular-table';
import { infiniteScroll } from '../../shared/infinite-scroll';
import { FieldsStore } from '../../shared/fields/fields.store';
import { type Student, StudentsStore } from './students.store';

@Component({
  selector: 'app-students',
  imports: [
    FormsModule,
    RouterLink,
    RouterOutlet,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmCheckbox,
    HlmBadge,
    HlmSeparator,
    HlmTableImports,
    HlmAvatarImports,
  ],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideRefreshCw,
      lucideTrash2,
      lucideUpload,
      lucideFileDown,
      lucideFileUp,
      lucideSearch,
      lucideClock,
      lucidePencil,
      lucideChevronsUpDown,
      lucideChevronUp,
      lucideChevronDown,
    }),
  ],
  templateUrl: './students.html',
  host: { class: 'flex h-full flex-col' },
})
export class Students {
  private readonly store = inject(StudentsStore);
  private readonly fieldsStore = inject(FieldsStore);
  private readonly dialog = inject(HlmDialogService);
  protected readonly data = this.store.students;

  protected readonly sorting = signal<SortingState>([]);
  protected readonly globalFilter = signal('');
  protected readonly rowSelection = signal<RowSelectionState>({});
  protected readonly scroll = infiniteScroll();

  // Columns are driven by the admin-configured fields, sandwiched between the
  // fixed leading (select/name/rfid) and trailing (actions) columns.
  private readonly columns = computed<ColumnDef<Student>[]>(() => {
    const fieldColumns: ColumnDef<Student>[] = this.fieldsStore.fields().map((f) => ({
      id: f.id,
      header: f.name,
      accessorFn: (row: Student) => row.fieldValues[f.id] ?? '',
    }));
    return [
      { id: 'select', enableSorting: false },
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'rfid', header: 'RFID #' },
      ...fieldColumns,
      { id: 'actions', header: 'Action', enableSorting: false },
    ];
  });

  protected readonly table = createAngularTable<Student>(() => ({
    data: this.data(),
    columns: this.columns(),
    state: {
      sorting: this.sorting(),
      globalFilter: this.globalFilter(),
      rowSelection: this.rowSelection(),
    },
    enableRowSelection: true,
    globalFilterFn: 'includesString',
    onSortingChange: (updater) =>
      this.sorting.set(typeof updater === 'function' ? updater(this.sorting()) : updater),
    onGlobalFilterChange: (updater) =>
      this.globalFilter.set(typeof updater === 'function' ? updater(this.globalFilter()) : updater),
    onRowSelectionChange: (updater) =>
      this.rowSelection.set(typeof updater === 'function' ? updater(this.rowSelection()) : updater),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  }));

  constructor() {
    // Reset the reveal window when the filtered result set changes.
    effect(() => {
      this.globalFilter();
      this.scroll.reset();
    });
  }

  protected sortIcon(state: false | 'asc' | 'desc'): string {
    if (state === 'asc') return 'lucideChevronUp';
    if (state === 'desc') return 'lucideChevronDown';
    return 'lucideChevronsUpDown';
  }

  protected openAddStudent(): void {
    this.dialog.open(StudentDialog, { contentClass: 'w-full sm:max-w-md' });
  }

  protected openEditStudent(student: Student): void {
    this.dialog.open(StudentDialog, {
      context: { student },
      contentClass: 'w-full sm:max-w-md',
    });
  }

  protected refresh(): void {
    this.store.load();
  }

  protected deleteStudent(student: Student): void {
    const ok = confirm(`Delete ${student.name} (${student.studentNo})? This cannot be undone.`);
    if (!ok) return;
    this.store.delete(student.id).subscribe({
      error: () => alert('Failed to delete student. Please try again.'),
    });
  }

  protected initials(name: string): string {
    const parts = name.replace(',', '').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
}
