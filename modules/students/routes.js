const studentRoutes = [
  {
    path: "students",
    name: "students",
    component: () => import("./views/StudentsView.vue"),
    meta: { requiresRole: "ADMIN" },
  },
  {
    path: "students/profile",
    name: "profile",
    component: () => import("./views/StudentProfileView.vue"),
    meta: { requiresRole: "STUDENT" },
  },
];

export default studentRoutes;
