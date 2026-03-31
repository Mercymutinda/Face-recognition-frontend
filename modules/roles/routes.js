const roleRoutes = [
    {
      path: "roles",
      name: "roles",
      component: () => import("./views/RolesView.vue"),
      meta: { requiresPermission: "roles:read" },
    },
  ];
  
  export default roleRoutes;