const faceRoutes = [
    {
      path: "face/register",
      name: "face-registration",
      component: () => import("./views/FaceRegistrationView.vue"),
      meta: { requiresPermission: "face:upload" },
    },
  ];
  
  export default faceRoutes;