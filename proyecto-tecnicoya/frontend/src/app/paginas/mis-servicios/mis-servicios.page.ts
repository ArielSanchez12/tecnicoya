import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge,
  IonList, IonItem, IonLabel, IonSpinner, IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton, IonChip,
  IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, locationOutline, timeOutline, chevronForward,
  calendarOutline, alertCircleOutline, checkmarkCircleOutline,
  hourglassOutline, closeCircleOutline, briefcaseOutline, documentTextOutline
} from 'ionicons/icons';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { Servicio, ESTADOS_SERVICIO, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, DatePipe, SlicePipe } from '@angular/common';

@Component({
  selector: 'app-mis-servicios',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Mis Servicios</ion-title>
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
        <ion-segment-button value="pendiente">
          <ion-label>Pendientes</ion-label>
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
          <p>Cargando servicios...</p>
        </div>
      } @else if (serviciosFiltrados.length === 0) {
        <div class="empty-state ion-padding ion-text-center">
          <ion-icon name="briefcase-outline" color="medium"></ion-icon>
          <h3>No tienes servicios</h3>
          <p>Crea tu primera solicitud de servicio para comenzar</p>
        </div>
      } @else {
        <ion-list class="lista-servicios">
          @for (servicio of serviciosFiltrados; track servicio._id) {
            <ion-card class="tarjeta-servicio" (click)="verServicio(servicio._id)">
              <ion-card-header>
                <div class="servicio-header">
                  <ion-card-title>{{ servicio.titulo }}</ion-card-title>
                  <ion-badge [color]="obtenerColorEstado(servicio.estado)">
                    {{ obtenerEtiquetaEstado(servicio.estado) }}
                  </ion-badge>
                </div>
                <ion-chip class="chip-tipo" size="small">
                  <ion-label>{{ obtenerEtiquetaTipo(servicio.tipo) }}</ion-label>
                </ion-chip>
              </ion-card-header>
              <ion-card-content>
                <p class="descripcion">{{ (servicio.descripcion || '') | slice:0:80 }}{{ servicio.descripcion?.length > 80 ? '...' : '' }}</p>
                
                <div class="servicio-info">
                  <div class="info-item">
                    <ion-icon name="location-outline"></ion-icon>
                    <span>{{ servicio.ubicacion?.direccion || 'Sin ubicación' }}</span>
                  </div>
                  <div class="info-item">
                    <ion-icon name="calendar-outline"></ion-icon>
                    <span>{{ servicio.fechaCreacion | date:'dd/MM/yyyy' }}</span>
                  </div>
                </div>

                @if (servicio.urgencia === 'emergencia') {
                  <ion-badge color="danger" class="badge-urgencia">
                    <ion-icon name="alert-circle-outline"></ion-icon>
                    URGENTE
                  </ion-badge>
                }

                <!-- Cotizaciones recibidas -->
                @if (servicio.estado === 'pendiente' && servicio.cotizaciones && servicio.cotizaciones.length > 0) {
                  <div class="cotizaciones-info">
                    <ion-icon name="document-text-outline"></ion-icon>
                    <span>{{ servicio.cotizaciones.length }} cotización(es) recibida(s)</span>
                    <ion-icon name="chevron-forward" class="icon-forward"></ion-icon>
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
        margin-bottom: 24px;
      }
    }

    .lista-servicios {
      padding: 8px 16px;
    }

    .tarjeta-servicio {
      margin: 0 0 16px;
      border-radius: 12px;
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }

    .servicio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;

      ion-card-title {
        font-size: 16px;
        flex: 1;
      }
    }

    .chip-tipo {
      margin: 8px 0 0;
      height: 24px;
    }

    .descripcion {
      color: var(--ion-color-medium);
      font-size: 14px;
      margin: 0 0 16px;
    }

    .servicio-info {
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

    .badge-urgencia {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }

    .cotizaciones-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--ion-color-primary-tint);
      border-radius: 8px;
      margin-top: 8px;
      color: var(--ion-color-primary);
      font-size: 14px;
      font-weight: 500;

      .icon-forward {
        margin-left: auto;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge,
    IonList, IonItem, IonLabel, IonSpinner, IonRefresher, IonRefresherContent,
    IonSegment, IonSegmentButton, IonChip,
    IonButtons, IonBackButton,
    NgFor, NgIf, DatePipe, SlicePipe, FormsModule
  ],
})
export class MisServiciosPage implements OnInit {
  private router = inject(Router);
  private serviciosServicio = inject(ServiciosServicio);

  servicios: Servicio[] = [];
  serviciosFiltrados: Servicio[] = [];
  filtroEstado = 'todos';
  cargando = false;

  constructor() {
    addIcons({
      addOutline, locationOutline, timeOutline, chevronForward,
      calendarOutline, alertCircleOutline, checkmarkCircleOutline,
      hourglassOutline, closeCircleOutline, briefcaseOutline, documentTextOutline
    });
  }

  ngOnInit(): void {
    this.cargarServicios();
  }

  cargarServicios(): void {
    this.cargando = true;
    this.serviciosServicio.obtenerMisServicios().subscribe({
      next: (res: any) => {
        this.cargando = false;
        // La respuesta tiene estructura { datos: { servicios: [], paginacion: {} } }
        if (res.datos?.servicios) {
          this.servicios = res.datos.servicios;
        } else if (Array.isArray(res.datos)) {
          this.servicios = res.datos;
        } else {
          this.servicios = [];
        }
        this.filtrar();
      },
      error: () => {
        this.cargando = false;
        this.servicios = [];
        this.serviciosFiltrados = [];
      }
    });
  }

  filtrar(): void {
    // Asegurar que servicios sea un array
    if (!Array.isArray(this.servicios)) {
      this.servicios = [];
    }

    if (this.filtroEstado === 'todos') {
      this.serviciosFiltrados = this.servicios;
    } else if (this.filtroEstado === 'en_progreso') {
      // En progreso incluye: aceptado, en_progreso (trabajo activo)
      this.serviciosFiltrados = this.servicios.filter(s =>
        s.estado === 'aceptado' || s.estado === 'en_progreso'
      );
    } else if (this.filtroEstado === 'pendiente') {
      // Pendientes incluye: pendiente, cotizado (esperando decisión)
      this.serviciosFiltrados = this.servicios.filter(s =>
        s.estado === 'pendiente' || s.estado === 'cotizado'
      );
    } else {
      this.serviciosFiltrados = this.servicios.filter(s => s.estado === this.filtroEstado);
    }
  }

  async refrescar(event: any): Promise<void> {
    await this.cargarServicios();
    event.target.complete();
  }

  nuevoServicio(): void {
    this.router.navigate(['/nuevo-servicio']);
  }

  verServicio(id: string): void {
    this.router.navigate(['/servicio', id]);
  }

  obtenerColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': 'warning',
      'cotizado': 'tertiary',
      'en_progreso': 'primary',
      'completado': 'success',
      'cancelado': 'danger'
    };
    return colores[estado] || 'medium';
  }

  obtenerEtiquetaEstado(estado: string): string {
    const encontrado = ESTADOS_SERVICIO.find(e => e.valor === estado);
    return encontrado?.etiqueta || estado;
  }

  obtenerEtiquetaTipo(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }
}
