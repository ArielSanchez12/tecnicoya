/**
 * Servicio de Socket.io
 * TécnicoYa - Frontend
 * Comunicación en tiempo real
 */

import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthServicio } from './auth.servicio';
import { Mensaje, Notificacion, Coordenadas } from '../modelos';

@Injectable({
  providedIn: 'root'
})
export class SocketServicio {
  private socket: Socket | null = null;
  private authServicio = inject(AuthServicio);

  // Subjects para eventos
  private conectadoSubject = new BehaviorSubject<boolean>(false);
  private mensajeSubject = new Subject<Mensaje>();
  private escribiendoSubject = new Subject<{ usuarioId: string; escribiendo: boolean }>();
  private notificacionSubject = new Subject<Notificacion>();
  private ubicacionTecnicoSubject = new Subject<{ tecnicoId: string; ubicacion: Coordenadas }>();
  private tecnicoInstantaneoSubject = new Subject<any>();

  // Observables públicos
  public conectado$ = this.conectadoSubject.asObservable();
  public mensaje$ = this.mensajeSubject.asObservable();
  public escribiendo$ = this.escribiendoSubject.asObservable();
  public notificacion$ = this.notificacionSubject.asObservable();
  public ubicacionTecnico$ = this.ubicacionTecnicoSubject.asObservable();
  public tecnicoInstantaneo$ = this.tecnicoInstantaneoSubject.asObservable();

  /**
   * Escuchar mensajes (alias para compatibilidad)
   */
  escucharMensajes(): Observable<Mensaje> {
    return this.mensaje$;
  }

  /**
   * Escuchar eventos de escribiendo (alias)
   */
  escucharEscribiendo(): Observable<{ usuarioId: string; escribiendo: boolean }> {
    return this.escribiendo$;
  }

  /**
   * Emitir evento de escribiendo (alias)
   */
  emitirEscribiendo(receptorId: string): void {
    this.socket?.emit('escribiendo', { receptorId, escribiendo: true });
  }

  /**
   * Conectar al servidor de sockets
   */
  conectar(): void {
    const token = this.authServicio.obtenerToken();

    if (!token || this.socket?.connected) {
      return;
    }

    this.socket = io(environment.socketUrl, {
      auth: {
        token
      },
      transports: ['websocket'],
      autoConnect: true
    });

    this.configurarEventos();
  }

  /**
   * Desconectar del servidor
   */
  desconectar(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.conectadoSubject.next(false);
    }
  }

  /**
   * Unirse a una sala de chat de trabajo
   */
  unirseChat(trabajoId: string): void {
    this.socket?.emit('unirse_chat', { idTrabajo: trabajoId });
  }

  /**
   * Unirse a chat directo con otro usuario
   */
  unirseChatDirecto(otroUsuarioId: string): void {
    this.socket?.emit('unirse_chat_directo', { idOtroUsuario: otroUsuarioId });
  }

  /**
   * Salir de una sala de chat
   */
  salirChat(trabajoId: string): void {
    this.socket?.emit('salir_chat', { idTrabajo: trabajoId });
  }

  /**
   * Enviar mensaje de chat (trabajo o directo)
   */
  enviarMensaje(destinatario: string, contenido: string, tipo: string = 'texto'): void {
    // Si el destinatario parece ser un ID de trabajo (24 caracteres hex y empieza con número)
    // o si viene de una sala de trabajo, enviamos como idTrabajo
    // De lo contrario, lo tratamos como chat directo (idReceptor)
    this.socket?.emit('enviar_mensaje', {
      idReceptor: destinatario,
      contenido,
      tipo
    });
  }

  /**
   * Enviar mensaje a chat de trabajo
   */
  enviarMensajeTrabajo(trabajoId: string, contenido: string): void {
    this.socket?.emit('enviar_mensaje', {
      idTrabajo: trabajoId,
      contenido
    });
  }

  /**
   * Notificar que está escribiendo
   */
  notificarEscribiendo(trabajoId: string, escribiendo: boolean): void {
    this.socket?.emit('escribiendo', {
      trabajoId,
      escribiendo
    });
  }

  /**
   * Actualizar ubicación del técnico
   */
  actualizarUbicacionTecnico(latitud: number, longitud: number): void {
    this.socket?.emit('actualizar_ubicacion', {
      latitud,
      longitud
    });
  }

  /**
   * Suscribirse a ubicación de técnico en un trabajo
   */
  suscribirseUbicacionTecnico(trabajoId: string): void {
    this.socket?.emit('suscribir_ubicacion_tecnico', trabajoId);
  }

  /**
   * Cancelar suscripción a ubicación
   */
  desuscribirseUbicacionTecnico(trabajoId: string): void {
    this.socket?.emit('desuscribir_ubicacion_tecnico', trabajoId);
  }

  // ===== MÉTODOS DE AYUDA =====

  private obtenerTituloEstado(estado: string): string {
    const titulos: Record<string, string> = {
      'en_camino': '🚗 Técnico en camino',
      'en_progreso': '🔧 Trabajo iniciado',
      'completado': '✅ Trabajo completado'
    };
    return titulos[estado] || '📍 Estado actualizado';
  }

  private obtenerMensajeEstado(estado: string, nombreTecnico?: string): string {
    const nombre = nombreTecnico || 'El técnico';
    const mensajes: Record<string, string> = {
      'en_camino': `${nombre} está en camino a tu ubicación`,
      'en_progreso': `${nombre} ha llegado y comenzó el trabajo`,
      'completado': 'El trabajo ha sido completado. Por favor revisa y aprueba.'
    };
    return mensajes[estado] || 'El estado del trabajo ha cambiado';
  }

  // ===== CONFIGURACIÓN PRIVADA =====

  private configurarEventos(): void {
    if (!this.socket) return;

    // Conexión
    this.socket.on('connect', () => {
      console.log('🔌 Socket conectado');
      this.conectadoSubject.next(true);
    });

    // Desconexión
    this.socket.on('disconnect', () => {
      console.log('🔌 Socket desconectado');
      this.conectadoSubject.next(false);
    });

    // Error
    this.socket.on('error', (error: any) => {
      console.error('❌ Error de socket:', error);
    });

    // Nuevo mensaje de chat (evento principal)
    this.socket.on('nuevo_mensaje', (mensaje: Mensaje) => {
      this.mensajeSubject.next(mensaje);
    });

    // Mensaje recibido (evento alternativo del servidor)
    this.socket.on('recibir_mensaje', (mensaje: any) => {
      // Normalizar el formato del mensaje
      const mensajeNormalizado: Mensaje = {
        _id: mensaje._id || mensaje.id,
        trabajo: mensaje.idTrabajo || '',
        remitente: mensaje.idEmisor || mensaje.emisor,
        emisor: mensaje.idEmisor || mensaje.emisor,
        receptor: mensaje.idReceptor || mensaje.receptor,
        contenido: mensaje.contenido,
        tipo: mensaje.tipoMensaje || 'texto',
        leido: mensaje.leido || false,
        fechaCreacion: mensaje.fechaEnvio || mensaje.createdAt || new Date().toISOString(),
        createdAt: mensaje.fechaEnvio || mensaje.createdAt || new Date().toISOString()
      };
      this.mensajeSubject.next(mensajeNormalizado);
    });

    // Usuario escribiendo
    this.socket.on('usuario_escribiendo', (data: { usuarioId: string; escribiendo: boolean }) => {
      this.escribiendoSubject.next(data);
    });

    // Nueva notificación
    this.socket.on('notificacion', (notificacion: Notificacion) => {
      this.notificacionSubject.next(notificacion);
    });

    // Ubicación del técnico actualizada
    this.socket.on('ubicacion_tecnico', (data: { tecnicoId: string; ubicacion: Coordenadas }) => {
      this.ubicacionTecnicoSubject.next(data);
    });

    // Técnico instantáneo disponible
    this.socket.on('tecnico_instantaneo_disponible', (data: any) => {
      this.tecnicoInstantaneoSubject.next(data);
    });

    // Nueva cotización recibida
    this.socket.on('nueva_cotizacion', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'nueva_cotizacion',
        titulo: 'Nueva cotización',
        mensaje: `Has recibido una nueva cotización`,
        datos: data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Cotización aceptada
    this.socket.on('cotizacion_aceptada', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'cotizacion_aceptada',
        titulo: '¡Cotización aceptada!',
        mensaje: `Tu cotización ha sido aceptada`,
        datos: data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Trabajo completado
    this.socket.on('trabajo_completado', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'trabajo_completado',
        titulo: 'Trabajo completado',
        mensaje: `El trabajo ha sido completado`,
        datos: data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Pago liberado (técnico)
    this.socket.on('pago_liberado', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'pago_liberado',
        titulo: data.titulo || '💰 ¡Pago recibido!',
        mensaje: data.mensaje || `Has recibido tu pago`,
        datos: data.datos || data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Pago procesado (cliente)
    this.socket.on('pago_procesado', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'pago_procesado',
        titulo: data.titulo || '✅ Pago procesado',
        mensaje: data.mensaje || `Tu pago ha sido procesado`,
        datos: data.datos || data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Puntos ganados (cliente)
    this.socket.on('puntos_ganados', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'puntos_ganados',
        titulo: data.titulo || '🎁 ¡Puntos ganados!',
        mensaje: data.mensaje || `Has ganado puntos de fidelidad`,
        datos: data.datos || data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Estado actualizado
    this.socket.on('estado_actualizado', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'estado_actualizado',
        titulo: data.titulo || '📍 Estado actualizado',
        mensaje: data.mensaje || `El estado del trabajo ha cambiado`,
        datos: data.datos || data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Trabajo estado actualizado (para actualizaciones en tiempo real)
    this.socket.on('trabajo_estado_actualizado', (data: any) => {
      console.log('📍 Estado del trabajo actualizado:', data);
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'trabajo_estado_actualizado',
        titulo: this.obtenerTituloEstado(data.nuevoEstado),
        mensaje: this.obtenerMensajeEstado(data.nuevoEstado, data.tecnico?.nombre),
        datos: data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Cotización cancelada (cliente)
    this.socket.on('cotizacion_cancelada', (data: any) => {
      console.log('❌ Cotización cancelada:', data);
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'cotizacion_cancelada',
        titulo: data.titulo || '❌ Cotización cancelada',
        mensaje: data.mensaje || `Una cotización ha sido cancelada`,
        datos: data.datos || data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });

    // Cotización no seleccionada (técnico)
    this.socket.on('cotizacion_no_seleccionada', (data: any) => {
      this.notificacionSubject.next({
        _id: Date.now().toString(),
        tipo: 'cotizacion_no_seleccionada',
        titulo: 'Cotización no seleccionada',
        mensaje: data.mensaje || `El cliente eligió otra cotización`,
        datos: data.datos || data,
        leida: false,
        fechaCreacion: new Date().toISOString()
      });
    });
  }
}
