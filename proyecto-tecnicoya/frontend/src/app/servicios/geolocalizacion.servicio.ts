/**
 * Servicio de Geolocalización
 * TécnicoYa - Frontend
 * Usando Capacitor Geolocation con fallback a navegador
 */

import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { UbicacionActual } from '../modelos';

@Injectable({
  providedIn: 'root'
})
export class GeolocalizacionServicio {
  private ubicacionSubject = new BehaviorSubject<UbicacionActual | null>(null);
  public ubicacion$ = this.ubicacionSubject.asObservable();

  private watchId: string | null = null;
  private browserWatchId: number | null = null;

  /**
   * Detectar si estamos en navegador (no en app nativa)
   */
  private esNavegador(): boolean {
    return Capacitor.getPlatform() === 'web';
  }

  /**
   * Verificar permisos de ubicación
   */
  async verificarPermisos(): Promise<boolean> {
    try {
      // En navegador, verificamos si el navegador soporta geolocalización
      if (this.esNavegador()) {
        return 'geolocation' in navigator;
      }

      const permisos = await Geolocation.checkPermissions();
      return permisos.location === 'granted' || permisos.coarseLocation === 'granted';
    } catch (error) {
      console.error('Error verificando permisos:', error);
      // En navegador, si hay error, igual intentamos
      return this.esNavegador() && 'geolocation' in navigator;
    }
  }

  /**
   * Solicitar permisos de ubicación
   */
  async solicitarPermisos(): Promise<boolean> {
    try {
      // En navegador, los permisos se solicitan al pedir la ubicación
      if (this.esNavegador()) {
        return 'geolocation' in navigator;
      }

      const permisos = await Geolocation.requestPermissions();
      return permisos.location === 'granted' || permisos.coarseLocation === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return this.esNavegador() && 'geolocation' in navigator;
    }
  }

  /**
   * Obtener ubicación actual usando API del navegador
   */
  private obtenerUbicacionNavegador(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada en este navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Obtener ubicación actual
   */
  async obtenerUbicacionActual(): Promise<UbicacionActual | null> {
    try {
      let latitud: number;
      let longitud: number;
      let precision: number;

      // En navegador, usar API nativa del browser
      if (this.esNavegador()) {
        console.log('🌐 Usando geolocalización del navegador...');
        const posicion = await this.obtenerUbicacionNavegador();
        latitud = posicion.coords.latitude;
        longitud = posicion.coords.longitude;
        precision = posicion.coords.accuracy;
      } else {
        // En app nativa, usar Capacitor
        const tienePermisos = await this.verificarPermisos();

        if (!tienePermisos) {
          const permisosOtorgados = await this.solicitarPermisos();
          if (!permisosOtorgados) {
            throw new Error('Permisos de ubicación denegados');
          }
        }

        const posicion: Position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });

        latitud = posicion.coords.latitude;
        longitud = posicion.coords.longitude;
        precision = posicion.coords.accuracy;
      }

      const ubicacion: UbicacionActual = {
        latitud,
        longitud,
        precision
      };

      console.log('📍 Ubicación obtenida:', ubicacion);
      this.ubicacionSubject.next(ubicacion);
      return ubicacion;
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      return null;
    }
  }

  /**
   * Iniciar seguimiento de ubicación en tiempo real
   */
  async iniciarSeguimiento(callback?: (ubicacion: UbicacionActual) => void): Promise<void> {
    try {
      const tienePermisos = await this.verificarPermisos();

      if (!tienePermisos) {
        const permisosOtorgados = await this.solicitarPermisos();
        if (!permisosOtorgados) {
          throw new Error('Permisos de ubicación denegados');
        }
      }

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        },
        (posicion, error) => {
          if (error) {
            console.error('Error en seguimiento:', error);
            return;
          }

          if (posicion) {
            const ubicacion: UbicacionActual = {
              latitud: posicion.coords.latitude,
              longitud: posicion.coords.longitude,
              precision: posicion.coords.accuracy
            };

            this.ubicacionSubject.next(ubicacion);
            callback?.(ubicacion);
          }
        }
      );
    } catch (error) {
      console.error('Error iniciando seguimiento:', error);
    }
  }

  /**
   * Detener seguimiento de ubicación
   */
  async detenerSeguimiento(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  /**
   * Calcular distancia entre dos puntos (Haversine)
   */
  calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return Math.round(distancia * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Calcular tiempo estimado de llegada
   */
  calcularTiempoEstimado(distanciaKm: number, velocidadPromedio: number = 30): number {
    // Tiempo en minutos, asumiendo velocidad promedio en km/h
    return Math.round((distanciaKm / velocidadPromedio) * 60);
  }

  /**
   * Formatear distancia para mostrar
   */
  formatearDistancia(distanciaKm: number): string {
    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }
    return `${distanciaKm.toFixed(1)} km`;
  }

  /**
   * Formatear tiempo para mostrar
   */
  formatearTiempo(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    }
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min`;
  }

  private toRad(grados: number): number {
    return grados * (Math.PI / 180);
  }

  /**
   * Obtener posición actual como objeto Position de Capacitor
   * (Usado para compatibilidad con componentes que necesitan coords directamente)
   */
  async obtenerPosicionActual(): Promise<Position | null> {
    try {
      // En navegador, usar API nativa y convertir al formato Position
      if (this.esNavegador()) {
        console.log('🌐 Obteniendo posición desde navegador...');
        const posicion = await this.obtenerUbicacionNavegador();

        // Convertir GeolocationPosition del navegador a formato compatible con Capacitor Position
        const posicionCapacitor: Position = {
          coords: {
            latitude: posicion.coords.latitude,
            longitude: posicion.coords.longitude,
            accuracy: posicion.coords.accuracy,
            altitude: posicion.coords.altitude,
            altitudeAccuracy: posicion.coords.altitudeAccuracy,
            heading: posicion.coords.heading,
            speed: posicion.coords.speed
          },
          timestamp: posicion.timestamp
        };

        console.log('📍 Posición obtenida:', posicionCapacitor.coords.latitude, posicionCapacitor.coords.longitude);
        return posicionCapacitor;
      }

      // En app nativa, usar Capacitor
      const tienePermisos = await this.verificarPermisos();

      if (!tienePermisos) {
        const permisosOtorgados = await this.solicitarPermisos();
        if (!permisosOtorgados) {
          return null;
        }
      }

      const posicion: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return posicion;
    } catch (error) {
      console.error('Error obteniendo posición:', error);
      return null;
    }
  }
}
