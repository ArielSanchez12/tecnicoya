/**
 * Página de Detalle de Trabajo
 * TécnicoYa - Frontend
 * Muestra el detalle completo de un trabajo con timeline y acciones
 */

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonButton, IonIcon, IonSpinner, IonAvatar, IonChip, IonLabel,
  IonBadge, IonFab, IonFabButton, IonList, IonItem, IonNote,
  AlertController, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, calendarOutline, timeOutline, personOutline,
  callOutline, chatbubbleOutline, starOutline, star, flashOutline,
  checkmarkCircleOutline, carOutline, constructOutline, shieldCheckmarkOutline,
  cashOutline, warningOutline, thumbsUpOutline, thumbsDownOutline,
  cameraOutline, navigateOutline, closeCircle, addOutline, cloudUploadOutline
} from 'ionicons/icons';
import { TrabajosServicio } from '../../servicios/trabajos.servicio';
import { AuthServicio } from '../../servicios/auth.servicio';
import { SocketServicio } from '../../servicios/socket.servicio';
import { Trabajo, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, DatePipe, DecimalPipe, CurrencyPipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detalle-trabajo',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/trabajos"></ion-back-button>
        </ion-buttons>
        <ion-title>Detalle del Trabajo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Cargando trabajo...</p>
        </div>
      } @else if (trabajo) {
        <!-- Timeline de Estado -->
        <ion-card class="timeline-card">
          <ion-card-header>
            <ion-card-title>Estado del Trabajo</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="timeline">
              <div class="timeline-item" [class.active]="estaEnEstado('programado')" [class.completado]="estadoPasado('programado')">
                <div class="timeline-icon">
                  <ion-icon name="checkmark-circle-outline"></ion-icon>
                </div>
                <span>Aceptado</span>
              </div>
              <div class="timeline-line" [class.active]="estadoPasado('programado')"></div>
              
              <div class="timeline-item" [class.active]="estaEnEstado('en_camino')" [class.completado]="estadoPasado('en_camino')">
                <div class="timeline-icon">
                  <ion-icon name="car-outline"></ion-icon>
                </div>
                <span>En Camino</span>
              </div>
              <div class="timeline-line" [class.active]="estadoPasado('en_camino')"></div>
              
              <div class="timeline-item" [class.active]="estaEnEstado('en_progreso')" [class.completado]="estadoPasado('en_progreso')">
                <div class="timeline-icon">
                  <ion-icon name="construct-outline"></ion-icon>
                </div>
                <span>En Progreso</span>
              </div>
              <div class="timeline-line" [class.active]="estadoPasado('en_progreso')"></div>
              
              <div class="timeline-item" [class.active]="estaEnEstado('completado')" [class.completado]="estadoPasado('completado')">
                <div class="timeline-icon">
                  <ion-icon name="star-outline"></ion-icon>
                </div>
                <span>Completado</span>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Información del Servicio -->
        <ion-card>
          <ion-card-header>
            <ion-card-subtitle>{{ obtenerEtiquetaTipo(trabajo.idServicio?.tipo) }}</ion-card-subtitle>
            <ion-card-title>{{ trabajo.idServicio?.titulo || 'Servicio' }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>{{ trabajo.idServicio?.descripcion }}</p>
            
            <div class="info-grid">
              <div class="info-item">
                <ion-icon name="location-outline" color="primary"></ion-icon>
                <div>
                  <span class="label">Ubicación</span>
                  <span class="value">{{ trabajo.idServicio?.ubicacion?.direccion || 'Sin ubicación' }}</span>
                </div>
              </div>
              @if (trabajo.idServicio?.ubicacion?.referencia) {
                <div class="info-item">
                  <ion-icon name="navigate-outline" color="primary"></ion-icon>
                  <div>
                    <span class="label">Referencia</span>
                    <span class="value">{{ trabajo.idServicio?.ubicacion?.referencia }}</span>
                  </div>
                </div>
              }
              <div class="info-item">
                <ion-icon name="calendar-outline" color="primary"></ion-icon>
                <div>
                  <span class="label">Fecha Programada</span>
                  <span class="value">{{ trabajo.fechaProgramada | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Información de Pago -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="cash-outline"></ion-icon>
              Información de Pago
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="pago-grid">
              <div class="pago-item">
                <span class="label">Monto Total</span>
                <span class="monto">\${{ trabajo.pago?.monto?.toFixed(2) || '0.00' }}</span>
              </div>
              <div class="pago-item">
                <span class="label">Estado del Pago</span>
                <ion-badge [color]="obtenerColorPago(trabajo.pago?.estado)">
                  {{ obtenerEtiquetaPago(trabajo.pago?.estado) }}
                </ion-badge>
              </div>
            </div>
            
            @if (trabajo.pago?.tieneGarantia) {
              <ion-chip color="success">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                <ion-label>Garantía de Satisfacción Activa</ion-label>
              </ion-chip>
            }
          </ion-card-content>
        </ion-card>

        <!-- Información del Técnico (para cliente) -->
        @if (esCliente && trabajo.idTecnico) {
          <ion-card class="persona-card" (click)="verPerfil(trabajo.idTecnico._id)">
            <ion-card-header>
              <ion-card-title>Técnico Asignado</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="persona-info">
                <ion-avatar>
                  <img [src]="trabajo.idTecnico.perfil?.fotoUrl || 'assets/avatar-default.png'" alt=""/>
                </ion-avatar>
                <div class="persona-datos">
                  <div class="nombre-row">
                    <h4>{{ trabajo.idTecnico.perfil?.nombre }} {{ trabajo.idTecnico.perfil?.apellido }}</h4>
                    @if (trabajo.idTecnico.datosTecnico?.verificado) {
                      <span class="badge-tecnico-verificado">
                        <ion-icon name="shield-checkmark-outline"></ion-icon>
                        Verificado
                      </span>
                    }
                  </div>
                  <div class="calificacion">
                    <ion-icon name="star" color="warning"></ion-icon>
                    <span>{{ trabajo.idTecnico.datosTecnico?.calificacion?.toFixed(1) || 'Sin calif.' }}</span>
                    <span class="trabajos">· {{ trabajo.idTecnico.datosTecnico?.trabajosCompletados || 0 }} trabajos</span>
                  </div>
                </div>
                <div class="persona-acciones">
                  <ion-button fill="clear" (click)="llamar(trabajo.idTecnico.perfil?.telefono, $event)" [disabled]="trabajo.estado === 'completado' || trabajo.estado === 'cancelado'">
                    <ion-icon name="call-outline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" (click)="abrirChat($event)" [disabled]="trabajo.estado === 'completado' || trabajo.estado === 'cancelado'">
                    <ion-icon name="chatbubble-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Información del Cliente (para técnico) -->
        @if (esTecnico && trabajo.idCliente) {
          <ion-card class="persona-card">
            <ion-card-header>
              <ion-card-title>Cliente</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="persona-info">
                <ion-avatar>
                  <img [src]="trabajo.idCliente.perfil?.fotoUrl || 'assets/avatar-default.png'" alt=""/>
                </ion-avatar>
                <div class="persona-datos">
                  <h4>{{ trabajo.idCliente.perfil?.nombre }} {{ trabajo.idCliente.perfil?.apellido }}</h4>
                </div>
                <div class="persona-acciones">
                  <ion-button fill="clear" (click)="llamar(trabajo.idCliente.perfil?.telefono, $event)" [disabled]="trabajo.estado === 'completado' || trabajo.estado === 'cancelado'">
                    <ion-icon name="call-outline"></ion-icon>
                  </ion-button>
                  <ion-button fill="clear" (click)="abrirChat($event)" [disabled]="trabajo.estado === 'completado' || trabajo.estado === 'cancelado'">
                    <ion-icon name="chatbubble-outline"></ion-icon>
                  </ion-button>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Acciones para TÉCNICO -->
        @if (esTecnico && trabajo.estado !== 'completado' && trabajo.estado !== 'cancelado') {
          <ion-card class="acciones-card">
            <ion-card-header>
              <ion-card-title>Actualizar Estado</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @if (trabajo.estado === 'programado') {
                <ion-button expand="block" (click)="cambiarEstado('en_camino')">
                  <ion-icon name="car-outline" slot="start"></ion-icon>
                  Estoy en Camino
                </ion-button>
              }
              @if (trabajo.estado === 'en_camino') {
                <ion-button expand="block" (click)="cambiarEstado('en_progreso')">
                  <ion-icon name="construct-outline" slot="start"></ion-icon>
                  Llegué - Iniciar Trabajo
                </ion-button>
              }
              @if (trabajo.estado === 'en_progreso') {
                <ion-button expand="block" color="success" (click)="cambiarEstado('completado')">
                  <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                  Marcar como Completado
                </ion-button>
                
                <!-- Sección de fotos del trabajo (siempre visible) -->
                <div class="fotos-trabajo-section ion-margin-top">
                  <p class="fotos-titulo">📷 Fotos del trabajo (opcional, máx. 5)</p>
                  <div class="fotos-grid">
                    @for (foto of fotosPreview; track $index) {
                      <div class="foto-item">
                        <img [src]="foto" alt="Foto del trabajo"/>
                        <ion-icon 
                          name="close-circle" 
                          class="btn-eliminar"
                          (click)="eliminarFoto($index)"
                        ></ion-icon>
                      </div>
                    }
                    @if (fotosPreview.length < 5) {
                      <div class="foto-agregar" (click)="agregarFotoDirecta()">
                        <ion-icon name="add-outline"></ion-icon>
                      </div>
                    }
                  </div>
                  @if (fotosPreview.length > 0 && !fotosCargadas) {
                    <ion-button expand="block" color="success" class="ion-margin-top" (click)="confirmarSubidaFotos()">
                      <ion-icon name="cloud-upload-outline" slot="start"></ion-icon>
                      Subir {{ fotosPreview.length }} foto(s)
                    </ion-button>
                  }
                  @if (fotosCargadas) {
                    <p class="fotos-subidas-exito ion-text-center ion-margin-top">
                      ✅ Fotos subidas correctamente
                    </p>
                  }
                </div>
              }
              @if (trabajo.estado === 'completado' && trabajo.pago?.estado !== 'liberado') {
                <p class="texto-espera ion-text-center ion-margin-top">
                  ⏳ Esperando aprobación del cliente...
                </p>
                <ion-button expand="block" fill="outline" color="warning" class="ion-margin-top" (click)="iniciarDisputa()">
                  <ion-icon name="warning-outline" slot="start"></ion-icon>
                  Iniciar Disputa
                </ion-button>
              }
            </ion-card-content>
          </ion-card>
        }

        <!-- Acciones para CLIENTE cuando trabajo está completado -->
        @if (esCliente && trabajo.estado === 'completado' && trabajo.pago?.estado !== 'liberado') {
          <ion-card class="acciones-card cliente-acciones">
            <ion-card-header>
              <ion-card-title>¿Apruebas el trabajo?</ion-card-title>
              <ion-card-subtitle>Al aprobar, el pago será liberado al técnico</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <ion-button expand="block" color="success" (click)="aprobarTrabajo()">
                <ion-icon name="thumbs-up-outline" slot="start"></ion-icon>
                Aprobar Trabajo
              </ion-button>
              <ion-button expand="block" fill="outline" color="danger" class="ion-margin-top" (click)="reportarProblema()">
                <ion-icon name="warning-outline" slot="start"></ion-icon>
                Reportar Problema
              </ion-button>
            </ion-card-content>
          </ion-card>
        }

        <!-- Mensaje cuando pago está liberado -->
        @if (trabajo.pago?.estado === 'liberado') {
          <ion-card class="exito-card">
            <ion-card-content>
              <div class="exito-content">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <h3>Trabajo Aprobado</h3>
                <p>El pago ha sido liberado al técnico</p>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Botón de reseña para CLIENTE -->
          @if (esCliente && !trabajo.resenaCliente) {
            <ion-card class="resena-card">
              <ion-card-content>
                <div class="resena-prompt">
                  <ion-icon name="star" color="warning"></ion-icon>
                  <div class="resena-texto">
                    <h4>¿Cómo fue tu experiencia?</h4>
                    <p>Tu opinión ayuda a otros usuarios</p>
                  </div>
                </div>
                <ion-button color="primary" size="default" (click)="dejarResena()">
                  <ion-icon name="star-outline" slot="start"></ion-icon>
                  Calificar Servicio
                </ion-button>
              </ion-card-content>
            </ion-card>
          }

          <!-- Botón de reseña para TÉCNICO -->
          @if (esTecnico && !trabajo.resenaTecnico) {
            <ion-card class="resena-card">
              <ion-card-content>
                <div class="resena-prompt">
                  <ion-icon name="star" color="warning"></ion-icon>
                  <div class="resena-texto">
                    <h4>¿Cómo fue el cliente?</h4>
                    <p>Califica tu experiencia con este cliente</p>
                  </div>
                </div>
                <ion-button color="primary" size="default" (click)="dejarResenaAlCliente()">
                  <ion-icon name="star-outline" slot="start"></ion-icon>
                  Calificar Cliente
                </ion-button>
              </ion-card-content>
            </ion-card>
          }
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
      padding: 64px 16px;

      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    .timeline-card ion-card-content {
      padding: 16px;
    }

    .timeline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .timeline-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      opacity: 0.4;

      .timeline-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--ion-color-light);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--ion-color-light);

        ion-icon {
          font-size: 20px;
          color: var(--ion-color-medium);
        }
      }

      span {
        font-size: 10px;
        text-align: center;
        color: var(--ion-color-medium);
      }

      &.active {
        opacity: 1;

        .timeline-icon {
          background: var(--ion-color-success);
          border-color: var(--ion-color-success);

          ion-icon {
            color: white;
          }
        }

        span {
          color: var(--ion-color-success);
          font-weight: 600;
        }
      }

      &.completado {
        opacity: 1;

        .timeline-icon {
          background: var(--ion-color-success);
          border-color: var(--ion-color-success);

          ion-icon {
            color: white;
          }
        }

        span {
          color: var(--ion-color-success);
          font-weight: 600;
        }
      }
    }

    .timeline-line {
      flex: 1;
      height: 4px;
      background: var(--ion-color-light);
      margin: 0 4px;
      border-radius: 2px;

      &.active {
        background: var(--ion-color-success);
      }
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
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
        font-weight: 500;
      }
    }

    .pago-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;

      .pago-item {
        .label {
          display: block;
          font-size: 12px;
          color: var(--ion-color-medium);
          margin-bottom: 4px;
        }

        .monto {
          font-size: 24px;
          font-weight: 700;
          color: var(--ion-color-primary);
        }
      }
    }

    .persona-card {
      cursor: pointer;

      &:active {
        opacity: 0.8;
      }
    }

    .persona-info {
      display: flex;
      align-items: center;
      gap: 12px;

      ion-avatar {
        width: 56px;
        height: 56px;
      }

      .persona-datos {
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
          font-size: 14px;
          color: var(--ion-color-medium);

          ion-icon {
            font-size: 16px;
          }

          .trabajos {
            font-size: 12px;
          }
        }
      }

      .persona-acciones {
        display: flex;
        gap: 4px;
      }
    }

    .acciones-card {
      ion-button {
        --border-radius: 8px;
      }
    }

    .cliente-acciones {
      border: 2px solid var(--ion-color-warning);
      border-radius: 12px;
    }

    .texto-espera {
      color: var(--ion-color-medium);
      font-size: 14px;
      margin: 12px 0;
    }

    .fotos-preview-container {
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 12px;
      margin-top: 16px;

      .fotos-titulo {
        font-weight: 600;
        font-size: 14px;
        margin: 0 0 12px;
        color: var(--ion-text-color);
      }
    }

    .fotos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .foto-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .btn-eliminar {
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 24px;
        color: var(--ion-color-danger);
        background: white;
        border-radius: 50%;
        cursor: pointer;
      }
    }

    .foto-agregar {
      aspect-ratio: 1;
      border: 2px dashed var(--ion-color-medium);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 28px;
      }

      span {
        font-size: 11px;
        margin-top: 2px;
      }

      &:active {
        background: var(--ion-color-light-shade);
      }
    }

    .fotos-acciones {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .fotos-trabajo-section {
      background: var(--ion-color-light);
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;

      .fotos-titulo {
        font-weight: 600;
        font-size: 14px;
        margin: 0 0 12px;
        color: var(--ion-text-color);
      }
    }

    .fotos-subidas-exito {
      color: var(--ion-color-success);
      font-weight: 500;
      font-size: 14px;
    }

    .exito-card {
      text-align: center;
      background: var(--ion-color-success);

      .exito-content {
        padding: 24px 16px;

        ion-icon {
          font-size: 64px;
          color: white;
        }

        h3 {
          margin: 16px 0 8px;
          color: white;
          font-weight: 600;
        }

        p {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0;
        }
      }
    }

    .resena-card {
      margin: 16px;
      border-radius: 12px;

      .resena-prompt {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        > ion-icon {
          font-size: 32px;
        }

        .resena-texto {
          h4 {
            margin: 0 0 4px;
            font-size: 16px;
            font-weight: 600;
          }

          p {
            margin: 0;
            font-size: 13px;
            color: var(--ion-color-medium);
          }
        }
      }

      ion-button {
        --border-radius: 8px;
        width: 100%;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonButton, IonIcon, IonSpinner, IonAvatar, IonChip, IonLabel,
    IonBadge, IonFab, IonFabButton, IonList, IonItem, IonNote,
    NgFor, NgIf, DatePipe, DecimalPipe, CurrencyPipe
  ]
})
export class DetalleTrabajoPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trabajosServicio = inject(TrabajosServicio);
  private authServicio = inject(AuthServicio);
  private socketServicio = inject(SocketServicio);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  trabajo: Trabajo | null = null;
  cargando = true;
  esCliente = false;
  esTecnico = false;
  trabajoId = '';

  // Para preview de fotos
  fotosPreview: string[] = [];
  archivosSeleccionados: File[] = [];
  mostrandoPreviewFotos = false;
  fotosCargadas = false;

  private subscriptions: Subscription[] = [];

  private ordenEstados = ['programado', 'en_camino', 'en_progreso', 'completado'];

  constructor() {
    addIcons({
      locationOutline, calendarOutline, timeOutline, personOutline,
      callOutline, chatbubbleOutline, starOutline, star, flashOutline,
      checkmarkCircleOutline, carOutline, constructOutline, shieldCheckmarkOutline,
      cashOutline, warningOutline, thumbsUpOutline, thumbsDownOutline,
      cameraOutline, navigateOutline, closeCircle, addOutline, cloudUploadOutline
    });
  }

  ngOnInit(): void {
    this.trabajoId = this.route.snapshot.paramMap.get('id') || '';
    this.esCliente = this.authServicio.esCliente();
    this.esTecnico = this.authServicio.esTecnico();

    this.cargarTrabajo();
    this.escucharActualizaciones();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  cargarTrabajo(): void {
    this.cargando = true;
    this.trabajosServicio.obtenerTrabajo(this.trabajoId).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res.datos) {
          // El backend devuelve { trabajo, chat } dentro de datos
          this.trabajo = res.datos.trabajo || res.datos as Trabajo;
        }
      },
      error: async () => {
        this.cargando = false;
        const toast = await this.toastController.create({
          message: 'Error al cargar el trabajo',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  escucharActualizaciones(): void {
    // Escuchar notificaciones de estado actualizado
    const sub = this.socketServicio.notificacion$.subscribe(notificacion => {
      // Verificar que el tipo es correcto y el trabajo coincide
      const tiposEstado = ['estado_actualizado', 'trabajo_estado_actualizado'];
      const idTrabajoNotif = notificacion.datos?.idTrabajo || notificacion.datos?.trabajoId;

      if (tiposEstado.includes(notificacion.tipo) && idTrabajoNotif === this.trabajoId) {
        console.log('🔄 Actualización de estado recibida:', notificacion.datos);
        // Actualizar estado local inmediatamente
        const nuevoEstado = notificacion.datos?.nuevoEstado || notificacion.datos?.estadoNuevo;
        if (this.trabajo && nuevoEstado) {
          this.trabajo.estado = nuevoEstado;
        }
        // Recargar datos completos
        this.cargarTrabajo();
      }
    });
    this.subscriptions.push(sub);
  }

  estaEnEstado(estado: string): boolean {
    return this.trabajo?.estado === estado;
  }

  estadoPasado(estado: string): boolean {
    if (!this.trabajo) return false;
    const indexActual = this.ordenEstados.indexOf(this.trabajo.estado);
    const indexEstado = this.ordenEstados.indexOf(estado);
    return indexActual > indexEstado;
  }

  async cambiarEstado(nuevoEstado: string): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Actualizando estado...'
    });
    await loading.present();

    this.trabajosServicio.actualizarEstado(this.trabajoId, nuevoEstado as any).subscribe({
      next: async (res) => {
        await loading.dismiss();
        if (this.trabajo) {
          this.trabajo.estado = nuevoEstado as any;
        }
        const toast = await this.toastController.create({
          message: this.obtenerMensajeEstado(nuevoEstado),
          duration: 3000,
          color: 'success'
        });
        await toast.present();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.mensaje || 'Error al actualizar estado',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  obtenerMensajeEstado(estado: string): string {
    const mensajes: Record<string, string> = {
      'en_camino': '🚗 ¡En camino! El cliente ha sido notificado',
      'en_progreso': '🔧 Trabajo iniciado',
      'completado': '✅ Trabajo marcado como completado'
    };
    return mensajes[estado] || 'Estado actualizado';
  }

  async aprobarTrabajo(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Aprobar Trabajo',
      message: '¿Estás satisfecho con el servicio? El pago será liberado al técnico.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aprobar',
          handler: async () => {
            await this.procesarAprobacion();
          }
        }
      ]
    });
    await alert.present();
  }

  private async procesarAprobacion(): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Liberando pago...'
    });
    await loading.present();

    this.trabajosServicio.aprobarTrabajo(this.trabajoId).subscribe({
      next: async (res) => {
        await loading.dismiss();

        if (this.trabajo?.pago) {
          this.trabajo.pago.estado = 'liberado' as any;
        }

        const puntosGanados = res.datos?.puntosGanados || 0;

        const alert = await this.alertController.create({
          header: '🎉 ¡Trabajo Aprobado!',
          message: puntosGanados > 0
            ? `El pago ha sido liberado al técnico. 🎁 ¡Has ganado ${puntosGanados} puntos de fidelidad! ¿Te gustaría dejar una reseña?`
            : 'El pago ha sido liberado al técnico. ¿Te gustaría dejar una reseña?',
          buttons: [
            {
              text: 'Más tarde',
              role: 'cancel'
            },
            {
              text: 'Dejar Reseña',
              handler: () => {
                this.dejarResena();
              }
            }
          ]
        });
        await alert.present();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.mensaje || 'Error al aprobar trabajo',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  async reportarProblema(): Promise<void> {
    // Usar el flujo de disputa mejorado
    await this.iniciarDisputa();
  }

  dejarResena(): void {
    this.router.navigate(['/nueva-resena', this.trabajoId]);
  }

  dejarResenaAlCliente(): void {
    // Navegar a nueva-resena pero indicando que es reseña al cliente
    this.router.navigate(['/nueva-resena', this.trabajoId], {
      queryParams: { tipo: 'cliente' }
    });
  }

  async subirFotos(): Promise<void> {
    const alert = await this.alertController.create({
      header: '📷 Subir Fotos del Trabajo',
      message: 'Asegúrate de subir fotos del trabajo realizado como evidencia en caso de disputa.',
      cssClass: 'alert-subir-fotos',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Seleccionar Fotos',
          handler: () => {
            this.seleccionarArchivos();
          }
        }
      ]
    });
    await alert.present();
  }

  private seleccionarArchivos(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (event: any) => {
      const archivos = event.target.files;
      if (archivos && archivos.length > 0) {
        this.agregarFotosAlPreview(archivos);
      }
    };
    input.click();
  }

  private agregarFotosAlPreview(archivos: FileList): void {
    const espacioDisponible = 5 - this.fotosPreview.length;
    const cantidadAAgregar = Math.min(archivos.length, espacioDisponible);

    for (let i = 0; i < cantidadAAgregar; i++) {
      const archivo = archivos[i];
      this.archivosSeleccionados.push(archivo);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotosPreview.push(e.target.result);
      };
      reader.readAsDataURL(archivo);
    }

    this.mostrandoPreviewFotos = true;

    if (archivos.length > espacioDisponible) {
      this.toastController.create({
        message: `Solo se pueden subir máximo 5 fotos`,
        duration: 2000,
        color: 'warning'
      }).then(toast => toast.present());
    }
  }

  agregarMasFotos(): void {
    this.seleccionarArchivos();
  }

  agregarFotoDirecta(): void {
    this.seleccionarArchivos();
  }

  eliminarFoto(index: number): void {
    this.fotosPreview.splice(index, 1);
    this.archivosSeleccionados.splice(index, 1);

    if (this.fotosPreview.length === 0) {
      this.mostrandoPreviewFotos = false;
    }
  }

  cancelarFotos(): void {
    this.fotosPreview = [];
    this.archivosSeleccionados = [];
    this.mostrandoPreviewFotos = false;
  }

  async confirmarSubidaFotos(): Promise<void> {
    if (this.archivosSeleccionados.length === 0) {
      const toast = await this.toastController.create({
        message: 'No hay fotos seleccionadas',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Subiendo fotos...',
      spinner: 'crescent'
    });
    await loading.present();

    const formData = new FormData();
    for (const archivo of this.archivosSeleccionados) {
      formData.append('fotos', archivo);
    }

    this.trabajosServicio.subirFotosDespues(this.trabajoId, formData).subscribe({
      next: async () => {
        await loading.dismiss();
        const cantidadSubida = this.archivosSeleccionados.length;
        this.fotosCargadas = true;
        this.fotosPreview = [];
        this.archivosSeleccionados = [];
        this.mostrandoPreviewFotos = false;
        const toast = await this.toastController.create({
          message: `✅ ${cantidadSubida} foto(s) subida(s) exitosamente`,
          duration: 3000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
        // Recargar trabajo para mostrar las nuevas fotos
        this.cargarTrabajo();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.mensaje || 'Error al subir fotos',
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    });
  }

  async iniciarDisputa(): Promise<void> {
    const alert = await this.alertController.create({
      header: '⚠️ Iniciar Disputa',
      message: 'Una disputa será revisada por nuestro equipo de soporte. Describe el problema claramente.',
      inputs: [
        {
          name: 'tipo',
          type: 'radio',
          label: '🔧 Calidad del trabajo',
          value: 'calidad',
          checked: true
        },
        {
          name: 'tipo',
          type: 'radio',
          label: '⏱️ Problema de tiempo',
          value: 'tiempo'
        },
        {
          name: 'tipo',
          type: 'radio',
          label: '💰 Problema de precio',
          value: 'precio'
        },
        {
          name: 'tipo',
          type: 'radio',
          label: '👤 Comportamiento',
          value: 'comportamiento'
        },
        {
          name: 'tipo',
          type: 'radio',
          label: '📋 Otro',
          value: 'otro'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Siguiente',
          handler: (tipo) => {
            this.mostrarFormularioDisputa(tipo);
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarFormularioDisputa(tipo: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Describe el problema',
      inputs: [
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Explica detalladamente el problema...',
          attributes: {
            rows: 4
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar Disputa',
          handler: async (data) => {
            if (!data.motivo || data.motivo.trim().length < 10) {
              const toast = await this.toastController.create({
                message: 'Por favor describe el problema con más detalle',
                duration: 2000,
                color: 'warning'
              });
              await toast.present();
              return false;
            }
            this.enviarDisputa(tipo, data.motivo);
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  private async enviarDisputa(tipo: string, motivo: string): Promise<void> {
    const loading = await this.loadingController.create({
      message: 'Enviando disputa...'
    });
    await loading.present();

    this.trabajosServicio.crearDisputa(this.trabajoId, { tipo, motivo }).subscribe({
      next: async () => {
        await loading.dismiss();
        const alert = await this.alertController.create({
          header: '✅ Disputa Enviada',
          message: 'Tu disputa ha sido registrada. Nuestro equipo de soporte la revisará en las próximas 24-48 horas y te contactarán para resolver el problema.\n\nMientras tanto, el pago quedará retenido hasta que se resuelva la situación.',
          buttons: ['Entendido']
        });
        await alert.present();
        this.cargarTrabajo();
      },
      error: async (err) => {
        await loading.dismiss();
        const toast = await this.toastController.create({
          message: err.error?.mensaje || 'Error al enviar disputa',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }
    });
  }

  llamar(telefono: string | undefined, event: Event): void {
    event.stopPropagation();
    if (telefono) {
      window.location.href = `tel:${telefono}`;
    }
  }

  abrirChat(event: Event): void {
    event.stopPropagation();
    // Determinar el ID del receptor según el rol del usuario
    // Si soy cliente, el receptor es el técnico; si soy técnico, el receptor es el cliente
    let receptorId = '';
    if (this.esCliente && this.trabajo?.idTecnico) {
      receptorId = (this.trabajo.idTecnico as any)._id || this.trabajo.idTecnico;
    } else if (this.esTecnico && this.trabajo?.idCliente) {
      receptorId = (this.trabajo.idCliente as any)._id || this.trabajo.idCliente;
    }

    if (receptorId) {
      this.router.navigate(['/chat', receptorId], {
        queryParams: { trabajoId: this.trabajoId }
      });
    }
  }

  verPerfil(tecnicoId: string): void {
    this.router.navigate(['/perfil-tecnico', tecnicoId]);
  }

  obtenerEtiquetaTipo(tipo: string | undefined): string {
    if (!tipo) return 'Servicio';
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  obtenerColorPago(estado: string | undefined): string {
    const colores: Record<string, string> = {
      'pendiente': 'warning',
      'retenido': 'tertiary',
      'liberado': 'success',
      'reembolsado': 'medium',
      'parcial': 'warning'
    };
    return colores[estado || ''] || 'medium';
  }

  obtenerEtiquetaPago(estado: string | undefined): string {
    const etiquetas: Record<string, string> = {
      'pendiente': 'Pendiente',
      'retenido': 'Retenido (Garantía)',
      'liberado': 'Liberado',
      'reembolsado': 'Reembolsado',
      'parcial': 'Parcialmente liberado'
    };
    return etiquetas[estado || ''] || estado || 'Pendiente';
  }
}
