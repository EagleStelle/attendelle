import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronsUpDown,
  lucideChevronUp,
  lucideEraser,
  lucideFileUp,
  lucideSearch,
} from '@ng-icons/lucide';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmTableImports } from '@spartan-ng/helm/table';
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
import { type AttendanceRecord, AttendanceStore } from './attendance.store';

@Component({
  selector: 'app-attendance',
  imports: [
    FormsModule,
    NgIcon,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmCheckbox,
    HlmSeparator,
    HlmTableImports,
    HlmAvatarImports,
  ],
  viewProviders: [
    provideIcons({
      lucideEraser,
      lucideFileUp,
      lucideSearch,
      lucideChevronsUpDown,
      lucideChevronUp,
      lucideChevronDown,
    }),
  ],
  templateUrl: './attendance.html',
  host: { class: 'block h-full' },
})
export class Attendance {
  private readonly store = inject(AttendanceStore);
  private readonly fieldsStore = inject(FieldsStore);

  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly sorting = signal<SortingState>([]);
  protected readonly globalFilter = signal('');
  protected readonly rowSelection = signal<RowSelectionState>({});
  protected readonly scroll = infiniteScroll();

  private readonly dateFiltered = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    return this.store
      .records()
      .filter((r) => (!start || r.date >= start) && (!end || r.date <= end));
  });

  // Configurable columns mirror the students table, sat between Names and Date.
  private readonly columns = computed<ColumnDef<AttendanceRecord>[]>(() => {
    const fieldColumns: ColumnDef<AttendanceRecord>[] = this.fieldsStore.fields().map((f) => ({
      id: f.id,
      header: f.name,
      accessorFn: (row: AttendanceRecord) => row.fieldValues[f.id] ?? '',
    }));
    return [
      { id: 'select', enableSorting: false },
      { accessorKey: 'name', header: 'Names' },
      ...fieldColumns,
      { accessorKey: 'date', header: 'Date' },
      { accessorKey: 'timeIn', header: 'Time in' },
      { accessorKey: 'timeOut', header: 'Time out' },
    ];
  });

  protected readonly table = createAngularTable<AttendanceRecord>(() => ({
    data: this.dateFiltered(),
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
      this.startDate();
      this.endDate();
      this.scroll.reset();
    });
  }

  protected sortIcon(state: false | 'asc' | 'desc'): string {
    if (state === 'asc') return 'lucideChevronUp';
    if (state === 'desc') return 'lucideChevronDown';
    return 'lucideChevronsUpDown';
  }

  protected initials(name: string): string {
    const parts = name.replace(',', '').trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  protected clear(): void {
    this.startDate.set('');
    this.endDate.set('');
  }
}
