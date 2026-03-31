const examRoutes = [
    {
      path: "exam/auth",
      name: "exam-auth",
      component: () => import("./views/ExamAuthView.vue"),
      meta: { requiresPermission: "exam_auth:verify" },
    },
    {
      path: "exam/logs",
      name: "exam-auth-logs",
      component: () => import("./views/ExamAuthLogsView.vue"),
      meta: { requiresPermission: "exam_auth:read" },
    },
    {
      path: "exam/my",
      name: "exam-history",
      component: () => import("./views/ExamHistoryView.vue"),
      meta: { requiresPermission: "exam_auth:read_own" },
    },
  ];
  
  export default examRoutes;