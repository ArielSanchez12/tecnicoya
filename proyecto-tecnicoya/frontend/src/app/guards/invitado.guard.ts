/**
 * Guard de Invitado
 * TécnicoYa - Frontend
 * Previene acceso a rutas de login/registro si ya está autenticado
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthServicio } from '../servicios/auth.servicio';

export const invitadoGuard: CanActivateFn = (route, state) => {
  const authServicio = inject(AuthServicio);
  const router = inject(Router);

  const token = authServicio.obtenerToken();
  console.log('🛡️ InvitadoGuard - Token existe:', !!token);

  if (!token) {
    // No hay token, permitir acceso a rutas de invitado (login, registro, etc)
    return true;
  }

  // Ya está autenticado, redirigir al dashboard
  console.log('🔄 Usuario ya autenticado, redirigiendo a /tabs/inicio');
  router.navigate(['/tabs/inicio'], { replaceUrl: true });
  return false;
};
