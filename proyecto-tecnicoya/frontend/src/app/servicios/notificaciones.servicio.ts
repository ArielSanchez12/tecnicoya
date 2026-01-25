/**
 * Servicio de Notificaciones
 * TécnicoYa - Frontend
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RespuestaApi } from '../modelos';

export interface Notificacion {
  _id: string;
  tipo: 'servicio' | 'cotizacion' | 'mensaje' | 'resena' | 'sistema' | 'promocion';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: Date;
  referencia?: {
    tipo: string;
    id: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesServicio {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  // Estado reactivo
  private _notificaciones = new BehaviorSubject<Notificacion[]>([]);
  notificaciones$ = this._notificaciones.asObservable();

  // Signal para contador de no leídas
  contadorNoLeidas = signal(0);

  /**
   * Obtener todas las notificaciones
   */
  obtenerNotificaciones(): Observable<RespuestaApi<Notificacion[]>> {
    return this.http.get<RespuestaApi<Notificacion[]>>(this.apiUrl).pipe(
      tap(res => {
        if (res.datos) {
          this._notificaciones.next(res.datos);
          this.actualizarContador(res.datos);
        }
      })
    );
  }

  /**
   * Marcar notificación como leída
   */
  marcarLeida(id: string): Observable<RespuestaApi<Notificacion>> {
    return this.http.put<RespuestaApi<Notificacion>>(`${this.apiUrl}/${id}/leer`, {}).pipe(
      tap(() => {
        const notificaciones = this._notificaciones.value.map(n =>
          n._id === id ? { ...n, leida: true } : n
        );
        this._notificaciones.next(notificaciones);
        this.actualizarContador(notificaciones);
      })
    );
  }

  /**
   * Marcar todas como leídas
   */
  marcarTodasLeidas(): Observable<RespuestaApi<any>> {
    return this.http.put<RespuestaApi<any>>(`${this.apiUrl}/leer-todas`, {}).pipe(
      tap(() => {
        const notificaciones = this._notificaciones.value.map(n => ({ ...n, leida: true }));
        this._notificaciones.next(notificaciones);
        this.contadorNoLeidas.set(0);
      })
    );
  }

  /**
   * Eliminar notificación
   */
  eliminar(id: string): Observable<RespuestaApi<any>> {
    return this.http.delete<RespuestaApi<any>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const notificaciones = this._notificaciones.value.filter(n => n._id !== id);
        this._notificaciones.next(notificaciones);
        this.actualizarContador(notificaciones);
      })
    );
  }

  /**
   * Agregar nueva notificación (desde socket)
   */
  agregarNotificacion(notificacion: Notificacion): void {
    const notificaciones = [notificacion, ...this._notificaciones.value];
    this._notificaciones.next(notificaciones);
    this.actualizarContador(notificaciones);
  }

  /**
   * Actualizar contador de no leídas
   */
  private actualizarContador(notificaciones: Notificacion[]): void {
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    this.contadorNoLeidas.set(noLeidas);
  }

  /**
   * Solicitar permiso de notificaciones push
   */
  async solicitarPermisosPush(): Promise<boolean> {
    if ('Notification' in window) {
      const permiso = await Notification.requestPermission();
      return permiso === 'granted';
    }
    return false;
  }
}
