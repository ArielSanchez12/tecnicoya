import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonCard, IonCardContent, IonAvatar, IonIcon, IonButton,
  IonChip, IonLabel, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  starOutline, star, locationOutline, callOutline,
  chatbubbleOutline, shieldCheckmarkOutline, flashOutline
} from 'ionicons/icons';
import { Usuario, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-tarjeta-tecnico',
  template: `
    <ion-card class="tarjeta-tecnico" (click)="verPerfil()">
      <ion-card-content>
        <div class="tecnico-header">
          <ion-avatar>
            <img [src]="tecnico.perfil?.fotoUrl || tecnico.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt="Foto"/>
          </ion-avatar>
          <div class="tecnico-info">
            <div class="nombre-row">
              <h3>{{ tecnico.nombre }} {{ tecnico.apellido }}</h3>
              @if (esTecnicoVerificado(tecnico)) {
                <span class="badge-tecnico-verificado">
                  <ion-icon name="shield-checkmark-outline"></ion-icon>
                  Verificado
                </span>
              }
            </div>
            <div class="calificacion">
              <ion-icon name="star" color="warning"></ion-icon>
              <span>{{ tecnico.datosTecnico?.calificacionPromedio | number:'1.1-1' }}</span>
              <span class="trabajos">({{ tecnico.datosTecnico?.trabajosCompletados }} trabajos)</span>
            </div>
          </div>
        </div>

        <!-- Especialidades -->
        <div class="especialidades">
          @for (esp of tecnico.datosTecnico?.especialidades?.slice(0, 3); track esp) {
            <ion-chip size="small">
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
          <div class="info-badges">
            @if (tecnico.datosTecnico?.disponibleAhora) {
              <ion-badge color="success">Disponible</ion-badge>
            }
            @if (tecnico.datosTecnico?.emergencia24h) {
              <ion-badge color="danger">
                <ion-icon name="flash-outline"></ion-icon> 24/7
              </ion-badge>
            }
          </div>
          @if (mostrarAcciones) {
            <div class="acciones">
              <ion-button fill="clear" size="small" (click)="llamar($event)">
                <ion-icon name="call-outline"></ion-icon>
              </ion-button>
              <ion-button fill="clear" size="small" (click)="mensaje($event)">
                <ion-icon name="chatbubble-outline"></ion-icon>
              </ion-button>
            </div>
          }
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .tarjeta-tecnico {
      margin: 0;
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

        .nombre-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
          }
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
    }

    .especialidades {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 12px;
    }

    .tecnico-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .info-badges {
        display: flex;
        gap: 8px;

        ion-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
        }
      }

      .acciones {
        display: flex;
        gap: 4px;
      }
    }
  `],
  standalone: true,
  imports: [
    IonCard, IonCardContent, IonAvatar, IonIcon, IonButton,
    IonChip, IonLabel, IonBadge,
    NgFor, NgIf, DecimalPipe
  ],
})
export class TarjetaTecnicoComponent {
  @Input() tecnico!: Usuario;
  @Input() mostrarAcciones = true;
  @Output() onLlamar = new EventEmitter<Usuario>();
  @Output() onMensaje = new EventEmitter<Usuario>();

  private router = new Router();

  constructor() {
    addIcons({
      starOutline, star, locationOutline, callOutline,
      chatbubbleOutline, shieldCheckmarkOutline, flashOutline
    });
  }

  verPerfil(): void {
    this.router.navigate(['/tecnico', this.tecnico._id]);
  }

  llamar(event: Event): void {
    event.stopPropagation();
    if (this.tecnico.telefono) {
      window.location.href = `tel:${this.tecnico.telefono}`;
    }
    this.onLlamar.emit(this.tecnico);
  }

  mensaje(event: Event): void {
    event.stopPropagation();
    this.onMensaje.emit(this.tecnico);
    this.router.navigate(['/chat', this.tecnico._id]);
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
