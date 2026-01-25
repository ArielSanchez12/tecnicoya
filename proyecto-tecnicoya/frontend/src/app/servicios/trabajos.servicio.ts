/**
 * Servicio de Trabajos
 * TécnicoYa - Frontend
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Trabajo,
  RespuestaApi,
  RespuestaPaginada,
  EstadoTrabajo
} from '../modelos';

@Injectable({
  providedIn: 'root'
})
export class TrabajosServicio {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/trabajos`;

  /**
   * Obtener mis trabajos
   */
  obtenerMisTrabajos(filtros?: {
    estado?: EstadoTrabajo;
    pagina?: number;
    limite?: number;
  }): Observable<RespuestaPaginada<Trabajo>> {
    let params = new HttpParams();

    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());

    return this.http.get<RespuestaPaginada<Trabajo>>(this.apiUrl, { params });
  }

  /**
   * Obtener trabajo por ID
   */
  obtenerTrabajo(id: string): Observable<RespuestaApi<Trabajo>> {
    return this.http.get<RespuestaApi<Trabajo>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Confirmar que va en camino (técnico)
   */
  confirmarEnCamino(trabajoId: string): Observable<RespuestaApi<Trabajo>> {
    return this.http.put<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/en-camino`, {});
  }

  /**
   * Iniciar trabajo (técnico)
   */
  iniciarTrabajo(trabajoId: string): Observable<RespuestaApi<Trabajo>> {
    return this.http.put<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/iniciar`, {});
  }

  /**
   * Completar trabajo (técnico)
   */
  completarTrabajo(trabajoId: string, descripcionFinal?: string): Observable<RespuestaApi<Trabajo>> {
    return this.http.put<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/completar`, {
      descripcionFinal
    });
  }

  /**
   * Agregar fotos al trabajo (técnico) - Fotos de evidencia durante/después
   */
  agregarFotos(trabajoId: string, formData: FormData): Observable<RespuestaApi<Trabajo>> {
    return this.http.post<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/fotos`, formData);
  }

  /**
   * Subir fotos ANTES del trabajo (técnico)
   */
  subirFotosAntes(trabajoId: string, formData: FormData): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/${trabajoId}/fotos-antes`, formData);
  }

  /**
   * Subir fotos DESPUÉS del trabajo (técnico)
   */
  subirFotosDespues(trabajoId: string, formData: FormData): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/${trabajoId}/fotos-despues`, formData);
  }

  /**
   * Confirmar pago (cliente)
   */
  confirmarPago(trabajoId: string, metodoPago: string, referenciaPago?: string): Observable<RespuestaApi<Trabajo>> {
    return this.http.put<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/confirmar-pago`, {
      metodoPago,
      referenciaPago
    });
  }

  /**
   * Solicitar garantía (cliente)
   */
  solicitarGarantia(trabajoId: string, descripcionProblema: string): Observable<RespuestaApi<Trabajo>> {
    return this.http.post<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/garantia`, {
      descripcionProblema
    });
  }

  /**
   * Crear disputa
   */
  crearDisputa(trabajoId: string, datos: {
    motivo: string;
    tipo: string;
  }): Observable<RespuestaApi<Trabajo>> {
    return this.http.post<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/disputa`, datos);
  }

  /**
   * Actualizar ubicación del técnico durante el trabajo
   */
  actualizarUbicacionTrabajo(trabajoId: string, latitud: number, longitud: number): Observable<RespuestaApi<void>> {
    return this.http.put<RespuestaApi<void>>(`${this.apiUrl}/${trabajoId}/ubicacion`, {
      latitud,
      longitud
    });
  }

  /**
   * Actualizar estado del trabajo (método genérico)
   */
  actualizarEstado(trabajoId: string, nuevoEstado: EstadoTrabajo, ubicacion?: { latitud: number; longitud: number }): Observable<RespuestaApi<Trabajo>> {
    return this.http.put<RespuestaApi<Trabajo>>(`${this.apiUrl}/${trabajoId}/estado`, {
      nuevoEstado,
      ubicacion
    });
  }

  /**
   * Aprobar trabajo completado (cliente)
   */
  aprobarTrabajo(trabajoId: string): Observable<RespuestaApi<{ pago: any; puntosGanados: number }>> {
    return this.http.put<RespuestaApi<{ pago: any; puntosGanados: number }>>(`${this.apiUrl}/${trabajoId}/aprobar`, {});
  }

  /**
   * Obtener trabajos activos
   */
  obtenerTrabajosActivos(): Observable<RespuestaApi<Trabajo[]>> {
    return this.http.get<RespuestaApi<Trabajo[]>>(`${this.apiUrl}?activos=true`);
  }
}
