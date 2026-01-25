import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
  IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonRefresher, IonRefresherContent,
  IonChip, IonLabel, IonBadge, IonSkeletonText, IonList, IonItem,
  IonAvatar, IonText, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, flashOutline, locationOutline, starOutline,
  constructOutline, briefcaseOutline, timeOutline, chevronForwardOutline,
  alertCircleOutline, trashOutline,
  // Iconos para tipos de servicio
  waterOutline, keyOutline, hammerOutline, colorPaletteOutline,
  snowOutline, businessOutline, leafOutline, sparklesOutline,
  cubeOutline, tvOutline, laptopOutline, ellipsisHorizontalOutline
} from 'ionicons/icons';
import { AuthServicio } from '../../servicios/auth.servicio';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { TrabajosServicio } from '../../servicios/trabajos.servicio';
import { SocketServicio } from '../../servicios/socket.servicio';
import { CotizacionesServicio } from '../../servicios/cotizaciones.servicio';
import { Usuario, Servicio, Trabajo, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, AsyncPipe, DatePipe, SlicePipe } from '@angular/common';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-inicio',
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>TécnicoYa</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Pull to refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="inicio-container ion-padding">
        <!-- Saludo -->
        <div class="saludo-section">
          <h2>Hola, {{ usuario?.nombre || 'Usuario' }} 👋</h2>
          <p>¿Qué necesitas hoy?</p>
        </div>

        <!-- Sección principal para clientes - Solicitar servicio -->
        @if (esCliente) {
          <!-- Estado vacío / CTA para clientes (siempre visible arriba) -->
          @if (serviciosRecientes.length === 0) {
            <div class="empty-state-grande">
              <ion-icon name="construct-outline" color="primary"></ion-icon>
              <h3>¿Necesitas un servicio?</h3>
              <p>Solicita tu primer servicio y conecta con técnicos profesionales</p>
            </div>
          }

          <!-- Grid de especialidades - Técnico Instantáneo integrado -->
          <div class="section">
            <div class="header-info-inicio">
              <ion-icon name="flash-outline" class="icono-principal"></ion-icon>
              <h3>¿Qué tipo de técnico necesitas?</h3>
              <p>Conectaremos con el técnico más cercano disponible</p>
            </div>

            <div class="tipos-grid-inicio">
              @for (tipo of tiposServicioCompletos; track tipo.valor) {
                <div class="tipo-card-inicio" (click)="seleccionarTipoServicio(tipo.valor)">
                  <span class="emoji">{{ obtenerEmojiServicio(tipo.valor) }}</span>
                  <span class="nombre">{{ tipo.etiqueta }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Mis servicios recientes (cliente) -->
        @if (esCliente && serviciosRecientes.length > 0) {
          <div class="section">
            <div class="section-header">
              <h3>Mis Servicios</h3>
              <ion-button fill="clear" size="small" routerLink="/mis-servicios">
                Ver todos
                <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
              </ion-button>
            </div>
            
            @for (servicio of serviciosRecientes; track servicio._id) {
              <ion-card class="tarjeta-servicio" (click)="verServicio(servicio._id)">
                <ion-card-header>
                  <div class="card-header-content">
                    <ion-card-title>{{ servicio.titulo }}</ion-card-title>
                    <span class="badge-estado" [class]="servicio.estado">
                      {{ obtenerEtiquetaEstado(servicio.estado) }}
                    </span>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <p class="descripcion-corta">{{ servicio.descripcion | slice:0:100 }}...</p>
                  <div class="card-footer">
                    <span class="fecha">
                      <ion-icon name="time-outline"></ion-icon>
                      {{ servicio.fechaCreacion | date:'dd/MM/yyyy' }}
                    </span>
                    <ion-chip size="small">
                      {{ obtenerEtiquetaTipo(servicio.tipo) }}
                    </ion-chip>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }

        <!-- Trabajos activos (técnico) -->
        @if (esTecnico && trabajosActivos.length > 0) {
          <div class="section">
            <div class="section-header">
              <h3>Trabajos Activos</h3>
              <ion-button fill="clear" size="small" routerLink="/tabs/mis-trabajos">
                Ver todos
                <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
              </ion-button>
            </div>
            
            @for (trabajo of trabajosActivos; track trabajo._id) {
              <ion-card class="tarjeta-servicio" (click)="verTrabajo(trabajo._id)">
                <ion-card-content>
                  <div class="trabajo-item">
                    <div class="trabajo-info">
                      <h4>Trabajo #{{ trabajo._id.slice(-6) }}</h4>
                      <span class="badge-estado" [class]="trabajo.estado">
                        {{ obtenerEtiquetaEstadoTrabajo(trabajo.estado) }}
                      </span>
                    </div>
                    <p>{{ trabajo.fechaProgramada | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }

        <!-- Servicios disponibles (técnico) -->
        @if (esTecnico) {
          <div class="section">
            <div class="section-header">
              <h3>Servicios Disponibles</h3>
              <ion-button fill="clear" size="small" routerLink="/buscar">
                Ver más
                <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
              </ion-button>
            </div>
            
            @if (serviciosDisponibles.length === 0) {
              <div class="empty-state">
                <ion-icon name="briefcase-outline" color="medium"></ion-icon>
                <p>No hay servicios disponibles en tu zona</p>
              </div>
            } @else {
              @for (servicio of serviciosDisponibles; track servicio._id) {
                <ion-card class="tarjeta-servicio" (click)="verServicio(servicio._id)">
                  <ion-card-header>
                    <div class="card-header-content">
                      <ion-card-title>{{ servicio.titulo }}</ion-card-title>
                      @if (servicio.urgencia === 'emergencia') {
                        <ion-badge color="danger">URGENTE</ion-badge>
                      }
                    </div>
                  </ion-card-header>
                  <ion-card-content>
                    <p class="descripcion-corta">{{ servicio.descripcion | slice:0:80 }}...</p>
                    <div class="card-footer">
                      <span class="ubicacion">
                        <ion-icon name="location-outline"></ion-icon>
                        {{ servicio.ubicacion?.direccion || 'Sin ubicación' }}
                      </span>
                      @if (misCotizacionesIds.has(servicio._id)) {
                        <div class="botones-cotizado">
                          <ion-button size="small" color="success" fill="outline" (click)="editarCotizacion(servicio._id, $event)">
                            Editar
                          </ion-button>
                          <ion-button size="small" color="danger" fill="outline" (click)="eliminarCotizacion(servicio._id, $event)">
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
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .inicio-container {
      padding-bottom: 80px;
    }

    .saludo-section {
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 4px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .header-info-inicio {
      text-align: center;
      margin-bottom: 24px;

      .icono-principal {
        font-size: 48px;
        color: var(--ion-color-warning);
      }

      h3 {
        font-size: 20px;
        font-weight: 600;
        margin: 16px 0 8px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
        font-size: 14px;
      }
    }

    .tipos-grid-inicio {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .tipo-card-inicio {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
      background: var(--ion-color-light);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:active {
        transform: scale(0.95);
        background: var(--ion-color-primary-tint);
      }

      .emoji {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .nombre {
        font-size: 12px;
        text-align: center;
        color: var(--ion-color-dark);
        font-weight: 500;
      }
    }

    .section {
      margin-bottom: 24px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 16px;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h3 {
        margin: 0;
      }
    }

    .tarjeta-servicio {
      margin: 0 0 12px;
      border-radius: 12px;
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }

    .card-header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      ion-card-title {
        font-size: 16px;
        flex: 1;
        margin-right: 8px;
      }
    }

    .descripcion-corta {
      color: var(--ion-color-medium);
      font-size: 14px;
      margin: 0 0 12px;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .fecha, .ubicacion {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--ion-color-medium);
        font-size: 12px;

        ion-icon {
          font-size: 14px;
        }
      }
    }

    .trabajo-item {
      .trabajo-info {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h4 {
          margin: 0;
          font-size: 16px;
        }
      }

      p {
        margin: 8px 0 0;
        color: var(--ion-color-medium);
        font-size: 14px;
      }
    }

    .empty-state {
      text-align: center;
      padding: 32px;
      background: var(--ion-color-light);
      border-radius: 12px;

      ion-icon {
        font-size: 48px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 12px 0 0;
      }
    }

    .empty-state-grande {
      text-align: center;
      padding: 32px 24px;
      background: var(--ion-color-light);
      border-radius: 16px;
      margin-bottom: 24px;

      ion-icon {
        font-size: 56px;
      }

      h3 {
        font-size: 18px;
        margin: 12px 0 8px;
        color: var(--ion-color-dark);
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
        font-size: 14px;
      }
    }
    .botones-cotizado {
      display: flex;
      gap: 8px;
      
      ion-button {
        flex: 1;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButton,
    IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonRefresher, IonRefresherContent,
    IonChip, IonLabel, IonBadge, IonSkeletonText, IonList, IonItem,
    IonAvatar, IonText,
    NgFor, NgIf, AsyncPipe, DatePipe, SlicePipe
  ],
})
export class InicioPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private authServicio = inject(AuthServicio);
  private serviciosServicio = inject(ServiciosServicio);
  private trabajosServicio = inject(TrabajosServicio);
  private socketServicio = inject(SocketServicio);
  private cotizacionesServicio = inject(CotizacionesServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  usuario: Usuario | null = null;
  serviciosRecientes: Servicio[] = [];
  serviciosDisponibles: Servicio[] = [];
  trabajosActivos: Trabajo[] = [];
  cargando = false;

  // Mapa de servicios que el técnico ya cotizó: servicioId -> cotizacionId
  misCotizacionesIds = new Map<string, string>();

  serviciosPopulares = TIPOS_SERVICIO.slice(0, 8);
  tiposServicioCompletos = TIPOS_SERVICIO;

  // Suscripciones
  private subscriptions: Subscription[] = [];

  // Mapa de emojis para cada tipo de servicio
  private emojisServicio: { [key: string]: string } = {
    'plomeria': '🔧',
    'electricidad': '⚡',
    'cerrajeria': '🔑',
    'carpinteria': '🔨',
    'pintura': '🎨',
    'aire_acondicionado': '❄️',
    'refrigeracion': '🧊',
    'albanileria': '🧱',
    'herreria': '⚙️',
    'jardineria': '🌱',
    'limpieza': '🧹',
    'mudanzas': '📦',
    'electrodomesticos': '📺',
    'computadoras': '💻',
    'otro': '🔨'
  };

  constructor() {
    addIcons({
      addOutline, flashOutline, locationOutline, starOutline,
      constructOutline, briefcaseOutline, timeOutline, chevronForwardOutline,
      alertCircleOutline,
      // Iconos para tipos de servicio
      waterOutline, keyOutline, hammerOutline, colorPaletteOutline,
      snowOutline, businessOutline, leafOutline, sparklesOutline,
      cubeOutline, tvOutline, laptopOutline, ellipsisHorizontalOutline
    });
  }

  ngOnInit(): void {
    this.usuario = this.authServicio.obtenerUsuario();
    this.socketServicio.conectar();
    this.cargarDatos();
    this.configurarSuscripciones();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configura suscripciones a eventos de socket para actualización en tiempo real
   */
  private configurarSuscripciones(): void {
    // Escuchar notificaciones relevantes para recargar datos
    const notifSub = this.socketServicio.notificacion$.subscribe(notif => {
      const tiposRecargar = [
        'nueva_cotizacion',
        'cotizacion_aceptada',
        'cotizacion_cancelada',
        'cotizacion_no_seleccionada',
        'trabajo_estado_actualizado',
        'estado_actualizado'
      ];

      if (tiposRecargar.includes(notif.tipo)) {
        console.log('🔄 Recargando datos por notificación:', notif.tipo);
        this.cargarDatos();
      }
    });
    this.subscriptions.push(notifSub);
  }

  get esCliente(): boolean {
    return this.authServicio.esCliente();
  }

  get esTecnico(): boolean {
    return this.authServicio.esTecnico();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;

    try {
      if (this.esCliente) {
        // Cargar servicios del cliente
        this.serviciosServicio.obtenerMisServicios({ limite: 3 }).subscribe({
          next: (res) => {
            if (res.datos) {
              // res.datos puede ser un array o un objeto con array
              this.serviciosRecientes = Array.isArray(res.datos) ? res.datos : [];
            }
          },
          error: (err) => console.log('Error cargando servicios:', err)
        });
      } else if (this.esTecnico) {
        // Obtener coordenadas del técnico (usa perfil o Quito por defecto)
        const coordenadas = this.obtenerCoordenadasTecnico();
        console.log('📍 Coordenadas para buscar servicios:', coordenadas);

        // Cargar servicios disponibles con coordenadas
        this.serviciosServicio.obtenerServiciosDisponibles({
          limite: 5,
          latitud: coordenadas?.latitud ?? -0.1807,
          longitud: coordenadas?.longitud ?? -78.4678,
          radio: 15
        }).subscribe({
          next: (res) => {
            if (res.datos) {
              this.serviciosDisponibles = Array.isArray(res.datos) ? res.datos : [];
              // Después de cargar servicios, verificar cuáles ya cotizó
              this.cargarMisCotizaciones();
            }
          },
          error: (err) => {
            console.log('Error cargando servicios disponibles:', err);
            this.serviciosDisponibles = [];
          }
        });

        // Cargar trabajos activos
        this.trabajosServicio.obtenerMisTrabajos({ limite: 3 }).subscribe({
          next: (res) => {
            if (res.datos) {
              const datos = Array.isArray(res.datos) ? res.datos : [];
              this.trabajosActivos = datos.filter(
                t => ['programado', 'en_camino', 'en_progreso'].includes(t.estado)
              );
            }
          },
          error: (err) => {
            console.log('Error cargando trabajos:', err);
            this.trabajosActivos = [];
          }
        });
      }
    } finally {
      this.cargando = false;
    }
  }

  async refrescar(event: any): Promise<void> {
    await this.cargarDatos();
    event.target.complete();
  }

  nuevoServicio(tipo?: string): void {
    if (tipo) {
      this.router.navigate(['/nuevo-servicio'], { queryParams: { tipo } });
    } else {
      this.router.navigate(['/nuevo-servicio']);
    }
  }

  // Método para obtener emoji de servicio
  obtenerEmojiServicio(tipo: string): string {
    return this.emojisServicio[tipo] || '🔧';
  }

  // Método para seleccionar tipo de servicio desde el grid
  seleccionarTipoServicio(tipo: string): void {
    // Navegar a nuevo-servicio con la especialidad preseleccionada
    this.router.navigate(['/nuevo-servicio'], { queryParams: { tipo } });
  }

  tecnicoInstantaneo(): void {
    this.router.navigate(['/tecnico-instantaneo']);
  }

  verServicio(id: string): void {
    this.router.navigate(['/servicio', id]);
  }

  verTrabajo(id: string): void {
    this.router.navigate(['/trabajo', id]);
  }

  cotizar(servicioId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/nueva-cotizacion', servicioId]);
  }

  editarCotizacion(servicioId: string, event: Event): void {
    event.stopPropagation();
    const cotizacionId = this.misCotizacionesIds.get(servicioId);
    if (cotizacionId) {
      // Navegar a editar cotización existente
      this.router.navigate(['/nueva-cotizacion', servicioId], {
        queryParams: { editar: cotizacionId }
      });
    }
  }

  /**
   * Elimina (cancela) una cotización pendiente del técnico
   */
  async eliminarCotizacion(servicioId: string, event: Event): Promise<void> {
    event.stopPropagation();

    const cotizacionId = this.misCotizacionesIds.get(servicioId);
    if (!cotizacionId) {
      console.error('No se encontró la cotización para el servicio:', servicioId);
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar Cotización',
      message: '¿Estás seguro de que deseas eliminar esta cotización?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.cotizacionesServicio.cancelarCotizacion(cotizacionId).subscribe({
              next: async () => {
                // Remover del mapa local
                this.misCotizacionesIds.delete(servicioId);

                const toast = await this.toastCtrl.create({
                  message: 'Cotización eliminada correctamente',
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();

                // Recargar servicios disponibles
                this.cargarDatos();
              },
              error: async (err) => {
                console.error('Error eliminando cotización:', err);
                const toast = await this.toastCtrl.create({
                  message: err.error?.mensaje || 'Error al eliminar la cotización',
                  duration: 3000,
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

  /**
   * Carga las cotizaciones del técnico para identificar servicios ya cotizados
   */
  private cargarMisCotizaciones(): void {
    this.cotizacionesServicio.obtenerMisCotizaciones({ limite: 100 }).subscribe({
      next: (res: any) => {
        this.misCotizacionesIds.clear();
        const cotizaciones = res.datos?.cotizaciones || [];
        cotizaciones.forEach((cot: any) => {
          // Solo considerar cotizaciones pendientes (editables)
          if (cot.estado === 'pendiente') {
            const servicioId = typeof cot.idServicio === 'string'
              ? cot.idServicio
              : cot.idServicio?._id;
            if (servicioId) {
              this.misCotizacionesIds.set(servicioId, cot._id);
            }
          }
        });
        console.log('📋 Cotizaciones cargadas:', this.misCotizacionesIds.size);
      },
      error: (err) => {
        console.log('Error cargando cotizaciones:', err);
      }
    });
  }

  obtenerEtiquetaTipo(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  obtenerEtiquetaEstado(estado: string): string {
    const estados: Record<string, string> = {
      'publicado': 'Publicado',
      'cotizado': 'Cotizado',
      'asignado': 'Asignado',
      'en_progreso': 'En Progreso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  obtenerEtiquetaEstadoTrabajo(estado: string): string {
    const estados: Record<string, string> = {
      'programado': 'Programado',
      'en_camino': 'En Camino',
      'en_progreso': 'En Progreso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  /**
   * Obtiene las coordenadas del técnico desde su perfil o usa Quito por defecto
   * Si las coordenadas son [0,0] (no configuradas), usa Quito como fallback
   */
  private obtenerCoordenadasTecnico(): { latitud: number; longitud: number } {
    // Coordenadas por defecto (Quito, Ecuador - Centro)
    const QUITO_DEFAULT = {
      latitud: -0.1807,
      longitud: -78.4678
    };

    // Intentar obtener coordenadas del técnico desde datosTecnico.ubicacionBase
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

    // Si no hay coordenadas válidas, usar Quito por defecto
    console.log('⚠️ Técnico sin ubicación configurada, usando Quito por defecto');
    return QUITO_DEFAULT;
  }
}
