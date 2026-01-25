import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton, IonItemSliding,
  IonItemOptions, IonItemOption, IonRefresher, IonRefresherContent,
  IonSegment, IonSegmentButton, IonNote,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline, checkmarkCircleOutline, alertCircleOutline,
  chatbubbleOutline, documentTextOutline, starOutline, trashOutline,
  checkmarkDoneOutline, megaphoneOutline, timeOutline, giftOutline
} from 'ionicons/icons';
import { NotificacionesServicio } from '../../servicios/notificaciones.servicio';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Notificacion {
  _id: string;
  tipo: 'servicio' | 'cotizacion' | 'mensaje' | 'resena' | 'sistema' | 'promocion';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: Date;
  referencia?: {
    tipo: string;
    id: string;
  };
}

@Component({
  selector: 'app-notificaciones',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Notificaciones</ion-title>
        <ion-buttons slot="end">
          @if (notificacionesNoLeidas > 0) {
            <ion-button (click)="marcarTodasLeidas()">
              <ion-icon name="checkmark-done-outline" slot="icon-only"></ion-icon>
            </ion-button>
          }
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="filtroActual" (ionChange)="filtrarNotificaciones()">
          <ion-segment-button value="todas">
            <ion-label>Todas</ion-label>
          </ion-segment-button>
          <ion-segment-button value="no-leidas">
            <ion-label>No leídas</ion-label>
            @if (notificacionesNoLeidas > 0) {
              <ion-badge color="danger">{{ notificacionesNoLeidas }}</ion-badge>
            }
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (notificacionesFiltradas.length === 0) {
        <div class="empty-state">
          <ion-icon name="notifications-outline"></ion-icon>
          <h2>Sin notificaciones</h2>
          <p>No tienes notificaciones {{ filtroActual === 'no-leidas' ? 'sin leer' : '' }}</p>
        </div>
      } @else {
        <ion-list>
          @for (notif of notificacionesFiltradas; track notif._id) {
            <ion-item-sliding>
              <ion-item 
                [class.no-leida]="!notif.leida"
                (click)="abrirNotificacion(notif)"
                button
              >
                <div class="icono-notificacion" slot="start" [class]="notif.tipo">
                  <ion-icon [name]="obtenerIcono(notif.tipo)"></ion-icon>
                </div>
                <ion-label>
                  <h3>{{ notif.titulo }}</h3>
                  <p>{{ notif.mensaje }}</p>
                  <ion-note>
                    <ion-icon name="time-outline"></ion-icon>
                    {{ notif.fecha | date:'dd/MM/yyyy HH:mm' }}
                  </ion-note>
                </ion-label>
                @if (!notif.leida) {
                  <div class="indicador-no-leida" slot="end"></div>
                }
              </ion-item>
              
              <ion-item-options side="end">
                @if (!notif.leida) {
                  <ion-item-option color="primary" (click)="marcarLeida(notif)">
                    <ion-icon name="checkmark-circle-outline" slot="icon-only"></ion-icon>
                  </ion-item-option>
                }
                <ion-item-option color="danger" (click)="eliminar(notif)">
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;

      ion-icon {
        font-size: 80px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      h2 {
        margin: 0 0 8px;
        color: var(--ion-color-dark);
      }

      p {
        margin: 0;
        color: var(--ion-color-medium);
      }
    }

    ion-item.no-leida {
      --background: var(--ion-color-primary-tint);
    }

    .icono-notificacion {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;

      ion-icon {
        font-size: 22px;
        color: white;
      }

      &.servicio {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.cotizacion {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.mensaje {
        background: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
      }

      &.resena {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.sistema {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.promocion {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }
    }

    ion-label {
      h3 {
        font-weight: 600;
        margin-bottom: 4px;
      }

      p {
        font-size: 13px;
        margin-bottom: 4px;
      }

      ion-note {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--ion-color-medium);

        ion-icon {
          font-size: 12px;
        }
      }
    }

    .indicador-no-leida {
      width: 10px;
      height: 10px;
      background: var(--ion-color-primary);
      border-radius: 50%;
    }

    ion-segment-button ion-badge {
      margin-left: 4px;
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton, IonItemSliding,
    IonItemOptions, IonItemOption, IonRefresher, IonRefresherContent,
    IonSegment, IonSegmentButton, IonNote,
    NgFor, NgIf, DatePipe, FormsModule
  ],
})
export class NotificacionesPage implements OnInit {
  private router = inject(Router);
  private notificacionesServicio = inject(NotificacionesServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  notificaciones: Notificacion[] = [];
  notificacionesFiltradas: Notificacion[] = [];
  filtroActual = 'todas';
  notificacionesNoLeidas = 0;

  constructor() {
    addIcons({
      notificationsOutline, checkmarkCircleOutline, alertCircleOutline,
      chatbubbleOutline, documentTextOutline, starOutline, trashOutline,
      checkmarkDoneOutline, megaphoneOutline, timeOutline, giftOutline
    });
  }

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.notificacionesServicio.obtenerNotificaciones().subscribe({
      next: (res) => {
        this.notificaciones = res.datos || [];
        this.contarNoLeidas();
        this.filtrarNotificaciones();
      },
      error: () => {
        // Datos de prueba
        this.notificaciones = [
          {
            _id: '1',
            tipo: 'servicio',
            titulo: 'Nuevo servicio asignado',
            mensaje: 'Se te ha asignado un servicio de plomería en Zona Norte',
            leida: false,
            fecha: new Date()
          },
          {
            _id: '2',
            tipo: 'cotizacion',
            titulo: 'Nueva cotización recibida',
            mensaje: 'Un técnico ha enviado una cotización para tu solicitud',
            leida: false,
            fecha: new Date(Date.now() - 3600000)
          },
          {
            _id: '3',
            tipo: 'mensaje',
            titulo: 'Nuevo mensaje',
            mensaje: 'Juan Pérez te ha enviado un mensaje',
            leida: true,
            fecha: new Date(Date.now() - 86400000)
          },
          {
            _id: '4',
            tipo: 'resena',
            titulo: '¡Nueva reseña!',
            mensaje: 'Has recibido una calificación de 5 estrellas',
            leida: true,
            fecha: new Date(Date.now() - 172800000)
          },
          {
            _id: '5',
            tipo: 'promocion',
            titulo: '¡Oferta especial!',
            mensaje: '20% de descuento en tu próximo servicio',
            leida: true,
            fecha: new Date(Date.now() - 259200000)
          }
        ];
        this.contarNoLeidas();
        this.filtrarNotificaciones();
      }
    });
  }

  contarNoLeidas(): void {
    this.notificacionesNoLeidas = this.notificaciones.filter(n => !n.leida).length;
  }

  filtrarNotificaciones(): void {
    if (this.filtroActual === 'no-leidas') {
      this.notificacionesFiltradas = this.notificaciones.filter(n => !n.leida);
    } else {
      this.notificacionesFiltradas = [...this.notificaciones];
    }
  }

  obtenerIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      'servicio': 'document-text-outline',
      'cotizacion': 'document-text-outline',
      'mensaje': 'chatbubble-outline',
      'resena': 'star-outline',
      'sistema': 'alert-circle-outline',
      'promocion': 'gift-outline'
    };
    return iconos[tipo] || 'notifications-outline';
  }

  abrirNotificacion(notif: Notificacion): void {
    if (!notif.leida) {
      this.marcarLeida(notif);
    }

    // Navegar según el tipo de notificación
    if (notif.referencia) {
      switch (notif.referencia.tipo) {
        case 'servicio':
          this.router.navigate(['/detalle-servicio', notif.referencia.id]);
          break;
        case 'mensaje':
          this.router.navigate(['/chat', notif.referencia.id]);
          break;
        // Otros casos...
      }
    }
  }

  marcarLeida(notif: Notificacion): void {
    notif.leida = true;
    this.notificacionesServicio.marcarLeida(notif._id).subscribe();
    this.contarNoLeidas();
    this.filtrarNotificaciones();
  }

  async marcarTodasLeidas(): Promise<void> {
    this.notificaciones.forEach(n => n.leida = true);
    this.notificacionesServicio.marcarTodasLeidas().subscribe();
    this.contarNoLeidas();
    this.filtrarNotificaciones();

    const toast = await this.toastCtrl.create({
      message: 'Todas las notificaciones marcadas como leídas',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async eliminar(notif: Notificacion): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar notificación',
      message: '¿Estás seguro de eliminar esta notificación?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.notificaciones = this.notificaciones.filter(n => n._id !== notif._id);
            this.notificacionesServicio.eliminar(notif._id).subscribe();
            this.contarNoLeidas();
            this.filtrarNotificaciones();
          }
        }
      ]
    });
    await alert.present();
  }

  async refrescar(event: any): Promise<void> {
    this.cargarNotificaciones();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
