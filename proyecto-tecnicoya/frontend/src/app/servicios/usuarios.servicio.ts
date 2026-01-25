/**
 * Servicio de Usuarios
 * TécnicoYa - Frontend
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Usuario,
  RespuestaApi,
  RespuestaPaginada,
  TipoServicio,
  TecnicoCercano
} from '../modelos';

@Injectable({
  providedIn: 'root'
})
export class UsuariosServicio {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  /**
   * Obtener perfil propio o de otro usuario
   */
  obtenerPerfil(id?: string): Observable<RespuestaApi<Usuario>> {
    if (id) {
      return this.http.get<RespuestaApi<Usuario>>(`${this.apiUrl}/${id}`);
    }
    return this.http.get<RespuestaApi<Usuario>>(`${this.apiUrl}/perfil`);
  }

  /**
   * Actualizar perfil
   */
  actualizarPerfil(datos: Partial<Usuario>): Observable<RespuestaApi<Usuario>> {
    return this.http.put<RespuestaApi<Usuario>>(`${this.apiUrl}/perfil`, datos);
  }

  /**
   * Subir foto de perfil
   */
  subirFotoPerfil(formData: FormData): Observable<RespuestaApi<{ url: string }>> {
    return this.http.post<RespuestaApi<{ url: string }>>(`${this.apiUrl}/foto`, formData);
  }

  /**
   * Buscar técnicos
   */
  buscarTecnicos(filtros?: {
    especialidad?: TipoServicio;
    latitud?: number;
    longitud?: number;
    radio?: number;
    disponibleAhora?: boolean;
    emergencia24h?: boolean;
    calificacionMinima?: number;
    pagina?: number;
    limite?: number;
  }): Observable<RespuestaPaginada<Usuario>> {
    let params = new HttpParams();

    if (filtros?.especialidad) params = params.set('especialidad', filtros.especialidad);
    if (filtros?.latitud) params = params.set('latitud', filtros.latitud.toString());
    if (filtros?.longitud) params = params.set('longitud', filtros.longitud.toString());
    if (filtros?.radio) params = params.set('radio', filtros.radio.toString());
    if (filtros?.disponibleAhora !== undefined) params = params.set('disponibleAhora', filtros.disponibleAhora.toString());
    if (filtros?.emergencia24h !== undefined) params = params.set('emergencia24h', filtros.emergencia24h.toString());
    if (filtros?.calificacionMinima) params = params.set('calificacionMinima', filtros.calificacionMinima.toString());
    if (filtros?.pagina) params = params.set('pagina', filtros.pagina.toString());
    if (filtros?.limite) params = params.set('limite', filtros.limite.toString());

    return this.http.get<RespuestaPaginada<Usuario>>(`${this.apiUrl}/tecnicos`, { params });
  }

  /**
   * Obtener técnico por ID
   */
  obtenerTecnico(id: string): Observable<RespuestaApi<Usuario>> {
    return this.http.get<RespuestaApi<Usuario>>(`${this.apiUrl}/tecnicos/${id}`);
  }

  /**
   * Buscar técnicos cercanos
   */
  buscarTecnicosCercanos(
    latitud: number,
    longitud: number,
    especialidad?: TipoServicio,
    radio?: number
  ): Observable<RespuestaApi<TecnicoCercano[]>> {
    let params = new HttpParams()
      .set('latitud', latitud.toString())
      .set('longitud', longitud.toString());

    if (especialidad) params = params.set('especialidad', especialidad);
    if (radio) params = params.set('radio', radio.toString());

    return this.http.get<RespuestaApi<TecnicoCercano[]>>(`${this.apiUrl}/tecnicos/cercanos`, { params });
  }

  /**
   * Actualizar ubicación
   */
  actualizarUbicacion(latitud: number, longitud: number): Observable<RespuestaApi<void>> {
    return this.http.put<RespuestaApi<void>>(`${this.apiUrl}/ubicacion`, {
      latitud,
      longitud
    });
  }

  /**
   * Actualizar disponibilidad (técnico)
   */
  actualizarDisponibilidad(disponible: boolean): Observable<RespuestaApi<void>> {
    return this.http.put<RespuestaApi<void>>(`${this.apiUrl}/disponibilidad`, {
      disponibleAhora: disponible
    });
  }

  /**
   * Agregar certificación (técnico)
   */
  agregarCertificacion(formData: FormData): Observable<RespuestaApi<Usuario>> {
    return this.http.post<RespuestaApi<Usuario>>(`${this.apiUrl}/certificaciones`, formData);
  }

  /**
   * Agregar foto al portafolio (técnico)
   */
  agregarFotoPortafolio(formData: FormData): Observable<RespuestaApi<Usuario>> {
    return this.http.post<RespuestaApi<Usuario>>(`${this.apiUrl}/portafolio`, formData);
  }

  /**
   * Eliminar foto del portafolio (técnico)
   */
  eliminarFotoPortafolio(fotoId: string): Observable<RespuestaApi<void>> {
    return this.http.delete<RespuestaApi<void>>(`${this.apiUrl}/portafolio/${fotoId}`);
  }

  /**
   * Retirar fondos (técnico)
   */
  retirarFondos(datos: {
    monto: number;
    banco: string;
    numeroCuenta: string;
    titular: string;
  }): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/retirar-fondos`, datos);
  }

  /**
   * Recalcular fondos basándose en trabajos completados (técnico)
   */
  recalcularFondos(): Observable<RespuestaApi<any>> {
    return this.http.post<RespuestaApi<any>>(`${this.apiUrl}/recalcular-fondos`, {});
  }
}
