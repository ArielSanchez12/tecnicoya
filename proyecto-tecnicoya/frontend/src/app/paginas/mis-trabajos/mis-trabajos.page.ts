import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge,
  IonList, IonItem, IonLabel, IonSpinner, IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton, IonAvatar, IonChip, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, timeOutline, chevronForward, calendarOutline,
  personOutline, cashOutline, checkmarkCircleOutline, hourglassOutline,
  flashOutline, callOutline, chatbubbleOutline, navigateOutline, hammerOutline,
  briefcaseOutline
} from 'ionicons/icons';
import { TrabajosServicio } from '../../servicios/trabajos.servicio';
import { Trabajo, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-mis-trabajos',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Mis Trabajos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-segment [(ngModel)]="filtroEstado" (ionChange)="filtrar()">
        <ion-segment-button value="todos">
          <ion-label>Todos</ion-label>
        </ion-segment-button>
        <ion-segment-button value="en_camino">
          <ion-label>En Camino</ion-label>
        </ion-segment-button>
        <ion-segment-button value="en_progreso">
          <ion-label>En Progreso</ion-label>
        </ion-segment-button>
        <ion-segment-button value="completado">
          <ion-label>Completados</ion-label>
        </ion-segment-button>
      </ion-segment>

      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Cargando trabajos...</p>
        </div>
      } @else if (trabajosFiltrados.length === 0) {
        <div class="empty-state ion-padding ion-text-center">
          <ion-icon name="briefcase-outline" color="medium"></ion-icon>
          <h3>No tienes trabajos</h3>
          <p>Cuando acepten tus cotizaciones, los trabajos aparecerán aquí</p>
        </div>
      } @else {
        <ion-list class="lista-trabajos">
          @for (trabajo of trabajosFiltrados; track trabajo._id) {
            <ion-card class="tarjeta-trabajo" (click)="verTrabajo(trabajo._id)">
              <ion-card-header>
                <div class="trabajo-header">
                  <ion-chip size="small">
                    <ion-label>{{ obtenerEtiquetaTipo(trabajo.idServicio?.tipo || '') }}</ion-label>
                  </ion-chip>
                  <ion-badge [color]="obtenerColorEstado(trabajo.estado)">
                    {{ obtenerEtiquetaEstado(trabajo.estado) }}
                  </ion-badge>
                </div>
                <ion-card-title>{{ trabajo.idServicio?.titulo }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <!-- Cliente -->
                <div class="cliente-info">
                  <ion-avatar>
                    <img [src]="trabajo.idCliente?.perfil?.fotoUrl || 'assets/avatar-default.png'" alt=""/>
                  </ion-avatar>
                  <div class="cliente-datos">
                    <span class="nombre">{{ trabajo.idCliente?.perfil?.nombre }} {{ trabajo.idCliente?.perfil?.apellido }}</span>
                    <span class="ubicacion">
                      <ion-icon name="location-outline"></ion-icon>
                      <span class="ubicacion-texto">{{ trabajo.idServicio?.ubicacion?.direccion }}</span>
                    </span>
                  </div>
                  <div class="cliente-acciones">
                    <ion-button fill="clear" size="small" 
                      [disabled]="trabajo.estado === 'completado' || trabajo.estado === 'programado'"
                      (click)="llamar(trabajo.idCliente?.perfil?.telefono, $event)">
                      <ion-icon name="call-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" size="small" 
                      [disabled]="trabajo.estado === 'completado' || trabajo.estado === 'programado'"
                      (click)="abrirChat(trabajo.idCliente?._id, $event)">
                      <ion-icon name="chatbubble-outline"></ion-icon>
                    </ion-button>
                  </div>
                </div>

                <div class="trabajo-info">
                  <div class="info-item">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>{{ (trabajo.fechaProgramada || trabajo.fechaInicio) | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-item">
                    <ion-icon name="cash-outline"></ion-icon>
                    <span>{{ (trabajo.pago?.monto || trabajo.idCotizacion?.precio || 0) | currency:'USD':'symbol':'1.2-2' }}</span>
                  </div>
                </div>

                <!-- Botones de acción según estado -->
                @if (trabajo.estado === 'programado') {
                  <div class="acciones-trabajo">
                    <ion-button expand="block" (click)="iniciarCamino(trabajo._id, $event)">
                      <ion-icon name="navigate-outline" slot="start"></ion-icon>
                      Iniciar Camino
                    </ion-button>
                  </div>
                }
                @if (trabajo.estado === 'en_camino') {
                  <div class="acciones-trabajo">
                    <ion-button expand="block" (click)="iniciarTrabajo(trabajo._id, $event)">
                      <ion-icon name="hammer-outline" slot="start"></ion-icon>
                      Llegué - Iniciar Trabajo
                    </ion-button>
                  </div>
                }
                @if (trabajo.estado === 'en_progreso') {
                  <div class="acciones-trabajo">
                    <ion-button expand="block" color="success" (click)="completarTrabajo(trabajo._id, $event)">
                      <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                      Marcar Completado
                    </ion-button>
                  </div>
                }
              </ion-card-content>
            </ion-card>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    ion-segment {
      padding: 8px 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 16px;

      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    .empty-state {
      padding: 64px 32px;

      ion-icon {
        font-size: 80px;
      }

      h3 {
        margin: 16px 0 8px;
        color: var(--ion-text-color);
      }

      p {
        color: var(--ion-color-medium);
      }
    }

    .lista-trabajos {
      padding: 8px 16px;
    }

    .tarjeta-trabajo {
      margin: 0 0 16px;
      border-radius: 12px;
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }

    .trabajo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    ion-card-title {
      font-size: 16px;
    }

    .cliente-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 12px;

      ion-avatar {
        width: 44px;
        height: 44px;
      }

      .cliente-datos {
        flex: 1;

        .nombre {
          display: block;
          font-weight: 600;
          font-size: 14px;
        }

        .ubicacion {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--ion-color-medium);
          max-width: 100%;
          overflow: hidden;

          ion-icon {
            font-size: 14px;
            flex-shrink: 0;
          }

          .ubicacion-texto {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      .cliente-acciones {
        display: flex;
      }
    }

    .trabajo-info {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;

      .info-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 16px;
        }
      }
    }

    .acciones-trabajo {
      margin-top: 12px;

      ion-button {
        --border-radius: 8px;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge,
    IonList, IonItem, IonLabel, IonSpinner, IonRefresher, IonRefresherContent,
    IonSegment, IonSegmentButton, IonAvatar, IonChip, IonButtons, IonBackButton,
    NgFor, NgIf, DatePipe, CurrencyPipe, DecimalPipe, FormsModule
  ],
})
export class MisTrabajosPage implements OnInit {
  private router = inject(Router);
  private trabajosServicio = inject(TrabajosServicio);

  trabajos: Trabajo[] = [];
  trabajosFiltrados: Trabajo[] = [];
  filtroEstado = 'todos';
  cargando = false;

  constructor() {
    addIcons({
      locationOutline, timeOutline, chevronForward, calendarOutline,
      personOutline, cashOutline, checkmarkCircleOutline, hourglassOutline,
      flashOutline, callOutline, chatbubbleOutline, navigateOutline, hammerOutline,
      briefcaseOutline
    });
  }

  ngOnInit(): void {
    this.cargarTrabajos();
  }

  cargarTrabajos(): void {
    this.cargando = true;
    this.trabajosServicio.obtenerMisTrabajos().subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res.datos) {
          // El backend devuelve { trabajos, paginacion } dentro de datos
          this.trabajos = res.datos.trabajos || res.datos || [];
          // Asegurar que trabajos sea un array
          if (!Array.isArray(this.trabajos)) {
            this.trabajos = [];
          }
          this.filtrar();
        }
      },
      error: () => {
        this.cargando = false;
        this.trabajos = [];
        this.trabajosFiltrados = [];
      }
    });
  }

  filtrar(): void {
    // Asegurar que trabajos sea un array
    if (!Array.isArray(this.trabajos)) {
      this.trabajos = [];
    }

    if (this.filtroEstado === 'todos') {
      this.trabajosFiltrados = this.trabajos;
    } else {
      this.trabajosFiltrados = this.trabajos.filter(t => t.estado === this.filtroEstado);
    }
  }

  async refrescar(event: any): Promise<void> {
    await this.cargarTrabajos();
    event.target.complete();
  }

  verTrabajo(id: string): void {
    this.router.navigate(['/trabajo', id]);
  }

  llamar(telefono: string | undefined, event: Event): void {
    event.stopPropagation();
    if (telefono) {
      window.location.href = `tel:${telefono}`;
    }
  }

  abrirChat(clienteId: string | undefined, event: Event): void {
    event.stopPropagation();
    if (clienteId) {
      this.router.navigate(['/chat', clienteId]);
    }
  }

  iniciarCamino(trabajoId: string, event: Event): void {
    event.stopPropagation();
    this.trabajosServicio.actualizarEstado(trabajoId, 'en_camino').subscribe({
      next: () => this.cargarTrabajos()
    });
  }

  iniciarTrabajo(trabajoId: string, event: Event): void {
    event.stopPropagation();
    this.trabajosServicio.actualizarEstado(trabajoId, 'en_progreso').subscribe({
      next: () => this.cargarTrabajos()
    });
  }

  completarTrabajo(trabajoId: string, event: Event): void {
    event.stopPropagation();
    // Primero marcar como completado
    this.trabajosServicio.actualizarEstado(trabajoId, 'completado').subscribe({
      next: () => {
        // Luego navegar a la reseña del técnico (tipo=cliente significa que el técnico califica al cliente)
        this.router.navigate(['/nueva-resena', trabajoId], { queryParams: { tipo: 'cliente' } });
      },
      error: () => {
        // Si hay error, recargar la lista
        this.cargarTrabajos();
      }
    });
  }

  obtenerColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': 'warning',
      'en_camino': 'tertiary',
      'en_progreso': 'primary',
      'completado': 'success',
      'cancelado': 'danger'
    };
    return colores[estado] || 'medium';
  }

  obtenerEtiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      'pendiente': 'Pendiente',
      'en_camino': 'En Camino',
      'en_progreso': 'En Progreso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return etiquetas[estado] || estado;
  }

  obtenerEtiquetaTipo(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }
}
