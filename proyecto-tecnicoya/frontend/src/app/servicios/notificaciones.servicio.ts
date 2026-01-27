/**
 * Servicio de Notificaciones
 * TécnicoYa - Frontend
 * Con soporte para Firebase Cloud Messaging
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RespuestaApi } from '../modelos';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

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
   * Usa Firebase Cloud Messaging para push notifications
   */
  async solicitarPermisosPush(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        return await this.configurarPushNativo();
      }
      
      // En web, usar Notification API
      if ('Notification' in window) {
        const permiso = await Notification.requestPermission();
        return permiso === 'granted';
      }
    } catch (error) {
      console.warn('⚠️ Error en permisos push:', error);
    }
    return false;
  }

  /**
   * Configurar Push Notifications nativas con Firebase
   */
  private async configurarPushNativo(): Promise<boolean> {
    try {
      // Verificar permisos actuales
      let permStatus = await PushNotifications.checkPermissions();
      console.log('🔔 Estado permisos push:', permStatus.receive);
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        console.log('❌ Permisos de push denegados');
        return false;
      }
      
      // Configurar listeners ANTES de registrar
      this.configurarListenersPush();
      
      // Registrar con Firebase
      await PushNotifications.register();
      console.log('✅ Push notifications registradas con Firebase');
      
      return true;
    } catch (error) {
      console.error('❌ Error configurando push:', error);
      return false;
    }
  }

  /**
   * Configurar listeners para eventos de push
   */
  private configurarListenersPush(): void {
    // Token recibido de Firebase
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('🔑 Token FCM:', token.value);
      this.guardarTokenPush(token.value);
    });

    // Error en registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Error registro FCM:', error);
    });

    // Notificación recibida (app en foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('📨 Push recibida:', notification);
      const notif: Notificacion = {
        _id: notification.id || Date.now().toString(),
        tipo: 'sistema',
        titulo: notification.title || 'Nueva notificación',
        mensaje: notification.body || '',
        leida: false,
        fecha: new Date()
      };
      this.agregarNotificacion(notif);
    });

    // Usuario tocó la notificación
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('👆 Acción en notificación:', action);
    });
  }

  /**
   * Guardar token FCM en el backend
   */
  private guardarTokenPush(token: string): void {
    // Guardar localmente
    localStorage.setItem('fcm_token', token);
    
    // Enviar al backend si está autenticado
    this.http.post(`${this.apiUrl}/token-push`, { token }).subscribe({
      next: () => console.log('✅ Token FCM guardado en backend'),
      error: (err) => console.warn('⚠️ No se pudo guardar token FCM:', err)
    });
  }
}
