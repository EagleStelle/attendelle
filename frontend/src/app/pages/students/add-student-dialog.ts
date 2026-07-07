import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideImage,
  lucideLoaderCircle,
  lucideScanLine,
  lucideUpload,
  lucideX,
} from '@ng-icons/lucide';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogHeader, HlmDialogTitle } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { StudentsStore } from './students.store';

@Component({
  selector: 'app-add-student-dialog',
  imports: [FormsModule, NgIcon, HlmButton, HlmInput, HlmLabel, HlmDialogHeader, HlmDialogTitle],
  viewProviders: [
    provideIcons({
      lucideScanLine,
      lucideUpload,
      lucideImage,
      lucideCheck,
      lucideX,
      lucideLoaderCircle,
    }),
  ],
  templateUrl: './add-student-dialog.html',
})
export class AddStudentDialog {
  private readonly store = inject(StudentsStore);
  private readonly dialogRef = inject(BrnDialogRef);

  // Fields in the required order.
  protected readonly idNumber = signal('');
  protected readonly name = signal('');
  protected readonly rfid = signal('');
  protected readonly department = signal('');
  protected readonly course = signal('');
  protected readonly school = signal('');
  protected readonly image = signal<File | null>(null);
  protected readonly imagePreview = signal<string | null>(null);
  protected readonly dragging = signal(false);

  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  private readonly rfidInput = viewChild<ElementRef<HTMLInputElement>>('rfidInput');

  // Keyboard-wedge scan detection.
  private static readonly FAST_KEY_MS = 40; // gap below this = machine, not human
  private static readonly MIN_SCAN_LEN = 5; // shortest string treated as a scan
  private scanBuffer = '';
  private lastKeyTime = 0;
  // Field that received the (slow) first scan char before the burst was detected,
  // so it can be stripped back out on commit.
  private leakEl: HTMLInputElement | HTMLTextAreaElement | null = null;

  constructor() {
    // The RFID reader is a keyboard-wedge device: focusing the RFID input on
    // open lets a scan type straight into it.
    afterNextRender(() => this.rfidInput()?.nativeElement.focus());
  }

  /**
   * Captures RFID keyboard-wedge scans no matter which field has focus and
   * routes them ONLY to the RFID input.
   *
   * The reader types far faster than a human, so once keystrokes arrive faster
   * than FAST_KEY_MS we block them from the focused field and buffer them. The
   * very first char arrives after a normal gap and can slip into the focused
   * field before we know a scan is coming; on Enter we set the RFID value and
   * strip that leaked char back out.
   */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    const rfidEl = this.rfidInput()?.nativeElement ?? null;

    if (event.key === 'Enter') {
      if (this.scanBuffer.length >= AddStudentDialog.MIN_SCAN_LEN) {
        this.rfid.set(this.scanBuffer);
        if (this.leakEl && this.leakEl !== rfidEl) {
          this.leakEl.value = this.leakEl.value.slice(0, -1);
          this.leakEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        event.preventDefault(); // don't submit the form on the scanner's Enter
      }
      this.scanBuffer = '';
      this.leakEl = null;
      return;
    }

    // Only single printable characters are part of a scan.
    if (event.key.length !== 1) return;

    const now = Date.now();
    const dt = now - this.lastKeyTime;
    this.lastKeyTime = now;

    if (dt < AddStudentDialog.FAST_KEY_MS) {
      // Machine-speed key: block it from the focused field, buffer it.
      this.scanBuffer += event.key;
      event.preventDefault();
    } else {
      // Slow key: human typing, or the first char of a scan. Let it through
      // and remember where it landed in case a burst follows.
      this.scanBuffer = event.key;
      const target = event.target as HTMLElement | null;
      this.leakEl =
        (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
        target !== rfidEl
          ? target
          : null;
    }
  }

  // Keep the RFID field from submitting or losing the scanned value on Enter.
  protected onRfidEnter(event: Event): void {
    event.preventDefault();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setImage(input.files?.[0] ?? null);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0] ?? null;
    if (file && file.type.startsWith('image/')) {
      this.setImage(file);
    }
  }

  private setImage(file: File | null): void {
    this.image.set(file);
    const prev = this.imagePreview();
    if (prev) URL.revokeObjectURL(prev);
    this.imagePreview.set(file ? URL.createObjectURL(file) : null);
  }

  protected clearImage(): void {
    const prev = this.imagePreview();
    if (prev) URL.revokeObjectURL(prev);
    this.image.set(null);
    this.imagePreview.set(null);
  }

  protected save(): void {
    if (this.saving()) return;
    this.error.set(null);

    if (!this.idNumber().trim() || !this.name().trim()) {
      this.error.set('ID Number and Name are required.');
      return;
    }

    this.saving.set(true);
    this.store
      .add({
        idNumber: this.idNumber().trim(),
        name: this.name().trim(),
        rfid: this.rfid().trim(),
        department: this.department().trim(),
        course: this.course().trim(),
        school: this.school().trim(),
        image: this.image(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogRef.close('created');
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.error.set(
            typeof err.error === 'string' && err.error
              ? err.error
              : 'Failed to add student. Please try again.',
          );
        },
      });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
