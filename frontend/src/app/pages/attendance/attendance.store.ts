import { computed, inject, Injectable } from '@angular/core';
import { StudentsStore } from '../students/students.store';

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

@Injectable({ providedIn: 'root' })
export class AttendanceStore {
  private readonly studentsStore = inject(StudentsStore);

  readonly records = computed<AttendanceRecord[]>(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fmtTime = (h: number, m: number, s: number) => {
      const period = h < 12 ? 'AM' : 'PM';
      const hour = h % 12 === 0 ? 12 : h % 12;
      return `${pad(hour)}:${pad(m)}:${pad(s)} ${period}`;
    };

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
