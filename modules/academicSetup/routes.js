const academicRoutes = [
    {
      path: '/academic',
      component: () => import('@/layouts/variations/Backend.vue'),
      meta: { requiresAuth: true, role: 'ADMIN' },
      children: [
        { path: 'programs', name: 'admin-programs', component: () => import('./views/ProgramsView.vue') },
        { path: 'halls', name: 'admin-halls', component: () => import('./views/HallsView.vue') },
      ]
    }
  ];
  export default academicRoutes;