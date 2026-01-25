/**
 * Interceptor de Autenticación
 * TécnicoYa - Frontend
 * Agrega token JWT a las peticiones HTTP
 * 
 * NOTA: No inyectamos AuthServicio directamente para evitar dependencia circular
 * ya que AuthServicio usa HttpClient y el interceptor intercepta HttpClient
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'tecnicoya_token';

export const autenticacionInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Obtener token directamente de localStorage (evita dependencia circular)
  const token = localStorage.getItem(TOKEN_KEY);

  // Si hay token, agregarlo al header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 (no autorizado), limpiar sesión y redirigir
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('tecnicoya_usuario');
        router.navigate(['/login']);
      }

      // Si el error es 403 (prohibido)
      if (error.status === 403) {
        console.error('Acceso denegado');
      }

      return throwError(() => error);
    })
  );
};
