/**
 * Servicio de Servicios (Solicitudes)
 * TécnicoYa - Frontend
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Servicio,
  RespuestaApi,
  RespuestaPaginada,
  TipoServicio
} from '../modelos';

@Injectable({
  providedIn: 'root'
})
export class ServiciosServicio {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/servicios`;

  /**
   * Crear nuevo servicio
   */
  crearServicio(datos: FormData | any): Observable<RespuestaApi<Servicio>> {
    return this.http.post<RespuestaApi<Servicio>>(this.apiUrl, datos);
  }

  /**
   * Solicitar técnico instantáneo
   */
  solicitarTecnicoInstantaneo(datos: FormData): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/instantaneo`, datos);
  }

  /**
   * Obtener mis servicios (cliente)
   */
  obtenerMisServicios(filtros?: {
    estado?: string;
    pagina?: number;
    limite?: number;
  }): Observable<RespuestaPaginada<Servicio>> {
    let params = new HttpParams();

    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());

    return this.http.get<RespuestaPaginada<Servicio>>(this.apiUrl, { params });
  }

  /**
   * Obtener servicios disponibles (técnico)
   */
  obtenerServiciosDisponibles(filtros?: {
    tipo?: TipoServicio;
    urgencia?: string;
    latitud?: number;
    longitud?: number;
    radio?: number;
    pagina?: number;
    limite?: number;
  }): Observable<RespuestaPaginada<Servicio>> {
    let params = new HttpParams();

    if (filtros?.tipo) params = params.set('tipo', filtros.tipo);
    if (filtros?.urgencia) params = params.set('urgencia', filtros.urgencia);
    // Usar typeof para permitir coordenadas 0 (que son falsy pero válidas)
    if (typeof filtros?.latitud === 'number') params = params.set('latitud', filtros.latitud.toString());
    if (typeof filtros?.longitud === 'number') params = params.set('longitud', filtros.longitud.toString());
    if (filtros?.radio) params = params.set('radio', filtros.radio.toString());
    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());

    return this.http.get<RespuestaPaginada<Servicio>>(`${this.apiUrl}/disponibles`, { params });
  }

  /**
   * Obtener servicio por ID
   */
  obtenerServicio(id: string): Observable<RespuestaApi<Servicio>> {
    return this.http.get<RespuestaApi<Servicio>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Cancelar servicio
   */
  cancelarServicio(id: string): Observable<RespuestaApi<Servicio>> {
    return this.http.put<RespuestaApi<Servicio>>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  /**
   * Editar servicio existente
   */
  editarServicio(id: string, datos: FormData | any): Observable<RespuestaApi<Servicio>> {
    return this.http.put<RespuestaApi<Servicio>>(`${this.apiUrl}/${id}`, datos);
  }

  /**
   * Aceptar servicio instantáneo (técnico)
   */
  aceptarServicioInstantaneo(id: string): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/${id}/aceptar-inmediato`, {});
  }

  /**
   * Buscar técnico instantáneo cercano
   */
  buscarTecnicoInstantaneo(
    tipoServicio: string,
    latitud: number,
    longitud: number
  ): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/buscar-tecnico-instantaneo`, {
      tipoServicio,
      latitud,
      longitud
    });
  }

  /**
   * Crear servicio instantáneo con técnico asignado
   */
  crearServicioInstantaneo(datos: any): Observable<RespuestaApi<Servicio>> {
    return this.http.post<RespuestaApi<Servicio>>(`${this.apiUrl}/instantaneo`, datos);
  }

  /**
   * Actualizar estado del servicio
   */
  actualizarEstado(id: string, estado: string): Observable<RespuestaApi<Servicio>> {
    return this.http.put<RespuestaApi<Servicio>>(`${this.apiUrl}/${id}/estado`, { estado });
  }

  /**
   * Completar servicio
   */
  completarServicio(id: string): Observable<RespuestaApi<Servicio>> {
    return this.http.put<RespuestaApi<Servicio>>(`${this.apiUrl}/${id}/completar`, {});
  }

  /**
   * Subir fotos a un servicio
   */
  subirFotos(servicioId: string, formData: FormData): Observable<RespuestaApi<Servicio>> {
    return this.http.post<RespuestaApi<Servicio>>(`${this.apiUrl}/${servicioId}/fotos`, formData);
  }
}
