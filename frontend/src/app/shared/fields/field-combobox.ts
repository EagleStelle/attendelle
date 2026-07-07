import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import {
  HlmCombobox,
  HlmComboboxContent,
  HlmComboboxEmpty,
  HlmComboboxInput,
  HlmComboboxItem,
  HlmComboboxList,
  HlmComboboxPortal,
  HlmComboboxTrigger,
  HlmComboboxValue,
} from '@spartan-ng/helm/combobox';

/**
 * Single-select, searchable combobox over a flat list of string options.
 * Wraps the spartan helm combobox so the (verbose) composition lives in one
 * place and is reused by every configurable student field.
 */
@Component({
  selector: 'app-field-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HlmCombobox,
    HlmComboboxTrigger,
    HlmComboboxValue,
    HlmComboboxContent,
    HlmComboboxPortal,
    HlmComboboxInput,
    HlmComboboxList,
    HlmComboboxItem,
    HlmComboboxEmpty,
  ],
  template: `
    <hlm-combobox [value]="value()" (valueChange)="value.set($event ?? null)">
      <hlm-combobox-trigger class="w-full justify-between font-normal">
        <hlm-combobox-value [placeholder]="placeholder()" />
      </hlm-combobox-trigger>
      <hlm-combobox-content *hlmComboboxPortal>
        <hlm-combobox-input [placeholder]="'Search ' + placeholder().toLowerCase()" />
        <div hlmComboboxList>
          @for (opt of options(); track opt) {
            <hlm-combobox-item [value]="opt">{{ opt }}</hlm-combobox-item>
          }
          <hlm-combobox-empty>No options.</hlm-combobox-empty>
        </div>
      </hlm-combobox-content>
    </hlm-combobox>
  `,
})
export class FieldCombobox {
  readonly options = input<string[]>([]);
  readonly placeholder = input('Select');
  readonly value = model<string | null>(null);
}
