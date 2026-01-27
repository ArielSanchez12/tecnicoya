import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonIcon, IonButton, IonBadge, IonChip,
  IonLabel, IonProgressBar, IonSpinner, IonRefresher, IonRefresherContent,
  IonList, IonItem, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  ribbonOutline, giftOutline, starOutline, trophyOutline,
  chevronForward, checkmarkCircle, lockClosed, sparkles, timeOutline
} from 'ionicons/icons';
import { FidelizacionServicio } from '../../servicios/fidelizacion.servicio';
import { NIVELES_LEALTAD, NivelLealtadInfo } from '../../modelos';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-fidelizacion',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Programa de Fidelización</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
        </div>
      } @else if (fidelizacion) {
        <!-- Tarjeta de nivel actual -->
        <div class="nivel-card" [style.background]="obtenerGradiente()">
          <div class="nivel-header">
            <ion-icon name="ribbon-outline"></ion-icon>
            <span class="nivel-nombre">{{ obtenerNombreNivel() }}</span>
          </div>
          <div class="puntos">
            <span class="numero">{{ fidelizacion.puntos }}</span>
            <span class="etiqueta">puntos</span>
          </div>
          @if (siguienteNivel) {
            <div class="progreso-nivel">
              <ion-progress-bar [value]="progresoNivel"></ion-progress-bar>
              <p>{{ puntosParaSiguiente }} puntos para {{ siguienteNivel.nombre }}</p>
            </div>
          }
        </div>

        <!-- Beneficios del nivel actual -->
        <ion-card class="tarjeta-beneficios">
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="gift-outline"></ion-icon>
              Tus Beneficios
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @for (beneficio of beneficiosActuales; track beneficio) {
              <div class="beneficio-item">
                <ion-icon name="checkmark-circle" color="success"></ion-icon>
                <span>{{ beneficio }}</span>
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Niveles del programa -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="trophy-outline"></ion-icon>
              Niveles del Programa
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @for (nivel of niveles; track nivel.nivel) {
              <div 
                class="nivel-item" 
                [class.activo]="esNivelActual(nivel)"
                [class.desbloqueado]="esNivelDesbloqueado(nivel)"
              >
                <div class="nivel-info">
                  <div class="nivel-icono" [style.background]="nivel.color">
                    @if (esNivelDesbloqueado(nivel)) {
                      <ion-icon name="ribbon-outline"></ion-icon>
                    } @else {
                      <ion-icon name="lock-closed"></ion-icon>
                    }
                  </div>
                  <div class="nivel-datos">
                    <span class="nombre">{{ nivel.nombre }}</span>
                    <span class="puntos-requeridos">{{ nivel.puntosMinimos }} puntos</span>
                  </div>
                </div>
                @if (esNivelActual(nivel)) {
                  <ion-badge color="primary">Actual</ion-badge>
                }
              </div>
            }
          </ion-card-content>
        </ion-card>

        <!-- Historial de puntos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="time-outline"></ion-icon>
              Historial Reciente
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            @if (historial.length === 0) {
              <p class="sin-historial">Aún no tienes movimientos</p>
            } @else {
              @for (movimiento of historial; track $index) {
                <div class="historial-item">
                  <div class="historial-info">
                    <span class="concepto">{{ movimiento.descripcion }}</span>
                    <span class="fecha">{{ movimiento.fecha | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <span 
                    class="historial-puntos"
                    [class.positivo]="movimiento.tipo === 'ganado'"
                    [class.negativo]="movimiento.tipo === 'canjeado'"
                  >
                    {{ movimiento.tipo === 'ganado' ? '+' : '-' }}{{ movimiento.cantidad }}
                  </span>
                </div>
              }
            }
          </ion-card-content>
        </ion-card>

        <!-- Cómo ganar puntos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="sparkles"></ion-icon>
              ¿Cómo ganar puntos?
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="ganar-item">
              <span class="accion">Por cada $10 en servicios</span>
              <span class="puntos-ganar">+1 pt</span>
            </div>
            <div class="ganar-item">
              <span class="accion">Dejar una reseña completa</span>
              <span class="puntos-ganar">+5 pts</span>
            </div>
            <div class="ganar-info">
              <p><strong>100 puntos = $10 de descuento</strong></p>
              <p class="info-detalle">Canjea tus puntos en tu próximo servicio</p>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Botón canjear -->
        <div class="ion-padding">
          <ion-button expand="block" (click)="verBeneficios()">
            <ion-icon name="gift-outline" slot="start"></ion-icon>
            Canjear Beneficios
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 64px;
    }

    .nivel-card {
      margin: 16px;
      padding: 24px;
      border-radius: 16px;
      color: white;
      text-align: center;

      .nivel-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 16px;

        ion-icon {
          font-size: 32px;
        }

        .nivel-nombre {
          font-size: 24px;
          font-weight: 700;
        }
      }

      .puntos {
        .numero {
          font-size: 48px;
          font-weight: 800;
          display: block;
        }

        .etiqueta {
          font-size: 16px;
          opacity: 0.9;
        }
      }

      .progreso-nivel {
        margin-top: 20px;

        ion-progress-bar {
          --background: rgba(255, 255, 255, 0.3);
          --progress-background: white;
          height: 8px;
          border-radius: 4px;
        }

        p {
          margin: 8px 0 0;
          font-size: 13px;
          opacity: 0.9;
        }
      }
    }

    ion-card {
      margin: 16px;
      border-radius: 12px;

      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;

        ion-icon {
          font-size: 22px;
        }
      }
    }

    .tarjeta-beneficios {
      .beneficio-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid var(--ion-color-light);

        &:last-child {
          border-bottom: none;
        }

        ion-icon {
          font-size: 20px;
        }

        span {
          font-size: 14px;
        }
      }
    }

    .nivel-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      border-bottom: 1px solid var(--ion-color-light);
      opacity: 0.5;

      &:last-child {
        border-bottom: none;
      }

      &.desbloqueado {
        opacity: 1;
      }

      &.activo {
        opacity: 1;
        background: var(--ion-color-primary-tint);
        margin: 0 -16px;
        padding: 16px;
        border-radius: 8px;
      }

      .nivel-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .nivel-icono {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        ion-icon {
          font-size: 20px;
          color: white;
        }
      }

      .nivel-datos {
        .nombre {
          display: block;
          font-weight: 600;
          font-size: 14px;
        }

        .puntos-requeridos {
          font-size: 12px;
          color: var(--ion-color-medium);
        }
      }
    }

    .sin-historial {
      text-align: center;
      color: var(--ion-color-medium);
      padding: 16px;
    }

    .historial-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--ion-color-light);

      &:last-child {
        border-bottom: none;
      }

      .historial-info {
        .concepto {
          display: block;
          font-size: 14px;
        }

        .fecha {
          font-size: 12px;
          color: var(--ion-color-medium);
        }
      }

      .historial-puntos {
        font-weight: 700;
        font-size: 16px;

        &.positivo {
          color: var(--ion-color-success);
        }

        &.negativo {
          color: var(--ion-color-danger);
        }
      }
    }

    .ganar-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--ion-color-light);

      &:last-child {
        border-bottom: none;
      }

      .accion {
        font-size: 14px;
      }

      .puntos-ganar {
        font-weight: 600;
        color: var(--ion-color-primary);
      }
    }

    .ganar-info {
      margin-top: 16px;
      padding: 16px;
      background: var(--ion-color-primary);
      border-radius: 8px;
      text-align: center;

      p {
        margin: 0;
        font-size: 16px;
        color: white;
      }

      .info-detalle {
        margin-top: 4px;
        font-size: 13px;
        opacity: 0.8;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonIcon, IonButton, IonBadge, IonChip,
    IonLabel, IonProgressBar, IonSpinner, IonRefresher, IonRefresherContent,
    IonList, IonItem, IonButtons, IonBackButton,
    NgFor, NgIf, DecimalPipe, DatePipe
  ],
})
export class FidelizacionPage implements OnInit {
  private router = inject(Router);
  private fidelizacionServicio = inject(FidelizacionServicio);

  fidelizacion: any = null;
  niveles = NIVELES_LEALTAD;
  historial: any[] = [];
  cargando = false;

  constructor() {
    addIcons({
      ribbonOutline, giftOutline, starOutline, trophyOutline,
      chevronForward, checkmarkCircle, lockClosed, sparkles, timeOutline
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.fidelizacionServicio.obtenerMiFidelizacion().subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.datos) {
          this.fidelizacion = res.datos;
          this.historial = (res.datos as any).historialPuntos?.slice(0, 5) || [];
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  async refrescar(event: any): Promise<void> {
    await this.cargarDatos();
    event.target.complete();
  }

  get nivelActual(): NivelLealtadInfo | undefined {
    return this.niveles.find(n => n.nivel === this.fidelizacion?.nivel);
  }

  get siguienteNivel(): NivelLealtadInfo | undefined {
    const indexActual = this.niveles.findIndex(n => n.nivel === this.fidelizacion?.nivel);
    return indexActual < this.niveles.length - 1 ? this.niveles[indexActual + 1] : undefined;
  }

  get progresoNivel(): number {
    if (!this.siguienteNivel || !this.nivelActual) return 1;
    const puntosEnNivel = this.fidelizacion.puntos - this.nivelActual.puntosMinimos;
    const rangoNivel = this.siguienteNivel.puntosMinimos - this.nivelActual.puntosMinimos;
    return puntosEnNivel / rangoNivel;
  }

  get puntosParaSiguiente(): number {
    if (!this.siguienteNivel) return 0;
    return this.siguienteNivel.puntosMinimos - this.fidelizacion.puntos;
  }

  get beneficiosActuales(): string[] {
    return this.nivelActual?.beneficios || [];
  }

  obtenerNombreNivel(): string {
    return this.nivelActual?.nombre || 'Bronce';
  }

  obtenerGradiente(): string {
    const color = this.nivelActual?.color || '#CD7F32';
    return `linear-gradient(135deg, ${color}, ${this.ajustarColor(color, -30)})`;
  }

  esNivelActual(nivel: NivelLealtadInfo): boolean {
    return nivel.nivel === this.fidelizacion?.nivel;
  }

  esNivelDesbloqueado(nivel: NivelLealtadInfo): boolean {
    return this.fidelizacion?.puntos >= nivel.puntosMinimos;
  }

  verBeneficios(): void {
    this.router.navigate(['/beneficios']);
  }

  private ajustarColor(color: string, cantidad: number): string {
    // Función simple para oscurecer/aclarar un color
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + cantidad));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + cantidad));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + cantidad));
    return '#' + (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
  }
}
