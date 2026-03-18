import { createRouter, createWebHashHistory } from "vue-router";
import NProgress from "nprogress/nprogress.js";
import { useAuthStore } from "@/stores/auth";

// Main layout variations
import LayoutSimple from "@/layouts/variations/Simple.vue";
import LayoutBackend from "@/layouts/variations/Backend.vue";

// Backend: Dashboard
const BackendDashboard = () => import("@/views/backend/DashboardView.vue");

// Specials
const SpecialsMaintenance = () => import("@/views/specials/MaintenanceView.vue");
const SpecialsStatus = () => import("@/views/specials/StatusView.vue");
const SpecialsInstallation = () => import("@/views/specials/InstallationView.vue");
const SpecialsComingSoon = () => import("@/views/specials/ComingSoonView.vue");

// Auth
const AuthSignIn3 = () => import("~/auth/views/SignIn3View.vue");
const AuthSignUp3 = () => import("~/auth/views/SignUp3View.vue");
const AuthLock3 = () => import("~/auth/views/Lock3View.vue");
const ReminderView = () => import("~/auth/views/Reminder3View.vue");

// Errors
const Error400 = () => import("@/views/errors/400View.vue");
const Error401 = () => import("@/views/errors/401View.vue");
const Error403 = () => import("@/views/errors/403View.vue");
const Error404 = () => import("@/views/errors/404View.vue");
const Error500 = () => import("@/views/errors/500View.vue");
const Error503 = () => import("@/views/errors/503View.vue");

// Set all routes
const routes = [
  {
    path: "/",
    component: LayoutBackend,
    // 1. ADD THIS HERE: This instantly protects the Dashboard AND 
    // any future pages you put inside this block!
    meta: { requiresAuth: true }, 
    children: [
      {
        path: "dashboard",
        name: "dashboard",
        component: BackendDashboard,
        // (We removed the buggy middleware array from here)
      },
    ],
  },
  
  {
    path: "/specials",
    component: LayoutSimple,
    children: [
      { path: "maintenance", name: "specials-maintenance", component: SpecialsMaintenance },
      { path: "status", name: "specials-status", component: SpecialsStatus },
      { path: "installation", name: "specials-installation", component: SpecialsInstallation },
      { path: "coming-soon", name: "specials-coming-soon", component: SpecialsComingSoon },
    ],
  },
  
  {
    path: "/auth",
    component: LayoutSimple,
    children: [
      { path: "signin3", name: "auth-signin3", component: AuthSignIn3 },
      { path: "signup3", name: "auth-signup3", component: AuthSignUp3 },
      { path: "lock3", name: "auth-lock3", component: AuthLock3 },
      { path: "reminder", name: "reminder", component: ReminderView },
    ],
  },

  {
    path: "/errors",
    component: LayoutSimple,
    children: [
      { path: "400", name: "error-400", component: Error400 },
      { path: "401", name: "error-401", component: Error401 },
      { path: "403", name: "error-403", component: Error403 },
      { path: "404", name: "error-404", component: Error404 },
      { path: "500", name: "error-500", component: Error500 },
      { path: "503", name: "error-503", component: Error503 },
    ],
  },
];

// Create Router
const router = createRouter({
  history: createWebHashHistory(),
  linkActiveClass: "active",
  linkExactActiveClass: "",
  scrollBehavior() {
    return { left: 0, top: 0 };
  },
  routes,
});

// NProgress
NProgress.configure({ showSpinner: false });

router.beforeResolve((to, from, next) => {
  if (to.name) {
    NProgress.start();
  }
  next();
});

router.afterEach(() => {
  NProgress.done();
});

// GLOBAL AUTH GUARD
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated && sessionStorage.getItem("user.token")) {
    authStore.initStore();
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // ADD THIS: If we are going to the lock screen, do NOT allow a redirect back to dashboard
  if (to.name === 'auth-lock3') {
    return next();
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: "auth-signin3" });
  } else if (to.name === "auth-signin3" && authStore.isAuthenticated) {
    next({ name: "dashboard" });
  } else {
    next();
  }
});

export default router;