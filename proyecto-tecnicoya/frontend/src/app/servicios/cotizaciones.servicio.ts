/**
 * Servicio de Cotizaciones
 * TécnicoYa - Frontend
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Cotizacion,
  RespuestaApi,
  RespuestaPaginada
} from '../modelos';

export interface DatosCotizacion {
  servicio: string;
  precio?: number;
  montoTotal?: number;
  descripcion: string;
  tiempoEstimado: {
    valor: number;
    unidad: 'horas' | 'dias';
  };
  desglose?: {
    concepto: string;
    cantidad: number;
    precioUnitario: number;
    subtotal?: number;
  }[];
  materiales?: {
    nombre: string;
    cantidad: number;
    precioUnitario: number;
    incluido?: boolean;
  }[];
  garantia?: number;
  notasAdicionales?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CotizacionesServicio {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cotizaciones`;

  /**
   * Crear cotización (técnico)
   */
  crearCotizacion(datos: DatosCotizacion): Observable<RespuestaApi<Cotizacion>> {
    return this.http.post<RespuestaApi<Cotizacion>>(this.apiUrl, datos);
  }

  /**
   * Obtener cotizaciones de un servicio (cliente)
   */
  obtenerCotizacionesServicio(servicioId: string): Observable<RespuestaApi<Cotizacion[]>> {
    return this.http.get<RespuestaApi<Cotizacion[]>>(`${this.apiUrl}/servicio/${servicioId}`);
  }

  /**
   * Obtener mis cotizaciones (técnico)
   */
  obtenerMisCotizaciones(filtros?: {
    estado?: string;
    pagina?: number;
    limite?: number;
  }): Observable<RespuestaPaginada<Cotizacion>> {
    let params = new HttpParams();

    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());

    return this.http.get<RespuestaPaginada<Cotizacion>>(`${this.apiUrl}/mis-cotizaciones`, { params });
  }

  /**
   * Aceptar cotización (cliente)
   */
  aceptarCotizacion(cotizacionId: string, opciones?: {
    conGarantia?: boolean;
    fechaProgramada?: string;
    metodoPago?: string;
  }): Observable<RespuestaApi<any>> {
    return this.http.put<RespuestaApi<any>>(`${this.apiUrl}/${cotizacionId}/aceptar`, opciones || {});
  }

  /**
   * Rechazar cotización (cliente)
   */
  rechazarCotizacion(cotizacionId: string): Observable<RespuestaApi<Cotizacion>> {
    return this.http.put<RespuestaApi<Cotizacion>>(`${this.apiUrl}/${cotizacionId}/rechazar`, {});
  }

  /**
   * Cancelar cotización (técnico)
   */
  cancelarCotizacion(cotizacionId: string): Observable<RespuestaApi<Cotizacion>> {
    return this.http.put<RespuestaApi<Cotizacion>>(`${this.apiUrl}/${cotizacionId}/cancelar`, {});
  }

  /**
   * Editar cotización existente (técnico)
   */
  editarCotizacion(cotizacionId: string, datos: Partial<DatosCotizacion>): Observable<RespuestaApi<Cotizacion>> {
    return this.http.put<RespuestaApi<Cotizacion>>(`${this.apiUrl}/${cotizacionId}`, datos);
  }

  /**
   * Obtener mi cotización para un servicio específico (técnico)
   */
  obtenerMiCotizacionPorServicio(servicioId: string): Observable<RespuestaApi<Cotizacion | null>> {
    return this.http.get<RespuestaApi<Cotizacion | null>>(`${this.apiUrl}/mi-cotizacion/${servicioId}`);
  }
}
