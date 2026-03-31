import { useAuthStore } from '../stores/authStore.js'; // Ensure 'Store' is in the name

export const hasRole = (roles) => {
  const authStore = useAuthStore();
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  // This uses the action we added to authStore.js
  return rolesArray.some(role => authStore.hasRole(role)); 
};

export const useRequireRoleGuard = (roles) => {
  return (to, from, next) => {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      next('/auth/login');
    } else if (!hasRole(roles)) {
      next('/errors/403');
    } else {
      next();
    }
  };
};