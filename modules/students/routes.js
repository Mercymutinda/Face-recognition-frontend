const studentRoutes = [
    {
      path: "students",
      name: "students",
      component: () => import("./views/StudentsView.vue"),
      meta: { requiresPermission: "students:read" },
    },
    {
      path: "students/profile",
      name: "profile",
      component: () => import("./views/StudentProfileView.vue"),
      meta: { requiresPermission: "students:read_own" },
    },
  ];
  
  export default studentRoutes;