const userRoutes = [
    {
      path: "users",
      name: "users",
      component: () => import("./views/UsersView.vue"),
      meta: { requiresPermission: "users:read" },
    },
  ];
  
  export default userRoutes;