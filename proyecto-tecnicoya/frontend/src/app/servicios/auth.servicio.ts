/**
 * Servicio de Autenticación
 * TécnicoYa - Frontend
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Usuario,
  CredencialesLogin,
  DatosRegistro,
  DatosRegistroTecnico,
  RespuestaAuth,
  RespuestaApi
} from '../modelos';

const TOKEN_KEY = 'tecnicoya_token';
const USUARIO_KEY = 'tecnicoya_usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthServicio {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;

  // Estado reactivo
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.obtenerUsuarioGuardado());
  public usuario$ = this.usuarioSubject.asObservable();
  public usuarioActual$ = this.usuario$; // Alias para compatibilidad

  // Signals para estado local
  public estaAutenticado = signal<boolean>(this.tieneToken());
  public cargando = signal<boolean>(false);

  constructor() {
    // Verificar token al iniciar
    this.verificarEstadoAuth();
  }

  /**
   * Iniciar sesión
   */
  login(credenciales: CredencialesLogin): Observable<RespuestaAuth> {
    this.cargando.set(true);

    return this.http.post<RespuestaAuth>(`${this.apiUrl}/login`, credenciales).pipe(
      tap(respuesta => {
        console.log('📥 Respuesta del login:', respuesta);

        // El backend devuelve { exito, datos: { token, usuario } }
        const token = respuesta.datos?.token || respuesta.token;
        const usuario = respuesta.datos?.usuario || respuesta.usuario;

        if (respuesta.exito && token && usuario) {
          console.log('✅ Guardando sesión para:', usuario.perfil?.nombre);
          this.guardarSesion(token, usuario);
        }
        this.cargando.set(false);
      }),
      catchError(error => {
        this.cargando.set(false);
        throw error;
      })
    );
  }

  /**
   * Registrar nuevo usuario (cliente)
   */
  registrar(datos: DatosRegistro): Observable<RespuestaAuth> {
    this.cargando.set(true);

    // Estructurar datos según lo que espera el backend
    const datosBackend = {
      email: datos.email,
      contrasena: datos.contrasena,
      rol: datos.rol,
      perfil: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: datos.telefono
      }
    };

    return this.http.post<RespuestaAuth>(`${this.apiUrl}/registro`, datosBackend).pipe(
      tap(respuesta => {
        const token = respuesta.datos?.token || respuesta.token;
        const usuario = respuesta.datos?.usuario || respuesta.usuario;

        if (respuesta.exito && token && usuario) {
          this.guardarSesion(token, usuario);
        }
        this.cargando.set(false);
      }),
      catchError(error => {
        this.cargando.set(false);
        throw error;
      })
    );
  }

  /**
   * Registrar nuevo técnico
   */
  registrarTecnico(datos: DatosRegistroTecnico): Observable<RespuestaAuth> {
    this.cargando.set(true);

    // Estructurar datos según lo que espera el backend
    const datosBackend = {
      email: datos.email,
      contrasena: datos.contrasena,
      rol: 'tecnico',
      perfil: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: datos.telefono
      },
      datosTecnico: {
        especialidades: datos.especialidades || [],
        descripcion: datos.descripcion || '',
        emergencia24h: false
      }
    };

    return this.http.post<RespuestaAuth>(`${this.apiUrl}/registro`, datosBackend).pipe(
      tap(respuesta => {
        const token = respuesta.datos?.token || respuesta.token;
        const usuario = respuesta.datos?.usuario || respuesta.usuario;

        if (respuesta.exito && token && usuario) {
          this.guardarSesion(token, usuario);
        }
        this.cargando.set(false);
      }),
      catchError(error => {
        this.cargando.set(false);
        throw error;
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    this.usuarioSubject.next(null);
    this.estaAutenticado.set(false);
    this.router.navigate(['/login']);
  }

  /**
   * Verificar si está autenticado
   */
  verificarAutenticacion(): Observable<RespuestaApi<Usuario>> {
    const token = this.obtenerToken();

    if (!token) {
      return of({ exito: false, mensaje: 'No hay token' });
    }

    return this.http.get<any>(`${this.apiUrl}/verificar`).pipe(
      tap(respuesta => {
        if (respuesta.exito) {
          // El backend puede devolver datos.usuario o datos directamente
          const usuario = respuesta.datos?.usuario || respuesta.datos;
          if (usuario) {
            console.log('✅ Usuario verificado:', usuario.perfil?.nombre);
            this.actualizarUsuario(usuario);
          }
        }
      }),
      catchError(error => {
        console.error('❌ Error verificando token:', error);
        this.logout();
        return of({ exito: false, mensaje: 'Token inválido' });
      })
    );
  }

  /**
   * Obtener token almacenado
   */
  obtenerToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Obtener usuario actual
   */
  obtenerUsuario(): Usuario | null {
    return this.usuarioSubject.getValue();
  }

  /**
   * Alias para obtenerUsuario (compatibilidad)
   */
  obtenerUsuarioActual(): Usuario | null {
    return this.obtenerUsuario();
  }

  /**
   * Obtener rol del usuario
   */
  obtenerRolUsuario(): 'cliente' | 'tecnico' | null {
    const usuario = this.obtenerUsuario();
    return usuario?.rol || null;
  }

  /**
   * Verificar si es técnico
   */
  esTecnico(): boolean {
    return this.obtenerRolUsuario() === 'tecnico';
  }

  /**
   * Verificar si es cliente
   */
  esCliente(): boolean {
    return this.obtenerRolUsuario() === 'cliente';
  }

  /**
   * Actualizar datos del usuario en memoria
   */
  actualizarUsuario(usuario: Usuario): void {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  /**
   * Cargar/refrescar usuario desde el servidor
   * Retorna Observable para poder esperar la respuesta
   */
  cargarUsuario(): Observable<any> {
    return this.verificarAutenticacion();
  }

  // ===== MÉTODOS PRIVADOS =====

  private guardarSesion(token: string, usuario: Usuario): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
    this.estaAutenticado.set(true);
  }

  private tieneToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  private obtenerUsuarioGuardado(): Usuario | null {
    const usuarioStr = localStorage.getItem(USUARIO_KEY);
    if (usuarioStr) {
      try {
        return JSON.parse(usuarioStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  private verificarEstadoAuth(): void {
    if (this.tieneToken()) {
      this.verificarAutenticacion().subscribe();
    }
  }
}
