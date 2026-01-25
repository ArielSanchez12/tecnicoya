/**
 * Servicio de Reseñas
 * TécnicoYa - Frontend
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Resena, RespuestaApi, RespuestaPaginada } from '../modelos';

export interface DatosResena {
  trabajo: string;
  calificacion: number;
  comentario: string;
  aspectos?: {
    puntualidad?: number;
    calidad?: number;
    comunicacion?: number;
    limpieza?: number;
    profesionalismo?: number;
  };
  recomendaria?: boolean;
}

export interface EstadisticasResenas {
  promedioGeneral: number;
  totalResenas: number;
  distribucion: {
    [key: number]: number;
  };
  promedioAspectos: {
    puntualidad: number;
    calidad: number;
    comunicacion: number;
    limpieza: number;
    profesionalismo: number;
  };
  porcentajeRecomendacion: number;
}

@Injectable({
  providedIn: 'root'
})
export class ResenasServicio {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/resenas`;

  /**
   * Crear reseña (cliente)
   */
  crearResena(datos: DatosResena | FormData): Observable<RespuestaApi<Resena>> {
    return this.http.post<RespuestaApi<Resena>>(this.apiUrl, datos);
  }

  /**
   * Obtener reseñas de un técnico
   */
  obtenerResenasTecnico(tecnicoId: string, filtros?: {
    pagina?: number;
    limite?: number;
    ordenar?: 'reciente' | 'calificacion_alta' | 'calificacion_baja';
  }): Observable<RespuestaPaginada<Resena>> {
    let params = new HttpParams();

    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());
    if (filtros?.ordenar) params = params.set('ordenar', filtros.ordenar);

    return this.http.get<RespuestaPaginada<Resena>>(`${this.apiUrl}/tecnico/${tecnicoId}`, { params });
  }

  /**
   * Obtener estadísticas de reseñas de un técnico
   */
  obtenerEstadisticasTecnico(tecnicoId: string): Observable<RespuestaApi<EstadisticasResenas>> {
    return this.http.get<RespuestaApi<EstadisticasResenas>>(`${this.apiUrl}/tecnico/${tecnicoId}/estadisticas`);
  }

  /**
   * Obtener mis reseñas (cliente o técnico)
   * @param tipo 'enviadas' para reseñas que escribí, 'recibidas' para reseñas que me dieron
   */
  obtenerMisResenas(tipo: 'enviadas' | 'recibidas' = 'enviadas'): Observable<RespuestaApi<Resena[]>> {
    return this.http.get<RespuestaApi<Resena[]>>(`${this.apiUrl}/mis-resenas?tipo=${tipo}`);
  }

  /**
   * Responder a una reseña (técnico)
   */
  responderResena(resenaId: string, respuesta: string): Observable<RespuestaApi<Resena>> {
    return this.http.put<RespuestaApi<Resena>>(`${this.apiUrl}/${resenaId}/responder`, {
      respuesta
    });
  }

  /**
   * Reportar una reseña
   */
  reportarResena(resenaId: string, datos: {
    motivo: 'spam' | 'ofensivo' | 'falso' | 'otro';
    descripcion?: string;
  }): Observable<RespuestaApi<void>> {
    return this.http.post<RespuestaApi<void>>(`${this.apiUrl}/${resenaId}/reportar`, datos);
  }
}
