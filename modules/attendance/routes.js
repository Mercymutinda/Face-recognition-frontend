// modules/attendance/routes.js

const attendanceRoutes = [
  // --- ADMIN ROUTES ---
  {
    path: "attendance/logs",
    name: "attendance-logs",
    component: () => import("./views/AttendanceLogsView.vue"),
    meta: { requiresRole: "ADMIN" }, 
  },

  // --- LECTURER ROUTES ---
  {
    path: "attendance/scan",
    name: "attendance-scanner",
    component: () => import("./views/AttendanceScannerView.vue"),
    meta: { requiresRole: "LECTURER" }, 
  },
  {
    path: "attendance/reports",
    name: "reports", // Matches Lecturer sidebar 'to: "reports"'
    component: () => import("./views/AttendanceReportsView.vue"),
    meta: { requiresRole: "LECTURER" }, 
  },

  // --- STUDENT ROUTES ---
  {
    path: "attendance/my-history",
    name: "my-attendance", // Matches Student sidebar 'to: "my-attendance"'
    component: () => import("./views/AttendanceHistoryView.vue"),
    meta: { requiresRole: "STUDENT" }, 
  },
];

export default attendanceRoutes;