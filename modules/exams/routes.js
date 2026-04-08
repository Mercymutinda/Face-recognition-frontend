// modules/exams/routes.js
const examRoutes = [
  {
    path: "exam/auth",
    name: "exam-auth",
    component: () => import("./views/ExamAuthView.vue"),
    // Changed to role-based access for Lecturers who run the scanner
    meta: { requiresRole: "LECTURER" },
  },
  {
    path: "exam/logs",
    name: "exam-auth-logs",
    component: () => import("./views/ExamAuthLogsView.vue"),
    // Global logs restricted to Admins
    meta: { requiresRole: "ADMIN" }, 
  },
  {
    path: "exam/my",
    name: "exam-history",
    component: () => import("./views/ExamHistoryView.vue"),
    // Restricted to Students viewing their own history
    meta: { requiresRole: "STUDENT" }, 
  },
];

export default examRoutes;