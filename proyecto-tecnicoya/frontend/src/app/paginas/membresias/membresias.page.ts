/**
 * Página de Membresías
 * TécnicoYa - Frontend
 * Planes de membresía para técnicos
 */

import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
  IonBadge, IonSpinner, IonList, IonItem, IonLabel, IonChip,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  diamondOutline, starOutline, personOutline, checkmarkCircle,
  closeCircle, rocketOutline, shieldCheckmarkOutline, locationOutline,
  trophyOutline, ribbonOutline, timeOutline, cardOutline
} from 'ionicons/icons';
import { MembresiasServicio, PlanMembresia, Membresia } from '../../servicios/membresias.servicio';
import { AuthServicio } from '../../servicios/auth.servicio';
import { NgFor, NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-membresias',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Membresías</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="cargando-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando planes...</p>
        </div>
      } @else {
        <!-- Membresía actual -->
        @if (membresiaActual) {
          <ion-card class="membresia-actual" [class]="'membresia-' + membresiaActual.tipo">
            <ion-card-header>
              <div class="membresia-header">
                <ion-icon [name]="obtenerIcono(membresiaActual.tipo)"></ion-icon>
                <div>
                  <ion-card-title style="color: black;">Tu Membresía Actual</ion-card-title>
                  <ion-badge [color]="obtenerColor(membresiaActual.tipo)">
                    {{ membresiaActual.planInfo?.nombre || membresiaActual.tipo }}
                  </ion-badge>
                </div>
              </div>
            </ion-card-header>
            <ion-card-content>
              @if (membresiaActual.tipo !== 'basico') {
                <div class="info-membresia">
                  <div class="info-item">
                    <ion-icon name="time-outline"></ion-icon>
                    <span>
                      @if (membresiaActual.diasRestantes && membresiaActual.diasRestantes > 0) {
                        {{ membresiaActual.diasRestantes }} días restantes
                      } @else {
                        Vencida
                      }
                    </span>
                  </div>
                  <div class="info-item">
                    <ion-icon name="location-outline"></ion-icon>
                    <span>Radio: {{ 15 + membresiaActual.radioExtendido }} km</span>
                  </div>
                </div>
              } @else {
                <p class="plan-basico-info">
                  Tienes el plan gratuito. ¡Mejora tu membresía para obtener más clientes!
                </p>
              }
            </ion-card-content>
          </ion-card>
        }

        <!-- Planes disponibles -->
        <div class="planes-container">
          <h2 class="seccion-titulo">
            <ion-icon name="rocket-outline"></ion-icon>
            Planes Disponibles
          </h2>

          <div class="planes-grid">
            @for (plan of planesArray; track plan.key) {
              <ion-card 
                class="plan-card" 
                [class.plan-actual]="membresiaActual?.tipo === plan.key"
                [class.plan-destacado]="plan.key === 'profesional'"
                [class]="'plan-' + plan.key"
              >
                @if (plan.key === 'profesional') {
                  <div class="badge-popular">MÁS POPULAR</div>
                }
                
                <ion-card-header>
                  <div class="plan-icono">
                    <ion-icon [name]="obtenerIcono(plan.key)"></ion-icon>
                  </div>
                  <ion-card-title>{{ plan.data.nombre }}</ion-card-title>
                  <div class="plan-precio">
                    @if (plan.data.precio === 0) {
                      <span class="precio">Gratis</span>
                    } @else {
                      <span class="precio">\${{ plan.data.precio }}</span>
                      <span class="periodo">/mes</span>
                    }
                  </div>
                </ion-card-header>

                <ion-card-content>
                  <div class="plan-radio">
                    <ion-icon name="location-outline"></ion-icon>
                    <strong>Radio: {{ 15 + plan.data.radioExtendido }} km</strong>
                  </div>

                  <ion-list lines="none" class="beneficios-lista">
                    @for (beneficio of plan.data.beneficios; track beneficio) {
                      <ion-item>
                        <ion-icon name="checkmark-circle" color="success" slot="start"></ion-icon>
                        <ion-label>{{ beneficio }}</ion-label>
                      </ion-item>
                    }
                  </ion-list>

                  @if (membresiaActual?.tipo === plan.key) {
                    <ion-button expand="block" fill="solid" disabled>
                      <ion-icon name="checkmark-circle" slot="start"></ion-icon>
                      Plan Actual
                    </ion-button>
                  } @else if (plan.key === 'basico') {
                    <!-- No mostrar botón para básico si ya tiene otro plan -->
                  } @else {
                    <ion-button 
                      expand="block" 
                      [fill]="plan.key === 'premium' ? 'solid' : 'outline'"
                      [color]="plan.key === 'premium' ? 'warning' : 'primary'"
                      (click)="seleccionarPlan(plan.key)"
                      [disabled]="procesando"
                    >
                      @if (procesando && planSeleccionado === plan.key) {
                        <ion-spinner name="crescent"></ion-spinner>
                      } @else {
                        <ion-icon name="card-outline" slot="start"></ion-icon>
                        Suscribirse
                      }
                    </ion-button>
                  }
                </ion-card-content>
              </ion-card>
            }
          </div>
        </div>

        <!-- Cancelar membresía -->
        @if (membresiaActual && membresiaActual.tipo !== 'basico') {
          <div class="cancelar-container">
            <ion-button fill="clear" color="danger" (click)="confirmarCancelacion()">
              Cancelar membresía
            </ion-button>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [`
    .cargando-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      
      ion-spinner {
        width: 48px;
        height: 48px;
      }
      
      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    .membresia-actual {
      margin: 16px;
      border-radius: 16px;
      overflow: hidden;

      &.membresia-premium {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #333;
      }

      &.membresia-profesional {
        background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
        color: white;

        ion-card-title, ion-badge {
          color: white;
        }
      }

      &.membresia-basico {
        background: var(--ion-color-light);
      }

      .membresia-header {
        display: flex;
        align-items: center;
        gap: 16px;

        ion-icon {
          font-size: 40px;
        }
      }

      .info-membresia {
        display: flex;
        gap: 24px;
        margin-top: 8px;

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;

          ion-icon {
            font-size: 20px;
          }
        }
      }

      .plan-basico-info {
        margin: 0;
        font-size: 14px;
      }
    }

    .seccion-titulo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      margin: 0;
      font-size: 18px;
      font-weight: 600;

      ion-icon {
        font-size: 24px;
        color: var(--ion-color-primary);
      }
    }

    .planes-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 0 16px;
    }

    .plan-card {
      border-radius: 16px;
      position: relative;
      overflow: hidden;

      &.plan-destacado {
        border: 2px solid var(--ion-color-primary);
      }

      &.plan-actual {
        opacity: 0.7;
      }

      .badge-popular {
        position: absolute;
        top: 12px;
        right: -30px;
        background: var(--ion-color-primary);
        color: white;
        padding: 4px 40px;
        font-size: 10px;
        font-weight: bold;
        transform: rotate(45deg);
      }

      ion-card-header {
        text-align: center;
        padding-bottom: 8px;
      }

      .plan-icono {
        width: 60px;
        height: 60px;
        margin: 0 auto 12px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        ion-icon {
          font-size: 32px;
        }
      }

      &.plan-basico .plan-icono {
        background: var(--ion-color-medium-tint);
        color: var(--ion-color-medium);
      }

      &.plan-profesional .plan-icono {
        background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
        color: white;
      }

      &.plan-premium .plan-icono {
        background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
        color: #333;
      }

      .plan-precio {
        margin-top: 8px;

        .precio {
          font-size: 32px;
          font-weight: bold;
        }

        .periodo {
          font-size: 14px;
          color: var(--ion-color-medium);
        }
      }

      .plan-radio {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        background: var(--ion-color-light);
        border-radius: 8px;
        margin-bottom: 16px;

        ion-icon {
          color: var(--ion-color-primary);
        }
      }

      .beneficios-lista {
        padding: 0;
        margin-bottom: 16px;

        ion-item {
          --padding-start: 0;
          --inner-padding-end: 0;
          --min-height: 36px;
          font-size: 14px;

          ion-icon {
            font-size: 18px;
            margin-right: 8px;
          }
        }
      }
    }

    .cancelar-container {
      text-align: center;
      padding: 24px;
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
    IonBadge, IonSpinner, IonList, IonItem, IonLabel, IonChip,
    NgFor, NgIf, CurrencyPipe, DatePipe
  ]
})
export class MembresiasPage implements OnInit {
  private router = inject(Router);
  private membresiasServicio = inject(MembresiasServicio);
  private authServicio = inject(AuthServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  cargando = true;
  procesando = false;
  planSeleccionado: string | null = null;

  planes: { [key: string]: PlanMembresia } = {};
  planesArray: { key: string; data: PlanMembresia }[] = [];
  membresiaActual: Membresia | null = null;

  constructor() {
    addIcons({
      diamondOutline, starOutline, personOutline, checkmarkCircle,
      closeCircle, rocketOutline, shieldCheckmarkOutline, locationOutline,
      trophyOutline, ribbonOutline, timeOutline, cardOutline
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.cargando = true;

    try {
      // Cargar planes
      const resPlanes = await firstValueFrom(this.membresiasServicio.obtenerPlanes());
      if (resPlanes.exito) {
        this.planes = resPlanes.datos;
        this.planesArray = Object.entries(resPlanes.datos).map(([key, data]) => ({
          key,
          data
        }));
      }

      // Cargar membresía actual
      const resMembresia = await firstValueFrom(this.membresiasServicio.obtenerMiMembresia());
      if (resMembresia.exito) {
        this.membresiaActual = resMembresia.datos;
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      this.cargando = false;
    }
  }

  obtenerIcono(tipo: string): string {
    switch (tipo) {
      case 'premium': return 'diamond-outline';
      case 'profesional': return 'star-outline';
      default: return 'person-outline';
    }
  }

  obtenerColor(tipo: string): string {
    switch (tipo) {
      case 'premium': return 'warning';
      case 'profesional': return 'tertiary';
      default: return 'medium';
    }
  }

  async seleccionarPlan(tipoPlan: string): Promise<void> {
    const plan = this.planes[tipoPlan];

    const alert = await this.alertCtrl.create({
      header: `Suscribirse a ${plan.nombre}`,
      message: `¿Deseas suscribirte al plan ${plan.nombre} por $${plan.precio}/mes?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Pagar con tarjeta',
          handler: () => this.procesarPago(tipoPlan, 'tarjeta')
        }
      ]
    });

    await alert.present();
  }

  async procesarPago(tipoPlan: string, metodoPago: string): Promise<void> {
    this.procesando = true;
    this.planSeleccionado = tipoPlan;

    try {
      const res = await firstValueFrom(this.membresiasServicio.suscribirPlan(tipoPlan, metodoPago));

      if (res.exito) {
        await this.mostrarToast(res.mensaje || '¡Suscripción exitosa!', 'success');
        // Esperar a que se actualice el usuario
        await firstValueFrom(this.authServicio.cargarUsuario());
        // Recargar datos de membresía
        await this.cargarDatos();
      } else {
        await this.mostrarToast(res.mensaje || 'Error al procesar pago', 'danger');
      }
    } catch (err: any) {
      await this.mostrarToast(err.error?.mensaje || 'Error al procesar pago', 'danger');
    } finally {
      this.procesando = false;
      this.planSeleccionado = null;
    }
  }

  async confirmarCancelacion(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Membresía',
      message: '¿Estás seguro de que deseas cancelar tu membresía? Perderás todos los beneficios.',
      buttons: [
        {
          text: 'No, mantener',
          role: 'cancel'
        },
        {
          text: 'Sí, cancelar',
          cssClass: 'alert-button-danger',
          handler: () => this.cancelarMembresia()
        }
      ]
    });

    await alert.present();
  }

  async cancelarMembresia(): Promise<void> {
    try {
      const res = await firstValueFrom(this.membresiasServicio.cancelarMembresia());

      if (res.exito) {
        await this.mostrarToast(res.mensaje, 'success');
        // Esperar a que se actualice el usuario
        await firstValueFrom(this.authServicio.cargarUsuario());
        // Recargar datos
        await this.cargarDatos();
      }
    } catch (err: any) {
      await this.mostrarToast(err.error?.mensaje || 'Error al cancelar', 'danger');
    }
  }

  private async mostrarToast(mensaje: string, color: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
