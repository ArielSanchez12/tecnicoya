import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel, IonIcon, IonToggle, IonSelect, IonSelectOption,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline, moonOutline, languageOutline, locationOutline,
  lockClosedOutline, eyeOffOutline, trashOutline, downloadOutline,
  informationCircleOutline, helpCircleOutline, documentTextOutline,
  shieldOutline, logOutOutline
} from 'ionicons/icons';
import { AuthServicio } from '../../servicios/auth.servicio';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracion',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Configuración</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Notificaciones -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="notifications-outline"></ion-icon>
            Notificaciones
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-label>
                <h3>Push notifications</h3>
                <p>Recibe alertas en tu dispositivo</p>
              </ion-label>
              <ion-toggle [(ngModel)]="config.notificacionesPush" (ionChange)="guardarConfig()"></ion-toggle>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>Nuevos mensajes</h3>
                <p>Notificar cuando recibas mensajes</p>
              </ion-label>
              <ion-toggle [(ngModel)]="config.notifMensajes" (ionChange)="guardarConfig()"></ion-toggle>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>Cotizaciones</h3>
                <p>Notificar nuevas cotizaciones</p>
              </ion-label>
              <ion-toggle [(ngModel)]="config.notifCotizaciones" (ionChange)="guardarConfig()"></ion-toggle>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>Promociones</h3>
                <p>Recibe ofertas y descuentos</p>
              </ion-label>
              <ion-toggle [(ngModel)]="config.notifPromociones" (ionChange)="guardarConfig()"></ion-toggle>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>


      <!-- Privacidad -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="shield-outline"></ion-icon>
            Privacidad
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-label>
                <h3>Compartir ubicación</h3>
                <p>Permitir que los técnicos vean tu ubicación</p>
              </ion-label>
              <ion-toggle [(ngModel)]="config.compartirUbicacion" (ionChange)="guardarConfig()"></ion-toggle>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>Perfil público</h3>
                <p>Tu perfil visible para otros usuarios</p>
              </ion-label>
              <ion-toggle [(ngModel)]="config.perfilPublico" (ionChange)="guardarConfig()"></ion-toggle>
            </ion-item>
            <ion-item button (click)="cambiarContrasena()">
              <ion-icon name="lock-closed-outline" slot="start"></ion-icon>
              <ion-label>Cambiar contraseña</ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>


      <!-- Información -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>
            <ion-icon name="information-circle-outline"></ion-icon>
            Información
          </ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item button routerLink="/ayuda">
              <ion-icon name="help-circle-outline" slot="start"></ion-icon>
              <ion-label>Centro de ayuda</ion-label>
            </ion-item>
            <ion-item button routerLink="/terminos">
              <ion-icon name="document-text-outline" slot="start"></ion-icon>
              <ion-label>Términos y condiciones</ion-label>
            </ion-item>
            <ion-item button routerLink="/privacidad">
              <ion-icon name="shield-outline" slot="start"></ion-icon>
              <ion-label>Política de privacidad</ion-label>
            </ion-item>
            <ion-item>
              <ion-label>
                <h3>Versión</h3>
                <p>{{ version }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Cerrar sesión -->
      <div class="ion-padding">
        <ion-button expand="block" color="danger" fill="outline" (click)="cerrarSesion()">
          <ion-icon name="log-out-outline" slot="start"></ion-icon>
          Cerrar sesión
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 16px;
      border-radius: 12px;

      ion-card-header {
        padding-bottom: 0;

        ion-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;

          ion-icon {
            font-size: 20px;
            color: var(--ion-color-primary);
          }
        }
      }
    }

    ion-item {
      --padding-start: 0;
      
      h3 {
        font-weight: 500;
        margin-bottom: 2px;
      }

      p {
        font-size: 12px;
        color: var(--ion-color-medium);
      }

      ion-icon[slot="start"] {
        margin-right: 12px;
        font-size: 20px;
        color: var(--ion-color-medium);
      }
    }

    ion-toggle {
      --background: var(--ion-color-light);
      --background-checked: var(--ion-color-primary);
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonIcon, IonToggle, IonSelect, IonSelectOption,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton,
    NgFor, NgIf, FormsModule
  ],
})
export class ConfiguracionPage implements OnInit {
  private router = inject(Router);
  private authServicio = inject(AuthServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  config = {
    notificacionesPush: true,
    notifMensajes: true,
    notifCotizaciones: true,
    notifPromociones: false,
    tema: 'system',
    idioma: 'es',
    compartirUbicacion: true,
    perfilPublico: true
  };

  version = '1.0.0';

  constructor() {
    addIcons({
      notificationsOutline, moonOutline, languageOutline, locationOutline,
      lockClosedOutline, eyeOffOutline, trashOutline, downloadOutline,
      informationCircleOutline, helpCircleOutline, documentTextOutline,
      shieldOutline, logOutOutline
    });
  }

  ngOnInit(): void {
    this.cargarConfig();
  }

  cargarConfig(): void {
    const guardado = localStorage.getItem('tecnicoya_config');
    if (guardado) {
      this.config = { ...this.config, ...JSON.parse(guardado) };
    }
  }

  guardarConfig(): void {
    localStorage.setItem('tecnicoya_config', JSON.stringify(this.config));
  }

  cambiarTema(): void {
    document.body.classList.remove('dark');

    if (this.config.tema === 'dark') {
      document.body.classList.add('dark');
    } else if (this.config.tema === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark');
      }
    }

    this.guardarConfig();
  }

  async cambiarContrasena(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cambiar contraseña',
      inputs: [
        {
          name: 'actual',
          type: 'password',
          placeholder: 'Contraseña actual'
        },
        {
          name: 'nueva',
          type: 'password',
          placeholder: 'Nueva contraseña'
        },
        {
          name: 'confirmar',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cambiar',
          handler: async (data) => {
            if (data.nueva !== data.confirmar) {
              this.mostrarToast('Las contraseñas no coinciden', 'danger');
              return false;
            }
            if (data.nueva.length < 6) {
              this.mostrarToast('La contraseña debe tener al menos 6 caracteres', 'danger');
              return false;
            }
            // Aquí iría la llamada al servicio
            this.mostrarToast('Contraseña actualizada correctamente', 'success');
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async descargarDatos(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: 'Preparando descarga de datos...',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
    // Aquí iría la lógica de descarga
  }

  async eliminarCuenta(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar cuenta?',
      message: 'Esta acción es irreversible. Todos tus datos serán eliminados permanentemente.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            // Confirmar con contraseña
            const confirmAlert = await this.alertCtrl.create({
              header: 'Confirmar eliminación',
              message: 'Ingresa tu contraseña para confirmar',
              inputs: [
                {
                  name: 'password',
                  type: 'password',
                  placeholder: 'Contraseña'
                }
              ],
              buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                  text: 'Eliminar cuenta',
                  role: 'destructive',
                  handler: () => {
                    // Aquí iría la eliminación real
                    this.authServicio.logout();
                    this.router.navigate(['/bienvenida']);
                  }
                }
              ]
            });
            await confirmAlert.present();
          }
        }
      ]
    });
    await alert.present();
  }

  async cerrarSesion(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          handler: () => {
            this.authServicio.logout();
            this.router.navigate(['/bienvenida']);
          }
        }
      ]
    });
    await alert.present();
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
