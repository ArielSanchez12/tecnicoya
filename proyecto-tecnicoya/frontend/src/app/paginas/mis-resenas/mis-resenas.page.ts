/**
 * Página Mis Reseñas
 * TécnicoYa - Frontend
 * Muestra las reseñas recibidas/dadas por el usuario
 */

import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonAvatar,
  IonList, IonItem, IonLabel, IonSpinner, IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton, IonIcon, IonNote, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { starOutline, star, personOutline, timeOutline, chatbubbleOutline } from 'ionicons/icons';
import { AuthServicio } from '../../servicios/auth.servicio';
import { ResenasServicio } from '../../servicios/resenas.servicio';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Resena {
  _id: string;
  calificacion: number;
  comentario: string;
  fechaCreacion: string;
  // Campos que devuelve el backend
  idResenador?: {
    _id: string;
    perfil: {
      nombre: string;
      apellido: string;
      fotoUrl?: string;
    };
  };
  idResenado?: {
    _id: string;
    perfil: {
      nombre: string;
      apellido: string;
      fotoUrl?: string;
    };
  };
  // Campos alternativos por compatibilidad
  cliente?: {
    _id: string;
    perfil: {
      nombre: string;
      apellido: string;
      fotoUrl?: string;
    };
  };
  tecnico?: {
    _id: string;
    perfil: {
      nombre: string;
      apellido: string;
      fotoUrl?: string;
    };
  };
  trabajo?: {
    _id: string;
    servicio?: {
      titulo: string;
      tipo: string;
    };
  };
  infoTrabajo?: {
    tipoServicio?: string;
    monto?: number;
  };
  respuesta?: {
    contenido?: string;
    fecha?: string;
  };
}

@Component({
  selector: 'app-mis-resenas',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Mis Reseñas</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-segment [(ngModel)]="filtro" (ionChange)="cargarResenas()">
        <ion-segment-button value="recibidas">
          <ion-label>Recibidas</ion-label>
        </ion-segment-button>
        <ion-segment-button value="dadas">
          <ion-label>Que he dado</ion-label>
        </ion-segment-button>
      </ion-segment>

      @if (cargando) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando reseñas...</p>
        </div>
      } @else if (resenas.length === 0) {
        <div class="empty-container">
          <ion-icon name="star-outline"></ion-icon>
          <h3>Sin reseñas</h3>
          <p>{{ esTecnico ? 'Aún no has recibido reseñas' : 'Aún no has dado ninguna reseña' }}</p>
        </div>
      } @else {
        <ion-list>
          @for (resena of resenas; track resena._id) {
            <ion-card>
              <ion-card-content>
                <div class="resena-header">
                  <ion-avatar>
                    <img [src]="obtenerFotoUsuario(resena)" alt="Foto"/>
                  </ion-avatar>
                  <div class="resena-info">
                    <h3>{{ obtenerNombreUsuario(resena) }}</h3>
                    <div class="estrellas">
                      @for (i of [1,2,3,4,5]; track i) {
                        <ion-icon 
                          [name]="i <= resena.calificacion ? 'star' : 'star-outline'"
                          [color]="i <= resena.calificacion ? 'warning' : 'medium'"
                        ></ion-icon>
                      }
                    </div>
                    <ion-note>
                      <ion-icon name="time-outline"></ion-icon>
                      {{ resena.fechaCreacion | date:'dd/MM/yyyy' }}
                    </ion-note>
                  </div>
                </div>

                @if (resena.trabajo?.servicio?.titulo || resena.infoTrabajo?.tipoServicio) {
                  <ion-badge color="light" class="servicio-badge">
                    {{ resena.trabajo?.servicio?.titulo || resena.infoTrabajo?.tipoServicio }}
                  </ion-badge>
                }

                <p class="comentario">{{ resena.comentario }}</p>

                @if (resena.respuesta?.contenido) {
                  <div class="respuesta">
                    <ion-icon name="chatbubble-outline"></ion-icon>
                    <div>
                      <strong>Respuesta:</strong>
                      <p>{{ resena.respuesta.contenido }}</p>
                    </div>
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
    .loading-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }

      h3 {
        margin: 8px 0;
        color: var(--ion-text-color);
      }

      p {
        text-align: center;
        padding: 0 32px;
      }
    }

    ion-card {
      margin: 12px 16px;
      border-radius: 12px;
    }

    .resena-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;

      ion-avatar {
        width: 48px;
        height: 48px;
      }

      .resena-info {
        flex: 1;

        h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .estrellas {
          display: flex;
          gap: 2px;
          margin-bottom: 4px;

          ion-icon {
            font-size: 16px;
          }
        }

        ion-note {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;

          ion-icon {
            font-size: 14px;
          }
        }
      }
    }

    .servicio-badge {
      margin-bottom: 8px;
      font-size: 11px;
    }

    .comentario {
      margin: 12px 0;
      line-height: 1.5;
    }

    .respuesta {
      display: flex;
      gap: 8px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-top: 12px;

      ion-icon {
        font-size: 20px;
        color: var(--ion-color-primary);
      }

      p {
        margin: 4px 0 0 0;
        font-size: 14px;
      }
    }

    ion-segment {
      margin: 16px;
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonAvatar,
    IonList, IonItem, IonLabel, IonSpinner, IonRefresher, IonRefresherContent,
    IonSegment, IonSegmentButton, IonIcon, IonNote, IonBadge,
    NgFor, NgIf, DatePipe, FormsModule
  ]
})
export class MisResenasPage implements OnInit {
  private router = inject(Router);
  private authServicio = inject(AuthServicio);
  private resenasServicio = inject(ResenasServicio);

  resenas: Resena[] = [];
  cargando = true;
  filtro: 'recibidas' | 'dadas' = 'recibidas';

  constructor() {
    addIcons({ starOutline, star, personOutline, timeOutline, chatbubbleOutline });
  }

  get esTecnico(): boolean {
    return this.authServicio.esTecnico();
  }

  ngOnInit(): void {
    this.cargarResenas();
  }

  cargarResenas(): void {
    this.cargando = true;
    const usuario = this.authServicio.obtenerUsuario();

    if (!usuario) {
      this.cargando = false;
      return;
    }

    if (this.filtro === 'recibidas') {
      // Ver reseñas que me han dado
      if (this.esTecnico) {
        // Técnico viendo reseñas que le han dado
        this.resenasServicio.obtenerResenasTecnico(usuario._id!).subscribe({
          next: (res: any) => {
            this.resenas = res.datos?.resenas || res.datos || [];
            this.cargando = false;
          },
          error: () => {
            this.resenas = [];
            this.cargando = false;
          }
        });
      } else {
        // Cliente viendo reseñas que ha recibido de técnicos
        this.resenasServicio.obtenerMisResenas('recibidas').subscribe({
          next: (res: any) => {
            this.resenas = res.datos?.resenas || res.datos || [];
            this.cargando = false;
          },
          error: () => {
            this.resenas = [];
            this.cargando = false;
          }
        });
      }
    } else {
      // Ver reseñas que he dado (tanto cliente como técnico)
      this.resenasServicio.obtenerMisResenas('enviadas').subscribe({
        next: (res: any) => {
          this.resenas = res.datos?.resenas || res.datos || [];
          this.cargando = false;
        },
        error: () => {
          this.resenas = [];
          this.cargando = false;
        }
      });
    }
  }

  async refrescar(event: any): Promise<void> {
    this.cargarResenas();
    setTimeout(() => event.target.complete(), 1000);
  }

  obtenerFotoUsuario(resena: Resena): string {
    // Para reseñas recibidas, mostrar quien escribió la reseña (idResenador)
    if (this.filtro === 'recibidas') {
      return resena.idResenador?.perfil?.fotoUrl || resena.cliente?.perfil?.fotoUrl || resena.tecnico?.perfil?.fotoUrl || 'assets/avatar-default.png';
    }
    // Para reseñas dadas, mostrar a quien reseñé (idResenado)
    return resena.idResenado?.perfil?.fotoUrl || resena.tecnico?.perfil?.fotoUrl || resena.cliente?.perfil?.fotoUrl || 'assets/avatar-default.png';
  }

  obtenerNombreUsuario(resena: Resena): string {
    // Para reseñas recibidas, mostrar quien escribió la reseña
    if (this.filtro === 'recibidas') {
      const perfil = resena.idResenador?.perfil || resena.cliente?.perfil || resena.tecnico?.perfil;
      return perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Usuario';
    }
    // Para reseñas dadas, mostrar a quien reseñé
    const perfil = resena.idResenado?.perfil || resena.tecnico?.perfil || resena.cliente?.perfil;
    return perfil ? `${perfil.nombre} ${perfil.apellido}` : 'Usuario';
  }
}
