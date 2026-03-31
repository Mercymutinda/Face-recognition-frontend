import { useRequireRoleGuard } from "@/middleware/requireRole"; // <--- ADD THIS
const academicRoutes = [
  {
    path: "academic/programs",
    name: "programs",
    component: () => import("./views/ProgramsView.vue"),
    beforeEnter: useRequireRoleGuard('ADMIN')
  },
  {
    path: "academic/halls",
    name: "halls",
    component: () => import("./views/HallsView.vue"),
    beforeEnter: useRequireRoleGuard('ADMIN')

  },
  {
    path: "academic/classes",
    name: "classes",
    component: () => import("./views/ClassesView.vue"),
    beforeEnter: useRequireRoleGuard('ADMIN')

  },
  {
    path: "academic/units",
    name: "units",
    component: () => import("./views/UnitsView.vue"),
    beforeEnter: useRequireRoleGuard('ADMIN')

  },
  {
    path: "academic/timetable",
    name: "timetable",
    component: () => import("./views/TimetableView.vue"),
    beforeEnter: useRequireRoleGuard('ADMIN')

  },
];

export default academicRoutes;