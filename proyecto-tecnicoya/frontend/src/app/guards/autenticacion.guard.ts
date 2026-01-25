/**
 * Guard de Autenticación
 * TécnicoYa - Frontend
 * Protege rutas que requieren autenticación
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServicio } from '../servicios/auth.servicio';

export const autenticacionGuard: CanActivateFn = (route, state) => {
  const authServicio = inject(AuthServicio);
  const router = inject(Router);

  const token = authServicio.obtenerToken();
  console.log('🛡️ AuthGuard - Verificando acceso a:', state.url);
  console.log('🔑 Token existe:', !!token);

  if (token) {
    // Hay token, permitir acceso
    return true;
  }

  // No hay token, redirigir a login
  console.log('❌ No autenticado, redirigiendo a /login');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
