import { createRouter, createWebHashHistory } from "vue-router";
import NProgress from "nprogress/nprogress.js";

// Layouts
import LayoutSimple from "@/layouts/variations/Simple.vue";
import LayoutBackend from "@/layouts/variations/Backend.vue";

// Auth
const SignIn3View = () => import("~/auth/views/SignIn3View.vue");
const SignUp3View = () => import("~/auth/views/SignUp3View.vue");
const Lock3View = () => import("~/auth/views/Lock3View.vue");
const Reminder3View = () => import("~/auth/views/Reminder3View.vue");

// Dashboard
const DashboardView = () => import("@/views/backend/DashboardView.vue");

// Errors
const Error403View = () => import("@/views/errors/403View.vue");
const Error404View = () => import("@/views/errors/404View.vue");

// ✅ MODULE ROUTES
import academicRoutes from "~/academicSetup/routes";
import userRoutes from "~/users/routes";
import roleRoutes from "~/roles/routes";
import studentRoutes from "~/students/routes";
import attendanceRoutes from "~/attendance/routes";
import faceRoutes from "~/faceRecognition/routes";
import examRoutes from "~/exams/routes";

const routes = [
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

  {
    path: "/errors",
    component: LayoutSimple,
    children: [
      { path: "403", name: "error-403", component: Error403View },
      { path: "404", name: "error-404", component: Error404View },
    ],
  },

  {
    path: "/",
    component: LayoutBackend,
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: { name: "dashboard" } },
      { path: "dashboard", name: "dashboard", component: DashboardView },

      
      ...academicRoutes,
      ...userRoutes,
      ...roleRoutes,
      ...studentRoutes,
      ...attendanceRoutes,
      ...faceRoutes,
      ...examRoutes,
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: { name: "error-404" } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

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

  if (publicRoutes.includes(to.name)) return next();

  const { useAuthStore } = await import("@/stores/authStore");
  const authStore = useAuthStore();

  if (authStore.token && !authStore.user) {
    try {
      await authStore.restoreSession();
    } catch (_) {}
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: "auth-signin3" });
  }

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