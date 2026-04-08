const attendanceRoutes = [
  {
    path: "attendance/scan",
    name: "attendance-scanner",
    component: () => import("./views/AttendanceScannerView.vue"),
    // Changed to LECTURER to fit RBAC approach
    meta: { requiresRole: "LECTURER" }, 
  },
  {
    path: "attendance/logs",
    name: "attendance-logs",
    component: () => import("./views/AttendanceLogsView.vue"),
    // Admin only
    meta: { requiresRole: "ADMIN" }, 
  },
];

export default attendanceRoutes;