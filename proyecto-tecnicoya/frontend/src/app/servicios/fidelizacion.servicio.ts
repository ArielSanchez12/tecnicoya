/**
 * Servicio de Fidelización
 * TécnicoYa - Frontend
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RespuestaApi,
  RespuestaPaginada,
  Beneficio,
  Canjeo,
  HistorialPuntos,
  PuntosLealtad,
  NivelLealtad
} from '../modelos';

export interface InfoNivel {
  nivel: NivelLealtad;
  nombre: string;
  puntosActuales: number;
  puntosSiguienteNivel: number;
  progreso: number;
  beneficios: string[];
}

export interface RankingUsuario {
  posicion: number;
  usuario: {
    _id: string;
    nombre: string;
    apellido: string;
    fotoPerfil?: string;
  };
  puntos: number;
  nivel: NivelLealtad;
}

@Injectable({
  providedIn: 'root'
})
export class FidelizacionServicio {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/fidelizacion`;

  /**
   * Obtener mis puntos actuales
   */
  obtenerMisPuntos(): Observable<RespuestaApi<PuntosLealtad>> {
    return this.http.get<RespuestaApi<PuntosLealtad>>(`${this.apiUrl}/puntos`);
  }

  /**
   * Obtener información del nivel actual
   */
  obtenerNivelUsuario(): Observable<RespuestaApi<InfoNivel>> {
    return this.http.get<RespuestaApi<InfoNivel>>(`${this.apiUrl}/nivel`);
  }

  /**
   * Obtener historial de puntos
   */
  obtenerHistorialPuntos(filtros?: {
    pagina?: number;
    limite?: number;
    tipo?: 'ganados' | 'canjeados' | 'todos';
  }): Observable<RespuestaPaginada<HistorialPuntos>> {
    let params = new HttpParams();

    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());
    if (filtros?.tipo) params = params.set('tipo', filtros.tipo);

    return this.http.get<RespuestaPaginada<HistorialPuntos>>(`${this.apiUrl}/historial`, { params });
  }

  /**
   * Obtener catálogo de beneficios
   */
  obtenerBeneficios(): Observable<RespuestaApi<Beneficio[]>> {
    return this.http.get<RespuestaApi<Beneficio[]>>(`${this.apiUrl}/beneficios`);
  }

  /**
   * Obtener ranking de usuarios
   */
  obtenerRanking(limite?: number): Observable<RespuestaApi<RankingUsuario[]>> {
    let params = new HttpParams();
    if (limite) params = params.set('limite', limite.toString());

    return this.http.get<RespuestaApi<RankingUsuario[]>>(`${this.apiUrl}/ranking`, { params });
  }

  /**
   * Canjear puntos por beneficio
   */
  canjearPuntos(datos: Canjeo): Observable<RespuestaApi<{ puntosRestantes: number }>> {
    return this.http.post<RespuestaApi<{ puntosRestantes: number }>>(`${this.apiUrl}/canjear`, datos);
  }

  /**
   * Obtener toda mi información de fidelización (puntos, nivel, historial)
   */
  obtenerMiFidelizacion(): Observable<RespuestaApi<{ puntos: PuntosLealtad; nivel: InfoNivel }>> {
    return this.http.get<RespuestaApi<{ puntos: PuntosLealtad; nivel: InfoNivel }>>(`${this.apiUrl}/mi-fidelizacion`);
  }
}
