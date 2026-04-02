const userRoutes = [
  {
    path: "users",
    name: "users", // Correct
    component: () => import("./views/UsersView.vue"),
    meta: { requiresRole: "ADMIN" }, 
  },
  {
    path: "lecturers",
    name: "lecturers", 
    component: () => import( "./views/LecturersView.vue"),
    meta: { requiresRole: "ADMIN" }, 
  },
  {
    path: "students",
    name: "students", 
    component: () => import( "./views/StudentsView.vue"),
    meta: { requiresRole: "ADMIN" }, 
  }
];

export default userRoutes;