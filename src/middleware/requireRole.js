/**
 * Require Role Middleware
 * 
 * Checks if the user has the required roles.
 * Use in route meta: requiresRoles: ['admin', 'moderator']
 */

import { useAuthStore } from '../stores/auth.js';

/**
 * Check if user has at least one of the required roles
 * @param {string|string[]} roles - Role name(s) to check
 * @returns {boolean} True if user has any of the required roles
 */
export const hasRole = (roles) => {
  const authStore = useAuthStore();
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.some(role => authStore.hasRole(role));
};

/**
 * Validate role-based access with custom guard
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Guard function for route
 * 
 * Usage in router:
 * {
 *   path: '/admin',
 *   component: AdminComponent,
 *   beforeEnter: useRequireRoleGuard('admin')
 * }
 */
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

/**
 * Check multiple roles with AND logic (user must have ALL roles)
 * @param {string[]} roles - All required roles
 * @returns {boolean} True if user has all required roles
 */
export const hasAllRoles = (roles) => {
  const authStore = useAuthStore();
  return roles.every(role => authStore.hasRole(role));
};

/**
 * Check multiple roles with OR logic (user must have at least ONE role)
 * @param {string[]} roles - Any required role
 * @returns {boolean} True if user has any required role
 */
export const hasAnyRole = (roles) => {
  return hasRole(roles);
};

export default hasRole;
