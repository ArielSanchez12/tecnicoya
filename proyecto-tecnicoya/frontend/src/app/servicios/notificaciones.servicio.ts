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
   */
  async solicitarPermisosPush(): Promise<boolean> {
    try {
      // Si es plataforma nativa (Android/iOS), usar Capacitor Push Notifications
      if (Capacitor.isNativePlatform()) {
        return await this.configurarPushNativo();
      }
      
      // En web, usar Notification API
      if ('Notification' in window) {
        const permiso = await Notification.requestPermission();
        return permiso === 'granted';
      }
    } catch (error) {
      console.warn('⚠️ Error en permisos push (no crítico):', error);
    }
    return false;
  }

  /**
   * Configurar Push Notifications para Android/iOS
   * NOTA: Requiere Firebase configurado para funcionar completamente
   */
  private async configurarPushNativo(): Promise<boolean> {
    try {
      // Verificar permisos actuales
      let permStatus = await PushNotifications.checkPermissions();
      console.log('🔔 Estado permisos push:', permStatus.receive);
      
      if (permStatus.receive === 'prompt') {
        // Solicitar permisos
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        console.log('❌ Permisos de push denegados');
        return false;
      }
      
      // Intentar registrar - puede fallar si Firebase no está configurado
      try {
        await PushNotifications.register();
        // Escuchar eventos de push
        this.configurarListenersPush();
        console.log('✅ Push notifications configuradas correctamente');
      } catch (registerError) {
        console.warn('⚠️ Push register falló (Firebase no configurado?):', registerError);
        // No es un error crítico, la app sigue funcionando
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Error configurando push notifications:', error);
      return false;
    }
  }

  /**
   * Configurar listeners para eventos de push notifications
   */
  private configurarListenersPush(): void {
    // Cuando se obtiene el token de registro
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('🔑 Token de push recibido:', token.value);
      // Guardar el token en el backend para enviar notificaciones
      this.guardarTokenPush(token.value);
    });

    // Error en el registro
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Error en registro de push:', error);
    });

    // Notificación recibida mientras la app está en primer plano
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('📨 Notificación recibida:', notification);
      // Agregar a la lista de notificaciones
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
      // Aquí se puede navegar a una página específica según la data de la notificación
    });
  }

  /**
   * Guardar el token de push en el backend
   */
  private guardarTokenPush(token: string): void {
    this.http.post(`${this.apiUrl}/token-push`, { token }).subscribe({
      next: () => console.log('✅ Token push guardado en backend'),
      error: (err) => console.error('❌ Error guardando token push:', err)
    });
  }
}
