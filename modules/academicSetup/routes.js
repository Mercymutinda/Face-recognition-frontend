const academicRoutes = [
  {
    path: "academic/programs",
    name: "programs",
    component: () => import("./views/ProgramsView.vue"),
    meta: { requiresPermission: "academic:read" },
  },
  {
    path: "academic/halls",
    name: "halls",
    component: () => import("./views/HallsView.vue"),
    meta: { requiresPermission: "academic:read" },
  },
  {
    path: "academic/classes",
    name: "classes",
    component: () => import("./views/ClassesView.vue"),
    meta: { requiresPermission: "academic:read" },
  },
  {
    path: "academic/units",
    name: "units",
    component: () => import("./views/UnitsView.vue"),
    meta: { requiresPermission: "academic:read" },
  },
  {
    path: "academic/timetable",
    name: "timetable",
    component: () => import("./views/TimetableView.vue"),
    meta: { requiresPermission: "academic:read" },
  },
];

export default academicRoutes;