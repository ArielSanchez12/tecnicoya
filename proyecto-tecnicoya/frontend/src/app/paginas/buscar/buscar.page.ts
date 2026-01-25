import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar,
  IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonChip, IonIcon, IonBadge,
  IonAvatar, IonItem, IonList, IonSpinner, IonButton,
  IonRefresher, IonRefresherContent, IonSelect, IonSelectOption,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  starOutline, star, locationOutline, checkmarkCircle,
  timeOutline, flashOutline, filterOutline, shieldCheckmarkOutline,
  createOutline, trashOutline, checkmarkDoneOutline
} from 'ionicons/icons';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { CotizacionesServicio } from '../../servicios/cotizaciones.servicio';
import { GeolocalizacionServicio } from '../../servicios/geolocalizacion.servicio';
import { AuthServicio } from '../../servicios/auth.servicio';
import { Usuario, Servicio, TIPOS_SERVICIO, TipoServicio } from '../../modelos';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buscar',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Buscar</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          [(ngModel)]="terminoBusqueda"
          placeholder="Buscar..."
          (ionInput)="buscar()"
          debounce="300"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Segmento para clientes (buscar técnicos) -->
      @if (esCliente) {
        <div class="filtros ion-padding">
          <ion-segment [(ngModel)]="filtroActivo" (ionChange)="buscar()">
            <ion-segment-button value="todos">
              <ion-label>Todos</ion-label>
            </ion-segment-button>
            <ion-segment-button value="disponibles">
              <ion-label>Disponibles</ion-label>
            </ion-segment-button>
            <ion-segment-button value="emergencia">
              <ion-label>24/7</ion-label>
            </ion-segment-button>
          </ion-segment>

          <!-- Filtro por especialidad -->
          <ion-item class="filtro-especialidad">
            <ion-select
              [(ngModel)]="especialidadFiltro"
              placeholder="Todas las especialidades"
              (ionChange)="buscar()"
              interface="action-sheet"
            >
              <ion-select-option [value]="null">Todas</ion-select-option>
              @for (tipo of tiposServicio; track tipo.valor) {
                <ion-select-option [value]="tipo.valor">
                  {{ tipo.etiqueta }}
                </ion-select-option>
              }
            </ion-select>
          </ion-item>
        </div>

        <!-- Lista de técnicos -->
        @if (cargando) {
          <div class="loading-container">
            <ion-spinner></ion-spinner>
            <p>Buscando técnicos...</p>
          </div>
        } @else if (tecnicos.length === 0) {
          <div class="empty-state ion-padding">
            <ion-icon name="search-outline" color="medium"></ion-icon>
            <p>No se encontraron técnicos</p>
          </div>
        } @else {
          <ion-list class="lista-tecnicos">
            @for (tecnico of tecnicos; track tecnico._id) {
              <ion-card class="tarjeta-tecnico" (click)="verTecnico(tecnico._id)">
                <ion-card-content>
                  <div class="tecnico-header">
                    <ion-avatar>
                      <img [src]="tecnico.perfil?.fotoUrl || tecnico.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt="Foto"/>
                    </ion-avatar>
                    <div class="tecnico-info">
                      <div class="nombre-row">
                        <h3>{{ obtenerNombreTecnico(tecnico) }}</h3>
                        @if (esTecnicoVerificado(tecnico)) {
                          <span class="badge-tecnico-verificado">
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                            Verificado
                          </span>
                        }
                      </div>
                      <div class="calificacion">
                        <ion-icon name="star" color="warning"></ion-icon>
                        <span>{{ obtenerCalificacionTecnico(tecnico) | number:'1.1-1' }}</span>
                        <span class="trabajos">({{ tecnico.datosTecnico?.trabajosCompletados || 0 }} trabajos)</span>
                      </div>
                    </div>
                  </div>

                  <!-- Especialidades -->
                  <div class="especialidades">
                    @for (esp of tecnico.datosTecnico?.especialidades?.slice(0, 3); track esp) {
                      <ion-chip size="small" class="chip-especialidad">
                        <ion-label>{{ obtenerEtiquetaEspecialidad(esp) }}</ion-label>
                      </ion-chip>
                    }
                    @if ((tecnico.datosTecnico?.especialidades?.length || 0) > 3) {
                      <ion-chip size="small" color="medium">
                        <ion-label>+{{ (tecnico.datosTecnico?.especialidades?.length || 0) - 3 }}</ion-label>
                      </ion-chip>
                    }
                  </div>

                  <div class="tecnico-footer">
                    <div class="info-item">
                      <ion-icon name="location-outline"></ion-icon>
                      <span>{{ obtenerRadioTecnico(tecnico) }} km</span>
                    </div>
                    @if (tecnico.datosTecnico?.disponibleAhora) {
                      <ion-badge color="success">Disponible</ion-badge>
                    }
                    @if (tecnico.datosTecnico?.emergencia24h) {
                      <ion-badge color="danger">
                        <ion-icon name="flash-outline"></ion-icon> 24/7
                      </ion-badge>
                    }
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </ion-list>
        }
      }

      <!-- Segmento para técnicos (buscar servicios) -->
      @if (esTecnico) {
        <div class="filtros ion-padding">
          <ion-segment [(ngModel)]="filtroServicios" (ionChange)="buscarServicios()">
            <ion-segment-button value="todos">
              <ion-label>Todos</ion-label>
            </ion-segment-button>
            <ion-segment-button value="urgentes">
              <ion-label>Urgentes</ion-label>
            </ion-segment-button>
            <ion-segment-button value="cercanos">
              <ion-label>Cercanos</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- Lista de servicios -->
        @if (cargando) {
          <div class="loading-container">
            <ion-spinner></ion-spinner>
            <p>Buscando servicios...</p>
          </div>
        } @else if (servicios.length === 0) {
          <div class="empty-state ion-padding">
            <ion-icon name="briefcase-outline" color="medium"></ion-icon>
            <p>No hay servicios disponibles</p>
          </div>
        } @else {
          <ion-list>
            @for (servicio of servicios; track servicio._id) {
              <ion-card class="tarjeta-servicio" (click)="verServicio(servicio._id)">
                <ion-card-header>
                  <div class="servicio-header">
                    <ion-card-title>{{ servicio.titulo }}</ion-card-title>
                    @if (servicio.urgencia === 'emergencia') {
                      <ion-badge color="danger">URGENTE</ion-badge>
                    }
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <p class="descripcion">{{ servicio.descripcion | slice:0:100 }}...</p>
                  <div class="servicio-footer">
                    <span>
                      <ion-icon name="location-outline"></ion-icon>
                      {{ servicio.ubicacion.ciudad }}
                    </span>
                    @if (servicio.yaCotizado) {
                      <div class="botones-cotizado">
                        <ion-button size="small" color="success" fill="outline" (click)="editarCotizacion(servicio.miCotizacionId, $event)">
                          <ion-icon name="create-outline" slot="start"></ion-icon>
                          Editar
                        </ion-button>
                        <ion-button size="small" color="danger" fill="outline" (click)="eliminarCotizacion(servicio.miCotizacionId, $event)">
                          <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                        </ion-button>
                      </div>
                    } @else {
                      <ion-button size="small" (click)="cotizar(servicio._id, $event)">
                        Cotizar
                      </ion-button>
                    }
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </ion-list>
        }
      }
    </ion-content>
  `,
  styles: [`
    .filtros {
      background: var(--ion-background-color);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .filtro-especialidad {
      margin-top: 12px;
      --background: var(--ion-color-light);
      --border-radius: 8px;
      
      ion-select {
        color: var(--ion-color-dark);
        --placeholder-color: var(--ion-color-medium);
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;

      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px;

      ion-icon {
        font-size: 64px;
      }

      p {
        color: var(--ion-color-medium);
        margin-top: 16px;
      }
    }

    .lista-tecnicos {
      padding: 0 16px;
    }

    .tarjeta-tecnico {
      margin: 0 0 12px;
      border-radius: 12px;
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }

    .tecnico-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      ion-avatar {
        width: 56px;
        height: 56px;
      }

      .tecnico-info {
        flex: 1;

        h3 {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 600;
        }

        .calificacion {
          display: flex;
          align-items: center;
          gap: 4px;

          ion-icon {
            font-size: 16px;
          }

          span {
            font-size: 14px;
            font-weight: 500;
          }

          .trabajos {
            color: var(--ion-color-medium);
            font-weight: normal;
          }
        }
      }

      .verificado {
        font-size: 24px;
      }
    }

    .especialidades {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 12px;
    }

    .tecnico-footer {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .info-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 14px;
        }
      }

      ion-badge {
        font-size: 10px;
      }
    }

    .tarjeta-servicio {
      margin: 0 16px 12px;
      border-radius: 12px;
      cursor: pointer;
    }

    .servicio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      ion-card-title {
        font-size: 16px;
        flex: 1;
        margin-right: 8px;
      }
    }

    .descripcion {
      color: var(--ion-color-medium);
      font-size: 14px;
      margin: 0 0 12px;
    }

    .servicio-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--ion-color-medium);
        font-size: 13px;

        ion-icon {
          font-size: 16px;
        }
      }

      .botones-cotizado {
        display: flex;
        gap: 4px;
        align-items: center;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonSearchbar,
    IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonChip, IonIcon, IonBadge,
    IonAvatar, IonItem, IonList, IonSpinner, IonButton,
    IonRefresher, IonRefresherContent, IonSelect, IonSelectOption,
    NgFor, NgIf, DecimalPipe, FormsModule
  ],
})
export class BuscarPage implements OnInit {
  private router = inject(Router);
  private authServicio = inject(AuthServicio);
  private usuariosServicio = inject(UsuariosServicio);
  private serviciosServicio = inject(ServiciosServicio);
  private cotizacionesServicio = inject(CotizacionesServicio);
  private geoServicio = inject(GeolocalizacionServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  terminoBusqueda = '';
  filtroActivo = 'todos';
  filtroServicios = 'todos';
  especialidadFiltro: TipoServicio | null = null;

  tecnicos: Usuario[] = [];
  servicios: Servicio[] = [];
  cargando = false;

  tiposServicio = TIPOS_SERVICIO;

  constructor() {
    addIcons({
      starOutline, star, locationOutline, checkmarkCircle,
      timeOutline, flashOutline, filterOutline, shieldCheckmarkOutline,
      createOutline, trashOutline, checkmarkDoneOutline
    });
  }

  ngOnInit(): void {
    if (this.esCliente) {
      this.buscar();
    } else {
      this.buscarServicios();
    }
  }

  get esCliente(): boolean {
    return this.authServicio.esCliente();
  }

  get esTecnico(): boolean {
    return this.authServicio.esTecnico();
  }

  async buscar(): Promise<void> {
    this.cargando = true;

    const filtros: any = {};

    if (this.especialidadFiltro) {
      filtros.especialidad = this.especialidadFiltro;
    }

    if (this.filtroActivo === 'disponibles') {
      filtros.disponibleAhora = true;
    } else if (this.filtroActivo === 'emergencia') {
      filtros.emergencia24h = true;
    }

    this.usuariosServicio.buscarTecnicos(filtros).subscribe({
      next: (res: any) => {
        this.cargando = false;
        // El backend devuelve { exito, datos: { tecnicos: [], paginacion: {} } }
        if (res.datos?.tecnicos && Array.isArray(res.datos.tecnicos)) {
          this.tecnicos = res.datos.tecnicos;
        } else if (res.datos && Array.isArray(res.datos)) {
          this.tecnicos = res.datos;
        } else if (Array.isArray(res)) {
          this.tecnicos = res;
        } else {
          this.tecnicos = [];
        }
        console.log('Técnicos encontrados:', this.tecnicos.length);
      },
      error: (err) => {
        console.error('Error al buscar técnicos:', err);
        this.cargando = false;
        this.tecnicos = [];
      }
    });
  }

  async buscarServicios(): Promise<void> {
    this.cargando = true;

    // Obtener coordenadas del técnico o usar Quito por defecto
    const coordenadas = this.obtenerCoordenadasTecnico();

    const filtros: any = {
      latitud: coordenadas.latitud,
      longitud: coordenadas.longitud,
      radio: 15
    };

    if (this.filtroServicios === 'urgentes') {
      filtros.urgencia = 'emergencia';
    }

    this.serviciosServicio.obtenerServiciosDisponibles(filtros).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.datos) {
          this.servicios = res.datos;
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  async refrescar(event: any): Promise<void> {
    if (this.esCliente) {
      await this.buscar();
    } else {
      await this.buscarServicios();
    }
    event.target.complete();
  }

  /**
   * Obtiene las coordenadas del técnico desde su perfil o usa Quito por defecto
   * Si las coordenadas son [0,0] (no configuradas), usa Quito como fallback
   */
  private obtenerCoordenadasTecnico(): { latitud: number; longitud: number } {
    const QUITO_DEFAULT = {
      latitud: -0.1807,
      longitud: -78.4678
    };

    const usuario = this.authServicio.obtenerUsuario();
    const ubicacionBase = usuario?.datosTecnico?.ubicacionBase;
    const coordenadas = ubicacionBase?.coordenadas;

    if (coordenadas?.coordinates?.length === 2) {
      const [lon, lat] = coordenadas.coordinates;

      // Verificar que las coordenadas no sean [0,0] (no configuradas)
      if (lon !== 0 || lat !== 0) {
        return {
          longitud: lon,
          latitud: lat
        };
      }
    }

    return QUITO_DEFAULT;
  }

  verTecnico(id: string): void {
    this.router.navigate(['/tecnico', id]);
  }

  verServicio(id: string): void {
    this.router.navigate(['/servicio', id]);
  }

  cotizar(servicioId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/nueva-cotizacion', servicioId]);
  }

  editarCotizacion(cotizacionId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/editar-cotizacion', cotizacionId]);
  }

  async eliminarCotizacion(cotizacionId: string, event: Event): Promise<void> {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Cancelar Cotización',
      message: '¿Estás seguro de que deseas cancelar esta cotización?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => {
            this.cotizacionesServicio.cancelarCotizacion(cotizacionId).subscribe({
              next: async () => {
                const toast = await this.toastCtrl.create({
                  message: 'Cotización cancelada',
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
                this.buscarServicios();
              },
              error: async () => {
                const toast = await this.toastCtrl.create({
                  message: 'Error al cancelar la cotización',
                  duration: 2000,
                  color: 'danger'
                });
                await toast.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  obtenerEtiquetaEspecialidad(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  esTecnicoVerificado(tecnico: any): boolean {
    return tecnico?.datosTecnico?.membresia?.badgeVerificado === true ||
      tecnico?.datosTecnico?.verificado === true;
  }

  obtenerNombreTecnico(tecnico: any): string {
    const nombre = tecnico?.perfil?.nombre || tecnico?.nombre || '';
    const apellido = tecnico?.perfil?.apellido || tecnico?.apellido || '';
    return `${nombre} ${apellido}`.trim() || 'Técnico';
  }

  obtenerCalificacionTecnico(tecnico: any): number {
    return tecnico?.datosTecnico?.calificacion ||
           tecnico?.datosTecnico?.calificacionPromedio || 0;
  }

  obtenerRadioTecnico(tecnico: any): number {
    const radioBase = tecnico?.datosTecnico?.radioTrabajo || 15;
    const radioExtendido = tecnico?.datosTecnico?.membresia?.radioExtendido || 0;
    return radioBase + radioExtendido;
  }
}
