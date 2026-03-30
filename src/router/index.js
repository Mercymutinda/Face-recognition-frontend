// src/router/index.js
// Route guards use authStore.userCan() — backend decides access.

import { createRouter, createWebHashHistory } from "vue-router";
import NProgress from "nprogress/nprogress.js";

// Layouts
import LayoutSimple from "@/layouts/variations/Simple.vue";
import LayoutBackend from "@/layouts/variations/Backend.vue";

// Auth views
const SignIn3View = () => import("~/auth/views/SignIn3View.vue");
const SignUp3View = () => import("~/auth/views/SignUp3View.vue");
const Lock3View = () => import("~/auth/views/Lock3View.vue");
const Reminder3View = () => import("~/auth/views/Reminder3View.vue");

// Dashboard
const DashboardView = () => import("@/views/backend/DashboardView.vue");
import academicRoutes from '~/academicSetup/routes.js';



// Users / Roles / Students
const UsersView = () => import("~/users/views/UsersView.vue");
const RolesView = () => import("~/roles/views/RolesView.vue");
const StudentsView = () => import("~/students/views/StudentsView.vue");
const StudentProfileView = () =>
  import("~/students/views/StudentProfileView.vue");

// Attendance
const AttendanceScannerView = () =>
  import("~/attendance/views/AttendanceScannerView.vue");
const AttendanceLogsView = () =>
  import("~/attendance/views/AttendanceLogsView.vue");
const AttendanceHistoryView = () =>
  import("~/attendance/views/AttendanceHistoryView.vue");
const AttendanceReportsView = () =>
  import("~/attendance/views/AttendanceReportsView.vue");

// Face Recognition / Exam Auth
const FaceRegistrationView = () =>
  import("~/faceRecognition/views/FaceRegistrationView.vue");
const ExamAuthView = () => import("~/exams/views/ExamAuthView.vue");
const ExamAuthLogsView = () =>
  import("~/exams/views/ExamAuthLogsView.vue");
const ExamHistoryView = () =>
  import("~/exams/views/ExamHistoryView.vue");

// Errors
const Error403View = () => import("@/views/errors/403View.vue");
const Error404View = () => import("@/views/errors/404View.vue");

// ── Route permission metadata ──────────────────────────────────────────
// `requiresPermission` — user must have this permission to enter the route.
// Leave empty / omit for public or auth-only routes.

const routes = [
  // ── Auth pages (no sidebar) ─────────────────────────────────────────
  {
    path: "/auth",
    component: LayoutSimple,
    children: [
      { path: "signin3", name: "auth-signin3", component: SignIn3View },
      { path: "signup3", name: "auth-signup3", component: SignUp3View },
      { path: "lock3", name: "auth-lock3", component: Lock3View },
      { path: "reminder", name: "reminder", component: Reminder3View },
    ],
  },

  // ── Errors (no sidebar) ─────────────────────────────────────────────
  {
    path: "/errors",
    component: LayoutSimple,
    children: [
      { path: "403", name: "error-403", component: Error403View },
      { path: "404", name: "error-404", component: Error404View },
    ],
  },

  // ── Authenticated backend routes ────────────────────────────────────
  {
    path: "/",
    component: LayoutBackend,
    meta: { requiresAuth: true },
    children: [
      // Dashboard — all authenticated users
      { path: "", redirect: { name: "dashboard" } },
      { path: "dashboard", name: "dashboard", component: DashboardView },

      // Academic Setup
      ...academicRoutes,
      // User Management
      {
        path: "users",
        name: "users",
        component: UsersView,
        meta: { requiresPermission: "users:read" },
      },
      {
        path: "roles",
        name: "roles",
        component: RolesView,
        meta: { requiresPermission: "roles:read" },
      },
      {
        path: "students",
        name: "students",
        component: StudentsView,
        meta: { requiresPermission: "students:read" },
      },
      {
        path: "profile",
        name: "profile",
        component: StudentProfileView,
        meta: { requiresPermission: "students:read_own" },
      },

      // Attendance
      {
        path: "attendance/scan",
        name: "attendance-scanner",
        component: AttendanceScannerView,
        meta: { requiresPermission: "attendance:start_session" },
      },
      {
        path: "attendance/logs",
        name: "attendance-logs",
        component: AttendanceLogsView,
        meta: { requiresPermission: "attendance:read" },
      },
      {
        path: "attendance/reports",
        name: "attendance-reports",
        component: AttendanceReportsView,
        meta: { requiresPermission: "attendance:report" },
      },
      {
        path: "attendance/my",
        name: "my-attendance",
        component: AttendanceHistoryView,
        meta: { requiresPermission: "attendance:read_own" },
      },

      // Face / Exam Auth
      {
        path: "face/register",
        name: "face-registration",
        component: FaceRegistrationView,
        meta: { requiresPermission: "face:upload" },
      },
      {
        path: "exam/auth",
        name: "exam-auth",
        component: ExamAuthView,
        meta: { requiresPermission: "exam_auth:verify" },
      },
      {
        path: "exam/logs",
        name: "exam-auth-logs",
        component: ExamAuthLogsView,
        meta: { requiresPermission: "exam_auth:read" },
      },
      {
        path: "exam/my",
        name: "exam-history",
        component: ExamHistoryView,
        meta: { requiresPermission: "exam_auth:read_own" },
      },
    ],
  },

  // Catch-all
  { path: "/:pathMatch(.*)*", redirect: { name: "error-404" } },
];

// ── Create router ──────────────────────────────────────────────────────
const router = createRouter({
  history: createWebHashHistory(),
  linkActiveClass: "active",
  linkExactActiveClass: "",
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes,
});

// ── Guards ─────────────────────────────────────────────────────────────
NProgress.configure({ showSpinner: false });

router.beforeEach(async (to, _from, next) => {
  NProgress.start();

  const publicRoutes = [
    "auth-signin3",
    "auth-signup3",
    "reminder",
    "error-403",
    "error-404",
  ];

  // 1. Public routes — always allow
  if (publicRoutes.includes(to.name)) return next();

  // 2. Lazy-load auth store (avoids circular imports)
  const { useAuthStore } = await import("@/stores/authStore");
  const authStore = useAuthStore();

  // 3. Restore session if we have a token but no user yet
  if (authStore.token && !authStore.user) {
    try {
      await authStore.restoreSession();
    } catch (_) {
      /* handled inside */
    }
  }

  // 4. Must be authenticated
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "auth-signin3" });
  }

  // 5. Permission check — backend decided what the user can do
  if (
    to.meta.requiresPermission &&
    !authStore.userCan(to.meta.requiresPermission)
  ) {
    return next({ name: "error-403" });
  }

  next();
});

router.afterEach(() => NProgress.done());

export default router;
