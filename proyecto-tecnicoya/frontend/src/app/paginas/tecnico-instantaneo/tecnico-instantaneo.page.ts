import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonButton,
  IonSpinner, IonAvatar, IonChip, IonLabel, IonBadge, IonProgressBar,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flashOutline, locationOutline, starOutline, star,
  shieldCheckmarkOutline, callOutline, chatbubbleOutline,
  closeCircle, checkmarkCircle, timeOutline, sadOutline
} from 'ionicons/icons';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { GeolocalizacionServicio } from '../../servicios/geolocalizacion.servicio';
import { SocketServicio } from '../../servicios/socket.servicio';
import { Usuario, TIPOS_SERVICIO, TipoServicio } from '../../modelos';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-tecnico-instantaneo',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Técnico Instantáneo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @switch (estado) {
        @case ('seleccion') {
          <!-- Selección de tipo de servicio -->
          <div class="seleccion-container">
            <div class="header-info">
              <ion-icon name="flash-outline" class="icono-principal"></ion-icon>
              <h2>¿Qué tipo de técnico necesitas?</h2>
              <p>Conectaremos con el técnico más cercano disponible</p>
            </div>

            <div class="tipos-grid">
              @for (tipo of tiposServicio; track tipo.valor) {
                <div 
                  class="tipo-card" 
                  [class.seleccionado]="tipoSeleccionado === tipo.valor"
                  (click)="seleccionarTipo(tipo.valor)"
                >
                  <span class="emoji">{{ tipo.icono }}</span>
                  <span class="nombre">{{ tipo.etiqueta }}</span>
                </div>
              }
            </div>

            @if (tipoSeleccionado) {
              <div class="ion-padding">
                <ion-button expand="block" (click)="iniciarBusqueda()">
                  <ion-icon name="flash-outline" slot="start"></ion-icon>
                  Buscar Técnico Ahora
                </ion-button>
              </div>
            }
          </div>
        }

        @case ('buscando') {
          <!-- Buscando técnico -->
          <div class="buscando-container">
            <div class="animacion-busqueda">
              <div class="pulso"></div>
              <ion-icon name="flash-outline"></ion-icon>
            </div>
            
            <h2>Buscando técnico cercano...</h2>
            <p>Esto puede tomar unos segundos</p>
            
            <div class="progreso-busqueda">
              <ion-progress-bar type="indeterminate"></ion-progress-bar>
              <span class="tiempo">{{ tiempoTranscurrido }}s</span>
            </div>

            <p class="info-busqueda">
              Estamos contactando técnicos de 
              <strong>{{ obtenerEtiquetaTipo(tipoSeleccionado!) }}</strong> 
              en un radio de 15 km
            </p>

            <ion-button fill="outline" color="danger" (click)="cancelarBusqueda()">
              <ion-icon name="close-circle" slot="start"></ion-icon>
              Cancelar
            </ion-button>
          </div>
        }

        @case ('encontrado') {
          <!-- Técnico encontrado -->
          @if (tecnicoEncontrado) {
            <div class="encontrado-container">
              <div class="exito-header">
                <ion-icon name="checkmark-circle" color="success"></ion-icon>
                <h2>¡Técnico encontrado!</h2>
              </div>

              <ion-card class="tarjeta-tecnico">
                <ion-card-content>
                  <div class="tecnico-header">
                    <ion-avatar>
                      <img [src]="tecnicoEncontrado.perfil?.fotoUrl || tecnicoEncontrado.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt=""/>
                    </ion-avatar>
                    <div class="tecnico-info">
                      <div class="nombre-row">
                        <h3>{{ tecnicoEncontrado.nombre }} {{ tecnicoEncontrado.apellido }}</h3>
                        @if (tecnicoEncontrado.datosTecnico?.verificado) {
                          <span class="badge-tecnico-verificado">
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                            Verificado
                          </span>
                        }
                      </div>
                      <div class="calificacion">
                        <ion-icon name="star" color="warning"></ion-icon>
                        <span>{{ tecnicoEncontrado.datosTecnico?.calificacionPromedio | number:'1.1-1' }}</span>
                        <span class="trabajos">({{ tecnicoEncontrado.datosTecnico?.trabajosCompletados }} trabajos)</span>
                      </div>
                    </div>
                  </div>

                  <div class="distancia-info">
                    <ion-icon name="location-outline"></ion-icon>
                    <span>A {{ distanciaTecnico | number:'1.1-1' }} km de ti</span>
                    <span class="tiempo-llegada">~{{ tiempoLlegadaEstimado }} min</span>
                  </div>

                  <div class="acciones-tecnico">
                    <ion-button expand="block" (click)="confirmarTecnico()">
                      <ion-icon name="checkmark-circle" slot="start"></ion-icon>
                      Confirmar Técnico
                    </ion-button>
                    <ion-button expand="block" fill="outline" (click)="buscarOtro()">
                      Buscar Otro
                    </ion-button>
                  </div>

                  <div class="contacto-rapido">
                    <ion-button fill="clear" (click)="llamar()">
                      <ion-icon name="call-outline"></ion-icon>
                    </ion-button>
                    <ion-button fill="clear" (click)="enviarMensaje()">
                      <ion-icon name="chatbubble-outline"></ion-icon>
                    </ion-button>
                  </div>
                </ion-card-content>
              </ion-card>

              <div class="nota-precio">
                <ion-icon name="information-circle-outline"></ion-icon>
                <p style="color: black;">El técnico te dará un presupuesto al llegar después de evaluar el problema</p>
              </div>
            </div>
          }
        }

        @case ('no-encontrado') {
          <!-- No se encontró técnico -->
          <div class="no-encontrado-container">
            <ion-icon name="sad-outline" color="medium"></ion-icon>
            <h2>No hay técnicos disponibles</h2>
            <p>No encontramos técnicos de {{ obtenerEtiquetaTipo(tipoSeleccionado!) }} cerca de ti en este momento</p>
            
            <ion-button expand="block" (click)="reiniciar()">
              Intentar de nuevo
            </ion-button>
            <ion-button expand="block" fill="outline" (click)="irANuevoServicio()">
              Crear solicitud normal
            </ion-button>
          </div>
        }

        @case ('confirmado') {
          <!-- Técnico confirmado -->
          <div class="confirmado-container">
            <div class="exito-animacion">
              <ion-icon name="checkmark-circle" color="success"></ion-icon>
            </div>
            <h2>¡Técnico en camino!</h2>
            <p>{{ tecnicoEncontrado?.nombre }} está en camino hacia tu ubicación</p>
            
            <div class="tiempo-estimado">
              <ion-icon name="time-outline"></ion-icon>
              <span>Tiempo estimado: <strong>{{ tiempoLlegadaEstimado }} min</strong></span>
            </div>

            <ion-button expand="block" routerLink="/tabs/trabajos">
              Ver mis trabajos
            </ion-button>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [`
    .seleccion-container {
      padding: 16px;
    }

    .header-info {
      text-align: center;
      padding: 24px 0;

      .icono-principal {
        font-size: 64px;
        color: var(--ion-color-warning);
      }

      h2 {
        margin: 16px 0 8px;
        font-size: 22px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .tipos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .tipo-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
      background: var(--ion-color-light);
      border-radius: 12px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 0.2s;

      &.seleccionado {
        border-color: var(--ion-color-primary);
        background: var(--ion-color-primary-tint);
      }

      .emoji {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .nombre {
        font-size: 12px;
        text-align: center;
        font-weight: 500;
        color: #333333;
      }
    }

    .buscando-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 70vh;

      .animacion-busqueda {
        position: relative;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;

        .pulso {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--ion-color-primary);
          opacity: 0.3;
          animation: pulsar 2s ease-out infinite;
        }

        ion-icon {
          font-size: 48px;
          color: var(--ion-color-primary);
          z-index: 1;
        }
      }

      h2 {
        margin: 0 0 8px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0 0 24px;
      }

      .progreso-busqueda {
        width: 100%;
        max-width: 300px;
        margin-bottom: 24px;

        .tiempo {
          font-size: 14px;
          color: var(--ion-color-medium);
        }
      }

      .info-busqueda {
        font-size: 14px;
        margin-bottom: 32px;
      }
    }

    @keyframes pulsar {
      0% { transform: scale(0.8); opacity: 0.5; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    .encontrado-container {
      padding: 24px 16px;

      .exito-header {
        text-align: center;
        margin-bottom: 24px;

        ion-icon {
          font-size: 64px;
        }

        h2 {
          margin: 16px 0 0;
        }
      }
    }

    .tarjeta-tecnico {
      border-radius: 16px;

      .tecnico-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 16px;

        ion-avatar {
          width: 72px;
          height: 72px;
        }

        .tecnico-info {
          flex: 1;

          h3 {
            margin: 0 0 4px;
            font-size: 18px;
            font-weight: 600;
          }

          .calificacion {
            display: flex;
            align-items: center;
            gap: 4px;
            margin-bottom: 8px;

            ion-icon {
              font-size: 18px;
            }

            .trabajos {
              color: var(--ion-color-medium);
            }
          }

          .chip-verificado {
            height: 24px;
            font-size: 11px;
          }
        }
      }

      .distancia-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--ion-color-light);
        border-radius: 8px;
        margin-bottom: 16px;

        ion-icon {
          font-size: 20px;
          color: var(--ion-color-primary);
        }

        .tiempo-llegada {
          margin-left: auto;
          font-weight: 600;
          color: var(--ion-color-primary);
        }
      }

      .acciones-tecnico {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .contacto-rapido {
        display: flex;
        justify-content: center;
        gap: 16px;

        ion-icon {
          font-size: 24px;
        }
      }
    }

    .nota-precio {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 16px;
      background: var(--ion-color-warning-tint);
      border-radius: 12px;
      margin-top: 16px;

      ion-icon {
        font-size: 24px;
        color: var(--ion-color-warning-shade);
      }

      p {
        margin: 0;
        font-size: 13px;
        color: var(--ion-color-warning-shade);
      }
    }

    .no-encontrado-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 60vh;

      ion-icon {
        font-size: 80px;
        margin-bottom: 24px;
      }

      h2 {
        margin: 0 0 12px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0 0 32px;
      }

      ion-button {
        margin-bottom: 12px;
        width: 100%;
        max-width: 300px;
      }
    }

    .confirmado-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      min-height: 60vh;

      .exito-animacion ion-icon {
        font-size: 100px;
        animation: bounce 0.5s ease;
      }

      h2 {
        margin: 24px 0 8px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0 0 24px;
      }

      .tiempo-estimado {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 24px;
        background: var(--ion-color-primary-tint);
        border-radius: 12px;
        margin-bottom: 32px;

        ion-icon {
          font-size: 24px;
          color: var(--ion-color-primary);
        }
      }
    }

    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonButton,
    IonSpinner, IonAvatar, IonChip, IonLabel, IonBadge, IonProgressBar,
    NgFor, NgIf, DecimalPipe, FormsModule
  ],
})
export class TecnicoInstantaneoPage implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private serviciosServicio = inject(ServiciosServicio);
  private geoServicio = inject(GeolocalizacionServicio);
  private socketServicio = inject(SocketServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  tiposServicio = TIPOS_SERVICIO.map(t => ({
    ...t,
    icono: this.obtenerIcono(t.valor)
  }));

  estado: 'seleccion' | 'buscando' | 'encontrado' | 'no-encontrado' | 'confirmado' = 'seleccion';
  tipoSeleccionado: TipoServicio | null = null;
  tecnicoEncontrado: Usuario | null = null;
  distanciaTecnico = 0;
  tiempoLlegadaEstimado = 0;
  tiempoTranscurrido = 0;

  private timerSubscription?: Subscription;
  private busquedaSubscription?: Subscription;

  constructor() {
    addIcons({
      flashOutline, locationOutline, starOutline, star,
      shieldCheckmarkOutline, callOutline, chatbubbleOutline,
      closeCircle, checkmarkCircle, timeOutline, sadOutline
    });
  }

  ngOnInit(): void {
    // Verificar si viene un tipo preseleccionado desde la página de inicio
    this.route.queryParams.subscribe(params => {
      if (params['tipo']) {
        const tipoValido = TIPOS_SERVICIO.find(t => t.valor === params['tipo']);
        if (tipoValido) {
          this.tipoSeleccionado = params['tipo'] as TipoServicio;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
    this.busquedaSubscription?.unsubscribe();
  }

  obtenerIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      'plomeria': '🔧',
      'electricidad': '⚡',
      'cerrajeria': '🔑',
      'aire_acondicionado': '❄️',
      'refrigeracion': '🧊',
      'carpinteria': '🔨',
      'pintura': '🎨',
      'limpieza': '🧹',
      'jardineria': '🌱',
      'electrodomesticos': '📺',
      'mudanzas': '📦',
      'albanileria': '🧱',
      'herreria': '⚙️',
      'computadoras': '💻',
      'otro': '🛠️'
    };
    return iconos[tipo] || '🛠️';
  }

  seleccionarTipo(tipo: TipoServicio): void {
    this.tipoSeleccionado = tipo;
  }

  async iniciarBusqueda(): Promise<void> {
    if (!this.tipoSeleccionado) return;

    this.estado = 'buscando';
    this.tiempoTranscurrido = 0;

    // Iniciar contador
    this.timerSubscription = interval(1000).subscribe(() => {
      this.tiempoTranscurrido++;

      // Timeout después de 60 segundos
      if (this.tiempoTranscurrido >= 60) {
        this.estado = 'no-encontrado';
        this.timerSubscription?.unsubscribe();
      }
    });

    // Obtener ubicación actual
    const posicion = await this.geoServicio.obtenerPosicionActual();

    if (!posicion) {
      this.mostrarToast('No pudimos obtener tu ubicación', 'danger');
      this.estado = 'seleccion';
      return;
    }

    // Buscar técnico instantáneo
    this.serviciosServicio.buscarTecnicoInstantaneo(
      this.tipoSeleccionado,
      posicion.coords.latitude,
      posicion.coords.longitude
    ).subscribe({
      next: (res) => {
        this.timerSubscription?.unsubscribe();

        if (res.datos?.tecnico) {
          this.tecnicoEncontrado = res.datos.tecnico;
          this.distanciaTecnico = res.datos.distancia || 0;
          this.tiempoLlegadaEstimado = Math.round(this.distanciaTecnico * 3); // Aprox 3 min por km
          this.estado = 'encontrado';
        } else {
          this.estado = 'no-encontrado';
        }
      },
      error: () => {
        this.timerSubscription?.unsubscribe();
        this.estado = 'no-encontrado';
      }
    });
  }

  cancelarBusqueda(): void {
    this.timerSubscription?.unsubscribe();
    this.estado = 'seleccion';
  }

  buscarOtro(): void {
    this.tecnicoEncontrado = null;
    this.iniciarBusqueda();
  }

  async confirmarTecnico(): Promise<void> {
    if (!this.tecnicoEncontrado || !this.tipoSeleccionado) return;

    // Crear servicio instantáneo
    const posicion = await this.geoServicio.obtenerPosicionActual();

    const datos = {
      tipoServicio: this.tipoSeleccionado,
      titulo: `Servicio urgente de ${this.obtenerEtiquetaTipo(this.tipoSeleccionado)}`,
      descripcion: 'Servicio solicitado mediante Técnico Instantáneo',
      urgencia: 'emergencia',
      tecnicoAsignado: this.tecnicoEncontrado._id,
      ubicacion: {
        coordenadas: posicion ? {
          type: 'Point',
          coordinates: [posicion.coords.longitude, posicion.coords.latitude]
        } : undefined
      }
    };

    this.serviciosServicio.crearServicioInstantaneo(datos).subscribe({
      next: () => {
        this.estado = 'confirmado';
      },
      error: () => {
        this.mostrarToast('Error al confirmar técnico', 'danger');
      }
    });
  }

  llamar(): void {
    if (this.tecnicoEncontrado?.telefono) {
      window.location.href = `tel:${this.tecnicoEncontrado.telefono}`;
    }
  }

  enviarMensaje(): void {
    if (this.tecnicoEncontrado) {
      this.router.navigate(['/chat', this.tecnicoEncontrado._id]);
    }
  }

  reiniciar(): void {
    this.estado = 'seleccion';
    this.tipoSeleccionado = null;
    this.tecnicoEncontrado = null;
  }

  irANuevoServicio(): void {
    this.router.navigate(['/nuevo-servicio']);
  }

  obtenerEtiquetaTipo(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
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
