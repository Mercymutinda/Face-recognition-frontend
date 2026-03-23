const academicRoutes = [
    {
      path: '/academic',
      component: () => import('@/layouts/variations/Backend.vue'),
      meta: { requiresAuth: true, role: 'ADMIN' },
      children: [
        { path: 'programs', name: 'programs', component: () => import('./views/ProgramsView.vue') },
        { path: 'halls', name: 'halls', component: () => import('./views/HallsView.vue') },
        { path: 'classes', name: 'classes', component: () => import('./views/ClassesView.vue') },
        { path: 'units', name: 'units', component: () => import('./views/UnitsView.vue') },
        { path: 'timetable', name: 'timetable', component: () => import('./views/TimetableView.vue') },
        
      ]
    }
  ];
  export default academicRoutes;