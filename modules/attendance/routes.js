const attendanceRoutes = [
    {
      path: "attendance/scan",
      name: "attendance-scanner",
      component: () => import("./views/AttendanceScannerView.vue"),
      meta: { requiresPermission: "attendance:start_session" },
    },
    {
      path: "attendance/logs",
      name: "attendance-logs",
      component: () => import("./views/AttendanceLogsView.vue"),
      meta: { requiresPermission: "attendance:read" },
    },
  ];
  
  export default attendanceRoutes;