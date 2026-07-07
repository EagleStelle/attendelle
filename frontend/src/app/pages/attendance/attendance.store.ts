import { computed, inject, Injectable, signal } from '@angular/core';
import { Student, StudentsStore } from '../students/students.store';

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

const pad = (n: number) => n.toString().padStart(2, '0');

const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fmtTime = (h: number, m: number, s: number) => {
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${pad(hour)}:${pad(m)}:${pad(s)} ${period}`;
};

export type ScanResult =
  | { status: 'in' | 'out'; student: Student; record: AttendanceRecord }
  | { status: 'not-found'; student: null; record: null };

@Injectable({ providedIn: 'root' })
export class AttendanceStore {
  private readonly studentsStore = inject(StudentsStore);

  // Records produced by live RFID scans on the Attendelle kiosk page.
  private readonly scanned = signal<AttendanceRecord[]>([]);

  readonly records = computed<AttendanceRecord[]>(() =>
    [...this.scanned(), ...this.mockRecords()].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    ),
  );

  /**
   * Record an RFID / ID scan. First scan of the day is a time in; every
   * subsequent scan that day overwrites the time out with the new time.
   */
  scan(identifier: string): ScanResult {
    const id = identifier.trim();
    if (!id) return { status: 'not-found', student: null, record: null };

    const student = this.studentsStore
      .students()
      .find((s) => s.rfid === id || s.studentNo === id);
    if (!student) return { status: 'not-found', student: null, record: null };

    const now = new Date();
    const date = fmtDate(now);
    const time = fmtTime(now.getHours(), now.getMinutes(), now.getSeconds());

    let status: 'in' | 'out' = 'in';
    let record!: AttendanceRecord;

    this.scanned.update((list) => {
      const idx = list.findIndex((r) => r.studentNo === student.studentNo && r.date === date);
      if (idx === -1) {
        status = 'in';
        record = {
          id: `scan-${student.id}-${date}`,
          name: student.name,
          studentNo: student.studentNo,
          photo: student.photo,
          department: student.department,
          course: student.course,
          school: student.school,
          date,
          timeIn: time,
          timeOut: null,
        };
        return [record, ...list];
      }
      status = 'out';
      record = { ...list[idx], timeOut: time };
      const copy = [...list];
      copy[idx] = record;
      return copy;
    });

    return { status, student, record };
  }

  private readonly mockRecords = computed<AttendanceRecord[]>(() => {
    const hashSeed = (id: string) => {
      let h = 7;
      for (let i = 0; i < id.length; i++) {
        h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
      }
      return h + 7;
    };

    const out: AttendanceRecord[] = [];
    for (const s of this.studentsStore.students()) {
      let seed = hashSeed(s.id);
      const rand = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
      const rows = 2 + Math.floor(rand() * 3);
      const start = new Date(2026, 6, 3);
      for (let i = 0; i < rows; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() - Math.floor(rand() * 150));
        const inH = 6 + Math.floor(rand() * 6);
        const hasOut = rand() > 0.5;
        out.push({
          id: `${s.id}-${i}`,
          name: s.name,
          studentNo: s.studentNo,
          photo: s.photo,
          department: s.department,
          course: s.course,
          school: s.school,
          date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
          timeIn: fmtTime(inH, Math.floor(rand() * 60), Math.floor(rand() * 60)),
          timeOut: hasOut
            ? fmtTime(inH + 4 + Math.floor(rand() * 4), Math.floor(rand() * 60), Math.floor(rand() * 60))
            : null,
        });
      }
    }
    return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  });
}
