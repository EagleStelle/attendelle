import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronDown,
  lucideChevronUp,
  lucidePencil,
  lucidePlus,
  lucideTrash2,
  lucideX,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { Field, FieldsStore } from '../../shared/fields/fields.store';

@Component({
  selector: 'app-manage',
  imports: [FormsModule, NgIcon, HlmButton, HlmInput, HlmCardImports],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideTrash2,
      lucidePencil,
      lucideChevronUp,
      lucideChevronDown,
      lucideCheck,
      lucideX,
    }),
  ],
  templateUrl: './manage.html',
  host: { class: 'flex h-full flex-col' },
})
export class Manage {
  private readonly store = inject(FieldsStore);
  protected readonly fields = this.store.fields;

  protected readonly newFieldName = signal('');
  protected readonly newOption = signal<Record<string, string>>({});

  // Inline field rename state.
  protected readonly editingId = signal<string | null>(null);
  protected readonly editName = signal('');

  protected addField(): void {
    const name = this.newFieldName().trim();
    if (!name) return;
    this.store.createField(name).subscribe({ next: () => this.newFieldName.set('') });
  }

  protected deleteField(field: Field): void {
    const ok = confirm(
      `Delete column "${field.name}"? This removes it from every student. This cannot be undone.`,
    );
    if (!ok) return;
    this.store.deleteField(field.id).subscribe();
  }

  protected move(index: number, dir: -1 | 1): void {
    const list = this.fields();
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const ids = list.map((f) => f.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    this.store.reorderFields(ids).subscribe();
  }

  protected startEdit(field: Field): void {
    this.editingId.set(field.id);
    this.editName.set(field.name);
  }

  protected saveEdit(): void {
    const id = this.editingId();
    const name = this.editName().trim();
    if (!id || !name) return;
    this.store.renameField(id, name).subscribe({ next: () => this.editingId.set(null) });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected optionInput(fieldId: string): string {
    return this.newOption()[fieldId] ?? '';
  }

  protected setOptionInput(fieldId: string, value: string): void {
    this.newOption.update((m) => ({ ...m, [fieldId]: value }));
  }

  protected addOption(field: Field): void {
    const value = this.optionInput(field.id).trim();
    if (!value) return;
    this.store.addOption(field.id, value).subscribe({
      next: () => this.setOptionInput(field.id, ''),
    });
  }

  protected deleteOption(optionId: string): void {
    this.store.deleteOption(optionId).subscribe();
  }
}
