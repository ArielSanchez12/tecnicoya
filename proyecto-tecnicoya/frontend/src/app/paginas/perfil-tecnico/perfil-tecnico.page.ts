import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonAvatar,
  IonIcon, IonButton, IonChip, IonLabel, IonBadge, IonList, IonItem,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  starOutline, star, locationOutline, chatbubbleOutline,
  shieldCheckmarkOutline, timeOutline, briefcaseOutline, flashOutline,
  ribbonOutline, checkmarkCircle
} from 'ionicons/icons';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { ResenasServicio } from '../../servicios/resenas.servicio';
import { Usuario, Resena, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-perfil-tecnico',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/buscar"></ion-back-button>
        </ion-buttons>
        <ion-title>Perfil del Técnico</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
        </div>
      } @else if (tecnico) {
        <!-- Cabecera del perfil -->
        <div class="perfil-header">
          <ion-avatar>
            <img [src]="tecnico.perfil?.fotoUrl || tecnico.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt="Foto"/>
          </ion-avatar>
          <div class="nombre-row">
            <h2>{{ obtenerNombreTecnico() }}</h2>
            @if (esTecnicoVerificado(tecnico)) {
              <span class="badge-tecnico-verificado">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                Técnico verificado
              </span>
            }
          </div>
          <div class="badges">
            @if (tecnico.datosTecnico?.emergencia24h) {
              <ion-chip color="danger">
                <ion-icon name="flash-outline"></ion-icon>
                <ion-label>24/7</ion-label>
              </ion-chip>
            }
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="estadisticas-container">
          <div class="stat-card">
            <div class="stat-value">
              <ion-icon name="star" color="warning"></ion-icon>
              {{ obtenerCalificacion() | number:'1.1-1' }}
            </div>
            <div class="stat-label">Calificación</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ tecnico.datosTecnico?.trabajosCompletados || 0 }}</div>
            <div class="stat-label">Trabajos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ tecnico.datosTecnico?.totalResenas || 0 }}</div>
            <div class="stat-label">Reseñas</div>
          </div>
        </div>

        <!-- Botón de contacto (solo chat) -->
        <div class="botones-contacto ion-padding">
          <ion-button expand="block" (click)="enviarMensaje()">
            <ion-icon name="chatbubble-outline" slot="start"></ion-icon>
            Enviar Mensaje
          </ion-button>
        </div>

        <!-- Especialidades -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Especialidades</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="especialidades">
              @for (esp of tecnico.datosTecnico?.especialidades; track esp) {
                <ion-chip>
                  <ion-label>{{ obtenerEtiquetaEspecialidad(esp) }}</ion-label>
                </ion-chip>
              }
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Descripción -->
        @if (tecnico.datosTecnico?.descripcion) {
          <ion-card>
            <ion-card-header>
              <ion-card-title>Acerca de</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ tecnico.datosTecnico?.descripcion }}</p>
            </ion-card-content>
          </ion-card>
        }

        <!-- Información adicional -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Información</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-icon name="location-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <p>Radio de trabajo</p>
                  <h3>{{ obtenerRadioTrabajo() }} km</h3>
                </ion-label>
              </ion-item>
              <ion-item>
                <ion-icon name="time-outline" slot="start" color="primary"></ion-icon>
                <ion-label>
                  <p>Disponibilidad</p>
                  <h3>{{ tecnico.datosTecnico?.disponibleAhora ? 'Disponible ahora' : 'No disponible' }}</h3>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Reseñas -->
        <ion-card>
          <ion-card-header>
            <div class="resenas-header">
              <ion-card-title>
                Reseñas ({{ resenas.length }})
              </ion-card-title>
              @if (resenas.length > 3) {
                <ion-button fill="clear" size="small" (click)="verTodasResenas()">
                  Ver todas
                </ion-button>
              }
            </div>
          </ion-card-header>
          <ion-card-content>
            @if (resenas.length === 0) {
              <p class="sin-resenas">Este técnico aún no tiene reseñas</p>
            } @else {
              @for (resena of resenas.slice(0, 3); track resena._id) {
                <div class="resena-item">
                  <div class="resena-header">
                    <ion-avatar>
                      <img [src]="obtenerFotoResenador(resena)" alt=""/>
                    </ion-avatar>
                    <div class="resena-autor">
                      <span class="nombre">{{ obtenerNombreResenador(resena) }}</span>
                      <span class="fecha">{{ resena.fechaCreacion | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="resena-calificacion">
                      @for (i of [1, 2, 3, 4, 5]; track i) {
                        <ion-icon 
                          [name]="i <= resena.calificacion ? 'star' : 'star-outline'"
                          [color]="i <= resena.calificacion ? 'warning' : 'medium'"
                        ></ion-icon>
                      }
                    </div>
                  </div>
                  <p class="resena-comentario">{{ resena.comentario }}</p>
                  @if (resena.respuesta?.contenido) {
                    <div class="respuesta-tecnico">
                      <strong>Respuesta del técnico:</strong>
                      <p>{{ resena.respuesta.contenido }}</p>
                    </div>
                  }
                </div>
              }
            }
          </ion-card-content>
        </ion-card>

        <!-- Botón solicitar servicio -->
        <div class="ion-padding">
          <ion-button expand="block" size="large" (click)="solicitarServicio()">
            Solicitar Servicio
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

    .perfil-header {
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
      color: white;
      padding: 32px 16px;
      text-align: center;

      ion-avatar {
        width: 100px;
        height: 100px;
        margin: 0 auto 16px;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .nombre-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 12px;
      }

      h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }

      .badge-verificado {
        font-size: 11px;
        padding: 4px 8px;
        --background: #4caf50;
        --color: white;
      }

      .badges {
        display: flex;
        justify-content: center;
        gap: 8px;
      }
    }

    .estadisticas-container {
      display: flex;
      justify-content: space-around;
      padding: 20px 16px;
      background: white;
      margin-top: -20px;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);

      .stat-card {
        text-align: center;

        .stat-value {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 24px;
          font-weight: 700;
          color: var(--ion-color-primary);

          ion-icon {
            font-size: 20px;
          }
        }

        .stat-label {
          font-size: 12px;
          color: var(--ion-color-medium);
          margin-top: 4px;
        }
      }
    }

    .botones-contacto {
      display: flex;
      gap: 12px;

      ion-button {
        flex: 1;
      }
    }

    ion-card {
      margin: 16px;
      border-radius: 12px;
    }

    .especialidades {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .resenas-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sin-resenas {
      text-align: center;
      color: var(--ion-color-medium);
      padding: 16px;
    }

    .resena-item {
      padding: 16px 0;
      border-bottom: 1px solid var(--ion-color-light);

      &:last-child {
        border-bottom: none;
      }
    }

    .resena-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      ion-avatar {
        width: 40px;
        height: 40px;
      }

      .resena-autor {
        flex: 1;

        .nombre {
          display: block;
          font-weight: 600;
          font-size: 14px;
        }

        .fecha {
          font-size: 12px;
          color: var(--ion-color-medium);
        }
      }

      .resena-calificacion {
        ion-icon {
          font-size: 14px;
        }
      }
    }

    .resena-comentario {
      color: var(--ion-color-medium);
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    .respuesta-tecnico {
      margin-top: 12px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
      font-size: 13px;

      strong {
        display: block;
        margin-bottom: 4px;
      }

      p {
        margin: 0;
        color: var(--ion-color-medium);
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonAvatar,
    IonIcon, IonButton, IonChip, IonLabel, IonBadge, IonList, IonItem,
    IonSpinner,
    NgFor, NgIf, DecimalPipe, DatePipe
  ],
})
export class PerfilTecnicoPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usuariosServicio = inject(UsuariosServicio);
  private resenasServicio = inject(ResenasServicio);

  tecnico: any = null; // Usar any para flexibilidad con la estructura del backend
  resenas: any[] = []; // Array de reseñas
  estadisticasResenas: any = null;
  cargando = false;

  constructor() {
    addIcons({
      starOutline, star, locationOutline, chatbubbleOutline,
      shieldCheckmarkOutline, timeOutline, briefcaseOutline, flashOutline,
      ribbonOutline, checkmarkCircle
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarTecnico(id);
      this.cargarResenas(id);
    }
  }

  cargarTecnico(id: string): void {
    this.cargando = true;
    this.usuariosServicio.obtenerPerfil(id).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.datos) {
          this.tecnico = res.datos;
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  cargarResenas(tecnicoId: string): void {
    this.resenasServicio.obtenerResenasTecnico(tecnicoId).subscribe({
      next: (res: any) => {
        // El backend devuelve { datos: { resenas, estadisticas, tecnico } }
        if (res.datos) {
          // Verificar si es un objeto con resenas o directamente un array
          if (Array.isArray(res.datos)) {
            this.resenas = res.datos;
          } else if (res.datos.resenas && Array.isArray(res.datos.resenas)) {
            this.resenas = res.datos.resenas;
            this.estadisticasResenas = res.datos.estadisticas;
          } else {
            this.resenas = [];
          }
        } else {
          this.resenas = [];
        }
      },
      error: () => {
        this.resenas = [];
      }
    });
  }

  obtenerNombreTecnico(): string {
    if (!this.tecnico) return '';
    const nombre = this.tecnico.perfil?.nombre || this.tecnico.nombre || '';
    const apellido = this.tecnico.perfil?.apellido || this.tecnico.apellido || '';
    return `${nombre} ${apellido}`.trim();
  }

  obtenerCalificacion(): number {
    if (!this.tecnico?.datosTecnico) return 0;
    return this.tecnico.datosTecnico.calificacion || 
           this.tecnico.datosTecnico.calificacionPromedio || 
           this.estadisticasResenas?.promedio || 0;
  }

  obtenerRadioTrabajo(): number {
    if (!this.tecnico?.datosTecnico) return 15;
    const radioBase = this.tecnico.datosTecnico.radioTrabajo || 15;
    const radioExtendido = this.tecnico.datosTecnico.membresia?.radioExtendido || 0;
    return radioBase + radioExtendido;
  }

  obtenerFotoResenador(resena: any): string {
    // El backend puede devolver idResenador (populated) o cliente
    const resenador = resena.idResenador || resena.cliente;
    if (resenador?.perfil?.fotoUrl) return resenador.perfil.fotoUrl;
    if (resenador?.perfil?.fotoPerfil) return resenador.perfil.fotoPerfil;
    return 'assets/avatar-default.png';
  }

  obtenerNombreResenador(resena: any): string {
    const resenador = resena.idResenador || resena.cliente;
    if (!resenador) return 'Usuario';
    const nombre = resenador.perfil?.nombre || resenador.nombre || '';
    const apellido = resenador.perfil?.apellido || resenador.apellido || '';
    return `${nombre} ${apellido}`.trim() || 'Usuario';
  }

  enviarMensaje(): void {
    this.router.navigate(['/chat', this.tecnico?._id]);
  }

  solicitarServicio(): void {
    this.router.navigate(['/nuevo-servicio'], {
      queryParams: { tecnicoId: this.tecnico?._id }
    });
  }

  verTodasResenas(): void {
    this.router.navigate(['/resenas-tecnico', this.tecnico?._id]);
  }

  obtenerEtiquetaEspecialidad(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  esTecnicoVerificado(tecnico: any): boolean {
    return tecnico?.datosTecnico?.membresia?.badgeVerificado === true ||
      tecnico?.datosTecnico?.verificado === true;
  }
}
