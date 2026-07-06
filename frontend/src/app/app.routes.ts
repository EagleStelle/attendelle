import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Students } from './pages/students/students';
import { AttendanceLogs } from './pages/students/attendance-logs';
import { Attendance } from './pages/attendance/attendance';
import { Placeholder } from './pages/placeholder/placeholder';
import { authGuard } from './shared/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      {
        path: 'students',
        component: Students,
        children: [{ path: ':id/logs', component: AttendanceLogs }],
      },
      { path: 'attendance', component: Attendance },
      {
        path: 'deleted-students',
        component: Placeholder,
        data: { title: 'Deleted Students' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
