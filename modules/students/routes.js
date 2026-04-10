// modules/students/routes.js
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
  // ADD THIS NEW ROUTE:
  {
    path: "timetable/my-schedule",
    name: "my-timetable", // Matches the Student sidebar 'to: "timetable"'
    component: () => import("./views/MyTimetableView.vue"),
    meta: { requiresRole: "STUDENT" }, 
  }
];

export default studentRoutes;