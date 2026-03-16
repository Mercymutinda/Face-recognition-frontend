/**
 * Require Authentication Middleware
 * 
 * Checks if the user is authenticated.
 * Use in route meta: requiresAuth: true or requiresAuth(auth) => auth.isAuthenticated
 */

import { useAuthStore } from '../stores/auth.js';

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const requireAuth = () => {
  const authStore = useAuthStore();
  return authStore.isAuthenticated;
};

/**
 * Validate authentication with custom guard
 * @param  {Object} to - Vue Router destination
 * @param  {Object} from - Vue Router source
 * @param  {Function} next - Vue Router next
 * @returns {void}
 * 
 * Usage in router:
 * {
 *   path: '/protected',
 *   component: MyComponent,
 *   beforeEnter: useRequireAuthGuard()
 * }
 */
export const useRequireAuthGuard = () => {
  return (to, from, next) => {
    const authStore = useAuthStore();
    
    if (!authStore.isAuthenticated) {
      next('/auth/login');
    } else {
      next();
    }
  };
};

export default requireAuth;
