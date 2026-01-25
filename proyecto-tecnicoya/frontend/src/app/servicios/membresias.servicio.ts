/**
 * Servicio de Membresías
 * TécnicoYa - Frontend
 * Gestión de planes de membresía para técnicos
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PlanMembresia {
  nombre: string;
  precio: number;
  duracionDias: number;
  radioExtendido: number;
  posicionDestacada: boolean;
  badgeVerificado: boolean;
  beneficios: string[];
}

export interface Membresia {
  tipo: 'basico' | 'profesional' | 'premium';
  fechaInicio: string | null;
  fechaVencimiento: string | null;
  radioExtendido: number;
  posicionDestacada: boolean;
  badgeVerificado: boolean;
  estaActiva: boolean;
  diasRestantes: number | null;
  planInfo: PlanMembresia;
  historialPagos?: {
    monto: number;
    fecha: string;
    tipoPlan: string;
    metodoPago: string;
    referencia: string;
  }[];
}

export interface RespuestaPlanes {
  exito: boolean;
  datos: {
    basico: PlanMembresia;
    profesional: PlanMembresia;
    premium: PlanMembresia;
  };
}

export interface RespuestaMembresia {
  exito: boolean;
  datos: Membresia;
  mensaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembresiasServicio {
  private apiUrl = `${environment.apiUrl}/membresias`;
  private http = inject(HttpClient);

  /**
   * Obtener planes de membresía disponibles
   */
  obtenerPlanes(): Observable<RespuestaPlanes> {
    return this.http.get<RespuestaPlanes>(`${this.apiUrl}/planes`);
  }

  /**
   * Obtener membresía actual del técnico
   */
  obtenerMiMembresia(): Observable<RespuestaMembresia> {
    return this.http.get<RespuestaMembresia>(`${this.apiUrl}/mi-membresia`);
  }

  /**
   * Suscribirse a un plan de membresía
   */
  suscribirPlan(tipoPlan: string, metodoPago: string, referenciaPago?: string): Observable<RespuestaMembresia> {
    return this.http.post<RespuestaMembresia>(`${this.apiUrl}/suscribir`, {
      tipoPlan,
      metodoPago,
      referenciaPago
    });
  }

  /**
   * Cancelar membresía actual
   */
  cancelarMembresia(): Observable<{ exito: boolean; mensaje: string }> {
    return this.http.post<{ exito: boolean; mensaje: string }>(`${this.apiUrl}/cancelar`, {});
  }

  /**
   * Obtener color del badge según tipo de membresía
   */
  obtenerColorMembresia(tipo: string): string {
    switch (tipo) {
      case 'premium': return 'warning';
      case 'profesional': return 'tertiary';
      default: return 'medium';
    }
  }

  /**
   * Obtener icono según tipo de membresía
   */
  obtenerIconoMembresia(tipo: string): string {
    switch (tipo) {
      case 'premium': return 'diamond';
      case 'profesional': return 'star';
      default: return 'person';
    }
  }
}
