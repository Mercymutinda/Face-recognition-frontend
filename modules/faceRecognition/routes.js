const faceRoutes = [
    {
      path: "face/register",
      name: "face-registration",
      component: () => import("./views/FaceRegistrationView.vue"),
      meta: { requiresRole: "STUDENT" },
    },
  ];
  
  export default faceRoutes;