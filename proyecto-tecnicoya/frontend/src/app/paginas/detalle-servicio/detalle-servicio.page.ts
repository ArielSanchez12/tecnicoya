import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge,
  IonButton, IonIcon, IonSpinner, IonAvatar, IonChip, IonLabel,
  IonList, IonItem, IonNote, AlertController, ToastController, ActionSheetController,
  LoadingController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, calendarOutline, timeOutline, personOutline,
  callOutline, chatbubbleOutline, starOutline, star, flashOutline,
  checkmarkCircleOutline, closeCircleOutline, ellipsisHorizontal,
  documentTextOutline, cashOutline, imageOutline, shieldCheckmarkOutline,
  constructOutline, chevronForwardOutline
} from 'ionicons/icons';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { CotizacionesServicio } from '../../servicios/cotizaciones.servicio';
import { AuthServicio } from '../../servicios/auth.servicio';
import { SocketServicio } from '../../servicios/socket.servicio';
import { Servicio, Cotizacion, ESTADOS_SERVICIO, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, DatePipe, DecimalPipe, CurrencyPipe, SlicePipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detalle-servicio',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/servicios"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Servicio</ion-title>
        @if (esCliente && (servicio?.estado === 'pendiente' || servicio?.estado === 'publicado')) {
          <ion-buttons slot="end">
            <ion-button (click)="mostrarOpciones()">
              <ion-icon name="ellipsis-horizontal"></ion-icon>
            </ion-button>
          </ion-buttons>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Cargando...</p>
        </div>
      } @else if (servicio) {
        <!-- Información principal -->
        <ion-card>
          <ion-card-header>
            <div class="servicio-header">
              <div>
                <ion-badge [color]="obtenerColorEstado(servicio.estado)">
                  {{ obtenerEtiquetaEstado(servicio.estado) }}
                </ion-badge>
                @if (servicio.urgencia === 'emergencia') {
                  <ion-badge color="danger">
                    <ion-icon name="flash-outline"></ion-icon>
                    URGENTE
                  </ion-badge>
                }
              </div>
              <ion-chip size="small">
                <ion-label>{{ obtenerEtiquetaTipo(servicio.tipo || servicio.tipoServicio) }}</ion-label>
              </ion-chip>
            </div>
            <ion-card-title>{{ servicio.titulo }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p class="descripcion">{{ servicio.descripcion }}</p>
            
            <div class="info-grid">
              <div class="info-item">
                <ion-icon name="location-outline" color="primary"></ion-icon>
                <div>
                  <span class="label">Ubicación</span>
                  <span class="value">{{ servicio.ubicacion?.direccion || 'Sin ubicación' }}</span>
                </div>
              </div>
              <div class="info-item">
                <ion-icon name="calendar-outline" color="primary"></ion-icon>
                <div>
                  <span class="label">Fecha solicitada</span>
                  <span class="value">{{ (servicio.fechaDeseada | date:'dd/MM/yyyy') || 'Lo antes posible' }}</span>
                </div>
              </div>
              <div class="info-item">
                <ion-icon name="time-outline" color="primary"></ion-icon>
                <div>
                  <span class="label">Creado</span>
                  <span class="value">{{ (servicio.createdAt || servicio.fechaCreacion) | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Fotos del servicio -->
        @if (servicio.fotos && servicio.fotos.length > 0) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="image-outline"></ion-icon>
                Fotos del problema
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="fotos-grid">
                @for (foto of servicio.fotos; track $index) {
                  <img [src]="foto.url || foto" alt="Foto del servicio" (click)="verFoto(foto.url || foto)"/>
                }
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Técnico asignado (si hay) -->
        @if (servicio.tecnicoAsignado) {
          <ion-card class="tarjeta-tecnico" (click)="verTecnico(servicio.tecnicoAsignado._id)">
            <ion-card-header>
              <ion-card-title>Técnico Asignado</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="tecnico-info">
                <ion-avatar>
                  <img [src]="servicio.tecnicoAsignado.perfil?.fotoUrl || servicio.tecnicoAsignado.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt=""/>
                </ion-avatar>
                <div class="tecnico-datos">
                  <div class="nombre-row">
                    <h4>{{ servicio.tecnicoAsignado.nombre }} {{ servicio.tecnicoAsignado.apellido }}</h4>
                    @if (servicio.tecnicoAsignado.datosTecnico?.verificado) {
                      <span class="badge-tecnico-verificado">
                        <ion-icon name="shield-checkmark-outline"></ion-icon>
                        Verificado
                      </span>
                    }
                  </div>
                  <div class="calificacion">
                    <ion-icon name="star" color="warning"></ion-icon>
                    <span>{{ servicio.tecnicoAsignado.datosTecnico?.calificacionPromedio | number:'1.1-1' }}</span>
                  </div>
                </div>
                <div class="tecnico-acciones">
                  <ion-button fill="clear" (click)="llamar(servicio.tecnicoAsignado.telefono, $event)">
                    <ion-icon name="call-outline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" (click)="abrirChat(servicio.tecnicoAsignado._id, $event)">
                    <ion-icon name="chatbubble-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Botón para ir al trabajo (cuando hay trabajo asociado) -->
        @if (trabajoAsociado) {
          <ion-card class="trabajo-card" (click)="irAlTrabajo()">
            <ion-card-content>
              <div class="trabajo-enlace">
                <ion-icon name="construct-outline" color="primary"></ion-icon>
                <div class="trabajo-info">
                  <h4>Ver Detalles del Trabajo</h4>
                  <p>Estado: {{ obtenerEtiquetaEstadoTrabajo(trabajoAsociado.estado) }}</p>
                </div>
                <ion-icon name="chevron-forward-outline" class="icon-forward"></ion-icon>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Cotizaciones recibidas (solo para clientes en estado pendiente/cotizado) -->
        @if (esCliente && (servicio.estado === 'pendiente' || servicio.estado === 'cotizado') && cotizaciones.length > 0) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="document-text-outline"></ion-icon>
                Cotizaciones Recibidas ({{ cotizaciones.length }})
              </ion-card-title>
            </ion-card-header>
            <ion-card-content class="cotizaciones-content">
              @for (cotizacion of cotizaciones; track cotizacion._id) {
                <div class="tarjeta-cotizacion" (click)="verCotizacion(cotizacion._id)">
                  <div class="cotizacion-header">
                    <ion-avatar>
                      <img [src]="obtenerFotoCotizacion(cotizacion)" alt=""/>
                    </ion-avatar>
                    <div class="cotizacion-tecnico">
                      <div class="nombre-row">
                        <h5>{{ obtenerNombreTecnico(cotizacion) }}</h5>
                        @if (esTecnicoVerificado(cotizacion)) {
                          <span class="badge-tecnico-verificado">
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                            Verificado
                          </span>
                        }
                      </div>
                      <div class="calificacion-mini">
                        <ion-icon name="star" color="warning"></ion-icon>
                        {{ obtenerCalificacionTecnico(cotizacion) | number:'1.1-1' }}
                      </div>
                    </div>
                    <div class="cotizacion-monto">
                      {{ (cotizacion.precio || cotizacion.montoTotal || 0) | currency:'USD':'symbol':'1.2-2' }}
                    </div>
                  </div>
                  <p class="cotizacion-descripcion">{{ (cotizacion.descripcionTrabajo || cotizacion.descripcion || 'Sin descripción') | slice:0:100 }}...</p>
                  <div class="cotizacion-footer">
                    <span>
                      <ion-icon name="time-outline"></ion-icon>
                      {{ formatearTiempoEstimado(cotizacion.tiempoEstimado) }}
                    </span>
                    <ion-button size="small" (click)="aceptarCotizacion(cotizacion._id, $event)">
                      Aceptar
                    </ion-button>
                  </div>
                </div>
              }
            </ion-card-content>
          </ion-card>
        }

        <!-- Botones de acción para técnicos -->
        @if (esTecnico && servicio.estado === 'pendiente') {
          <div class="ion-padding">
            <ion-button expand="block" (click)="enviarCotizacion()">
              <ion-icon name="cash-outline" slot="start"></ion-icon>
              Enviar Cotización
            </ion-button>
          </div>
        }

        <!-- Acciones según estado -->
        @if (servicio.estado === 'en_progreso') {
          <div class="ion-padding">
            @if (esTecnico) {
              <ion-button expand="block" color="success" (click)="marcarCompletado()">
                <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                Marcar como Completado
              </ion-button>
            }
          </div>
        }

        @if (servicio.estado === 'completado' && esCliente && trabajoAsociado && !trabajoAsociado.resenaCliente && !servicio.resena) {
          <div class="ion-padding">
            <ion-button expand="block" (click)="escribirResena()">
              <ion-icon name="star-outline" slot="start"></ion-icon>
              Escribir Reseña
            </ion-button>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;

      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    ion-card {
      margin: 16px;
      border-radius: 12px;
    }

    .servicio-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;

      > div {
        display: flex;
        gap: 8px;
      }
    }

    .descripcion {
      color: var(--ion-color-medium);
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      ion-icon {
        font-size: 24px;
        margin-top: 2px;
      }

      .label {
        display: block;
        font-size: 12px;
        color: var(--ion-color-medium);
      }

      .value {
        display: block;
        font-size: 14px;
      }
    }

    .fotos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;

      img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
        border-radius: 8px;
        cursor: pointer;
      }
    }

    .tarjeta-tecnico {
      cursor: pointer;
    }

    .tecnico-info {
      display: flex;
      align-items: center;
      gap: 12px;

      ion-avatar {
        width: 56px;
        height: 56px;
      }

      .tecnico-datos {
        flex: 1;

        h4 {
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
          }
        }
      }

      .tecnico-acciones {
        display: flex;
        gap: 4px;
      }
    }

    .cotizaciones-content {
      padding-top: 0;
    }

    .tarjeta-cotizacion {
      padding: 16px;
      background: var(--ion-color-light);
      border-radius: 12px;
      margin-bottom: 12px;
      cursor: pointer;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .cotizacion-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      ion-avatar {
        width: 44px;
        height: 44px;
      }

      .cotizacion-tecnico {
        flex: 1;

        .nombre-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 2px;
        }

        h5 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .calificacion-mini {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          ion-icon {
            font-size: 14px;
          }
        }
      }

      .cotizacion-monto {
        font-size: 18px;
        font-weight: 700;
        color: var(--ion-color-primary);
      }
    }

    .cotizacion-descripcion {
      font-size: 13px;
      color: var(--ion-color-medium);
      margin: 0 0 12px;
    }

    .cotizacion-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 14px;
        }
      }
    }

    .trabajo-card {
      cursor: pointer;
      margin: 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
      
      ion-card-content {
        padding: 16px;
      }

      .trabajo-enlace {
        display: flex;
        align-items: center;
        gap: 12px;
        color: white;

        > ion-icon:first-child {
          font-size: 32px;
        }

        .trabajo-info {
          flex: 1;

          h4 {
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 600;
          }

          p {
            margin: 0;
            font-size: 13px;
            opacity: 0.9;
          }
        }

        .icon-forward {
          font-size: 20px;
          opacity: 0.8;
        }
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge,
    IonButton, IonIcon, IonSpinner, IonAvatar, IonChip, IonLabel,
    IonList, IonItem, IonNote,
    NgFor, NgIf, DatePipe, DecimalPipe, CurrencyPipe, SlicePipe
  ],
})
export class DetalleServicioPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviciosServicio = inject(ServiciosServicio);
  private cotizacionesServicio = inject(CotizacionesServicio);
  private authServicio = inject(AuthServicio);
  private socketServicio = inject(SocketServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);
  private loadingCtrl = inject(LoadingController);
  private modalCtrl = inject(ModalController);

  servicio: Servicio | null = null;
  cotizaciones: Cotizacion[] = [];
  trabajoAsociado: any = null;
  cargando = false;
  private servicioId = '';
  private subscriptions: Subscription[] = [];

  constructor() {
    addIcons({
      locationOutline, calendarOutline, timeOutline, personOutline,
      callOutline, chatbubbleOutline, starOutline, star, flashOutline,
      checkmarkCircleOutline, closeCircleOutline, ellipsisHorizontal,
      documentTextOutline, cashOutline, imageOutline, shieldCheckmarkOutline,
      constructOutline, chevronForwardOutline
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.servicioId = id;
      this.cargarServicio(id);
      this.configurarSuscripciones();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Configura suscripciones para actualización en tiempo real
   */
  private configurarSuscripciones(): void {
    const sub = this.socketServicio.notificacion$.subscribe(notif => {
      // Recargar si hay cambios en cotizaciones de este servicio
      const tiposRecargar = ['cotizacion_cancelada', 'cotizacion_editada', 'nueva_cotizacion'];
      const servicioAfectado = notif.datos?.idServicio || notif.datos?.servicio?._id;

      if (tiposRecargar.includes(notif.tipo) && servicioAfectado === this.servicioId) {
        console.log('🔄 Recargando servicio por notificación:', notif.tipo);
        this.cargarServicio(this.servicioId);
      }
    });
    this.subscriptions.push(sub);
  }

  get esCliente(): boolean {
    return this.authServicio.esCliente();
  }

  get esTecnico(): boolean {
    return this.authServicio.esTecnico();
  }

  cargarServicio(id: string): void {
    this.cargando = true;
    this.serviciosServicio.obtenerServicio(id).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res.datos) {
          // El backend devuelve { servicio, cotizaciones, trabajo } dentro de datos
          this.servicio = res.datos.servicio || res.datos;
          this.cotizaciones = res.datos.cotizaciones || [];
          this.trabajoAsociado = res.datos.trabajo || null;
        }
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('Error al cargar el servicio', 'danger');
      }
    });
  }

  async mostrarOpciones(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
    header: 'Opciones',
    buttons: [
      {
        text: 'Editar Servicio',
        handler: () => this.editarServicio()
      },
      {
        text: 'Cancelar Servicio',
        role: 'destructive',
        handler: () => this.cancelarServicio()
      },
      {
        text: 'Cerrar',
        role: 'cancel'
      }
      ]
    });
    await actionSheet.present();
  }

  editarServicio(): void {
    this.router.navigate(['/editar-servicio', this.servicio?._id]);
  }

  async cancelarServicio(): Promise<void> {
    const alert = await this.alertCtrl.create({
    header: 'Cancelar Servicio',
    message: '¿Estás seguro de que deseas cancelar este servicio?',
    buttons: [
      { text: 'No', role: 'cancel' },
      {
        text: 'Sí, Cancelar',
        role: 'destructive',
        handler: () => {
          this.serviciosServicio.cancelarServicio(this.servicio!._id).subscribe({
            next: () => {
              this.mostrarToast('Servicio cancelado');
              this.router.navigate(['/tabs/servicios']);
            },
            error: () => this.mostrarToast('Error al cancelar', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  verFoto(url: string): void {
    // Implementar visor de fotos
  }

  verTecnico(id: string): void {
    this.router.navigate(['/tecnico', id]);
  }

  irAlTrabajo(): void {
    if (this.trabajoAsociado?._id) {
      this.router.navigate(['/trabajo', this.trabajoAsociado._id]);
    }
  }

  obtenerEtiquetaEstadoTrabajo(estado: string): string {
    const etiquetas: Record<string, string> = {
      'programado': 'Programado',
      'en_camino': 'Técnico en camino',
      'en_progreso': 'En progreso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return etiquetas[estado] || estado;
  }

  llamar(telefono: string, event: Event): void {
    event.stopPropagation();
    window.location.href = `tel:${telefono}`;
  }

  abrirChat(tecnicoId: string, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/chat', tecnicoId]);
  }

  async verCotizacion(id: string): Promise<void> {
    const cotizacion = this.cotizaciones.find(c => c._id === id);
    if (!cotizacion) return;

    const precio = cotizacion.precio || (cotizacion as any).montoTotal || 0;
    const tecnico = (cotizacion as any).idTecnico || (cotizacion as any).tecnico;
    const nombreTecnico = cotizacion.datosTecnicoSnapshot?.nombre ||
      `${tecnico?.nombre || ''} ${tecnico?.apellido || ''}`.trim() || 'Técnico';
    const descripcion = cotizacion.descripcionTrabajo || (cotizacion as any).descripcion || 'Sin descripción';
    const tiempo = this.formatearTiempoEstimado(cotizacion.tiempoEstimado);
    const garantia = cotizacion.garantia || (cotizacion as any).notasAdicionales || 'No especificada';

    // Construir lista de materiales como texto plano
    let materialesTexto = '';
    if (cotizacion.materiales && cotizacion.materiales.length > 0) {
      materialesTexto = '\n\n📦 DESGLOSE DE COSTOS:\n';
      cotizacion.materiales.forEach((item: any, index: number) => {
        const nombre = item.nombre || item.concepto || item.descripcion || 'Item';
        const cantidad = item.cantidad || 1;
        const precioUnit = item.precioUnitario || item.precio || 0;
        const subtotal = cantidad * precioUnit;
        materialesTexto += `• ${nombre}: ${cantidad} x $${precioUnit.toFixed(2)} = $${subtotal.toFixed(2)}\n`;
      });
    }

    const mensaje = `📝 DESCRIPCIÓN:\n${descripcion}\n\n⏱️ TIEMPO ESTIMADO: ${tiempo}\n\n🛡️ GARANTÍA: ${garantia}${materialesTexto}`;

    const alert = await this.alertCtrl.create({
      header: `Cotización de ${nombreTecnico}`,
      subHeader: `💰 Total: $${precio.toFixed(2)}`,
      message: mensaje,
      cssClass: 'alert-cotizacion-detalle',
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        },
        {
          text: 'Aceptar cotización',
          handler: () => {
            this.aceptarCotizacion(id, new Event('click'));
          }
        }
      ]
    });
    await alert.present();
  }

  async aceptarCotizacion(cotizacionId: string, event: Event): Promise<void> {
    event.stopPropagation();

    // Buscar la cotización
    const cotizacion = this.cotizaciones.find(c => c._id === cotizacionId);
    if (!cotizacion) return;

    const precio = cotizacion.precio || (cotizacion as any).montoTotal || 0;
    const tarifaGarantia = precio * 0.03;

    const alert = await this.alertCtrl.create({
      header: '¿Activar Garantía de Satisfacción?',
      subHeader: `Por solo $${tarifaGarantia.toFixed(2)} adicionales (3%)`,
      message: `Tu dinero queda protegido hasta que apruebes el trabajo.\n\n💰 Precio del servicio: $${precio.toFixed(2)}\n🛡️ Con garantía: $${(precio + tarifaGarantia).toFixed(2)}`,
      buttons: [
        {
          text: 'No, gracias',
          handler: () => this.mostrarFormularioPago(cotizacionId, false, precio)
        },
        {
          text: 'Sí, activar garantía',
          handler: () => this.mostrarFormularioPago(cotizacionId, true, precio + tarifaGarantia)
        }
      ]
    });
    await alert.present();
  }

  private async mostrarFormularioPago(cotizacionId: string, conGarantia: boolean, montoTotal: number): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '💳 Datos de Pago',
      subHeader: `Total a pagar: $${montoTotal.toFixed(2)}`,
      cssClass: 'alert-pago-tarjeta',
      inputs: [
        {
          name: 'numeroTarjeta',
          type: 'text',
          value: '7777 7777 7777 7777',
          placeholder: 'Número de tarjeta (1234 5678 9012 3456)',
          attributes: {
            maxlength: 19
          }
        },
        {
          name: 'nombreTitular',
          type: 'text',
          placeholder: 'Nombre del titular'
        },
        {
          name: 'fechaExpiracion',
          type: 'text',
          placeholder: 'MM/AA (ej: 12/28)'
        },
        {
          name: 'cvv',
          type: 'password',
          value: '777',
          placeholder: 'CVV (3 dígitos)',
          attributes: {
            maxlength: 4
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Pagar',
          handler: (data) => {
          // Validar datos básicos
          if (!data.numeroTarjeta || !data.nombreTitular || !data.fechaExpiracion || !data.cvv) {
            this.mostrarToast('Por favor completa todos los campos', 'warning');
            return false;
          }
          // Validar formato básico
          if (data.numeroTarjeta.replace(/\s/g, '').length < 13) {
            this.mostrarToast('Número de tarjeta inválido', 'warning');
            return false;
          }
          if (data.cvv.length < 3) {
            this.mostrarToast('CVV inválido', 'warning');
            return false;
          }
          // Procesar pago
          this.procesarPagoConTarjeta(cotizacionId, conGarantia, montoTotal, data);
          return true;
        }
      }
      ]
    });
    await alert.present();
  }

  private async procesarPagoConTarjeta(cotizacionId: string, conGarantia: boolean, montoTotal: number, datosTarjeta: any): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Procesando pago...',
      spinner: 'crescent'
    });
    await loading.present();

    // Simular verificación de tarjeta
    await new Promise(resolve => setTimeout(resolve, 1500));

    loading.message = 'Verificando tarjeta...';
    await new Promise(resolve => setTimeout(resolve, 1000));

    loading.message = 'Autorizando transacción...';
    await new Promise(resolve => setTimeout(resolve, 1000));

    this.cotizacionesServicio.aceptarCotizacion(cotizacionId, { conGarantia: conGarantia }).subscribe({
      next: async (res: any) => {
        await loading.dismiss();

        // Mostrar confirmación de pago exitoso
        const alertExito = await this.alertCtrl.create({
          header: '✅ ¡Pago Exitoso!',
          message: `Se han cargado $${montoTotal.toFixed(2)} a tu tarjeta terminada en ****${datosTarjeta.numeroTarjeta.slice(-4)}.\n\n${conGarantia ? '🛡️ Garantía de satisfacción activada' : ''}`,
          buttons: ['Continuar']
        });
        await alertExito.present();
        await alertExito.onDidDismiss();

        // Actualizar estado local inmediatamente para que la vista cambie
        if (this.servicio) {
          this.servicio.estado = 'asignado';
        }
        // Limpiar cotizaciones ya que el servicio fue asignado
        this.cotizaciones = [];
        // Guardar el trabajo asociado
        if (res.datos?.trabajo) {
          this.trabajoAsociado = res.datos.trabajo;
        }

        // Navegar al trabajo creado
        if (res.datos?.trabajo?._id) {
          this.router.navigate(['/trabajo', res.datos.trabajo._id], { replaceUrl: true });
        } else {
          // Recargar para obtener el estado actualizado del servidor
          this.cargarServicio(this.servicio!._id);
        }
      },
      error: async (err) => {
        await loading.dismiss();
        this.mostrarToast(err.error?.mensaje || 'Error al procesar pago', 'danger');
      }
    });
  }

  enviarCotizacion(): void {
    this.router.navigate(['/nueva-cotizacion', this.servicio?._id]);
  }

  async marcarCompletado(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Completar Trabajo',
      message: '¿Confirmas que has terminado el trabajo?',
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, Completado',
          handler: () => {
            // Lógica para marcar como completado
            this.mostrarToast('¡Trabajo marcado como completado!', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  escribirResena(): void {
    this.router.navigate(['/nueva-resena', this.servicio?._id]);
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
    if (!tipo) return 'Sin tipo';
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  // Helpers para manejar datos de cotización (el backend usa idTecnico en vez de tecnico)
  obtenerFotoCotizacion(cotizacion: any): string {
    // Primero intentar datosTecnicoSnapshot (datos guardados en la cotización)
    if (cotizacion.datosTecnicoSnapshot?.fotoUrl) {
      return cotizacion.datosTecnicoSnapshot.fotoUrl;
    }
    // Luego intentar idTecnico (populated del backend)
    const tecnico = cotizacion.idTecnico || cotizacion.tecnico;
    if (tecnico?.perfil?.fotoUrl) return tecnico.perfil.fotoUrl;
    if (tecnico?.perfil?.fotoPerfil) return tecnico.perfil.fotoPerfil;
    return 'assets/avatar-default.png';
  }

  obtenerNombreTecnico(cotizacion: any): string {
    // Primero intentar datosTecnicoSnapshot
    if (cotizacion.datosTecnicoSnapshot?.nombre) {
      return cotizacion.datosTecnicoSnapshot.nombre;
    }
    // Luego intentar idTecnico populated
    const tecnico = cotizacion.idTecnico || cotizacion.tecnico;
    if (tecnico?.perfil?.nombre) {
      return `${tecnico.perfil.nombre} ${tecnico.perfil.apellido || ''}`.trim();
    }
    if (tecnico?.nombre) {
      return `${tecnico.nombre} ${tecnico.apellido || ''}`.trim();
    }
    return 'Técnico';
  }

  obtenerCalificacionTecnico(cotizacion: any): number {
    // Primero intentar datosTecnicoSnapshot
    if (cotizacion.datosTecnicoSnapshot?.calificacion !== undefined) {
      return cotizacion.datosTecnicoSnapshot.calificacion;
    }
    // Luego intentar idTecnico populated
    const tecnico = cotizacion.idTecnico || cotizacion.tecnico;
    return tecnico?.datosTecnico?.calificacionPromedio || 0;
  }

  esTecnicoVerificado(cotizacion: any): boolean {
    // Verificar en datosTecnicoSnapshot
    if (cotizacion.datosTecnicoSnapshot?.verificado) {
      return true;
    }
    if (cotizacion.datosTecnicoSnapshot?.membresia?.badgeVerificado) {
      return true;
    }
    // Verificar en idTecnico populated
    const tecnico = cotizacion.idTecnico || cotizacion.tecnico;
    return tecnico?.datosTecnico?.membresia?.badgeVerificado === true ||
      tecnico?.datosTecnico?.verificado === true;
  }

  formatearTiempoEstimado(tiempo: any): string {
    if (!tiempo) return 'No especificado';
    // Si es string, devolverlo directamente
    if (typeof tiempo === 'string') return tiempo;
    // Si es objeto {valor, unidad}
    if (tiempo.valor && tiempo.unidad) {
      return `${tiempo.valor} ${tiempo.unidad}`;
    }
    return 'No especificado';
  }

  private async mostrarToast(mensaje: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
