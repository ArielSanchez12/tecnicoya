/**
 * Página Retirar Fondos
 * TécnicoYa - Frontend
 * Permite a técnicos retirar sus ganancias a cuenta bancaria
 */

import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonButton, IonIcon, IonSpinner, IonList, IonNote,
  AlertController, ToastController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  walletOutline, cashOutline, cardOutline, checkmarkCircleOutline,
  timeOutline, alertCircleOutline, refreshOutline
} from 'ionicons/icons';
import { AuthServicio } from '../../servicios/auth.servicio';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { NgFor, NgIf, DecimalPipe, DatePipe } from '@angular/common';

interface Retiro {
  monto: number;
  fecha: Date;
  estado: string;
  banco: string;
  numeroCuenta: string;
}

@Component({
  selector: 'app-retirar-fondos',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Retirar Fondos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Resumen de fondos -->
      <ion-card class="fondos-card">
        <ion-card-content>
          <div class="fondos-resumen">
            <div class="fondos-disponible">
              <ion-icon name="wallet-outline"></ion-icon>
              <div>
                <span class="label">Disponible para retiro</span>
                <span class="monto">\${{ fondosDisponibles | number:'1.2-2' }}</span>
              </div>
              <ion-button 
                fill="clear" 
                size="small" 
                class="btn-refresh"
                (click)="recalcularFondos()"
                [disabled]="recalculando"
              >
                @if (recalculando) {
                  <ion-spinner name="crescent" color="light"></ion-spinner>
                } @else {
                  <ion-icon name="refresh-outline" color="light"></ion-icon>
                }
              </ion-button>
            </div>
            <div class="fondos-stats">
              <div class="stat">
                <span class="value">\${{ totalGanado | number:'1.2-2' }}</span>
                <span class="label">Total ganado</span>
              </div>
              <div class="stat">
                <span class="value">\${{ totalRetirado | number:'1.2-2' }}</span>
                <span class="label">Total retirado</span>
              </div>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Formulario de retiro -->
      @if (fondosDisponibles > 0) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="card-outline"></ion-icon>
              Datos para transferencia
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <form [formGroup]="formulario" (ngSubmit)="procesarRetiro()">
              <ion-item>
                <ion-label position="stacked">Monto a retirar</ion-label>
                <ion-input 
                  type="number" 
                  formControlName="monto"
                  placeholder="Ingresa el monto"
                  [max]="fondosDisponibles"
                ></ion-input>
              </ion-item>
              @if (formulario.get('monto')?.touched && formulario.get('monto')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El monto es obligatorio</ion-note>
              }
              @if (formulario.get('monto')?.errors?.['max']) {
                <ion-note color="danger" class="error-note">El monto excede los fondos disponibles</ion-note>
              }
              @if (formulario.get('monto')?.errors?.['min']) {
                <ion-note color="danger" class="error-note">El monto mínimo es $10</ion-note>
              }

              <ion-item>
                <ion-label position="stacked">Banco</ion-label>
                <ion-select formControlName="banco" placeholder="Selecciona tu banco">
                  <ion-select-option value="banco_pichincha">Banco Pichincha</ion-select-option>
                  <ion-select-option value="banco_guayaquil">Banco Guayaquil</ion-select-option>
                  <ion-select-option value="santander">Santander</ion-select-option>
                  <ion-select-option value="bbva">BBVA</ion-select-option>
                  <ion-select-option value="de_una">DeUna</ion-select-option>
                  <ion-select-option value="otro">Otro</ion-select-option>
                </ion-select>
              </ion-item>
              @if (formulario.get('banco')?.touched && formulario.get('banco')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">Selecciona un banco</ion-note>
              }

              <ion-item>
                <ion-label position="stacked">Número de cuenta</ion-label>
                <ion-input 
                  type="text" 
                  formControlName="numeroCuenta"
                  placeholder="Ej: 2209334567"
                  maxlength="10"
                ></ion-input>
              </ion-item>
              @if (formulario.get('numeroCuenta')?.touched && formulario.get('numeroCuenta')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El número de cuenta es obligatorio</ion-note>
              }
              @if (formulario.get('numeroCuenta')?.errors?.['minlength']) {
                <ion-note color="danger" class="error-note">El número de cuenta debe tener al menos 10 dígitos</ion-note>
              }

              <ion-item>
                <ion-label position="stacked">Nombre del titular</ion-label>
                <ion-input 
                  type="text" 
                  formControlName="titular"
                  placeholder="Como aparece en el banco"
                ></ion-input>
              </ion-item>
              @if (formulario.get('titular')?.touched && formulario.get('titular')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El nombre del titular es obligatorio</ion-note>
              }

              <ion-button 
                expand="block" 
                type="submit" 
                [disabled]="!formulario.valid || procesando"
                class="btn-retirar"
              >
                @if (procesando) {
                  <ion-spinner name="crescent"></ion-spinner>
                  <span>Procesando...</span>
                } @else {
                  <ion-icon name="cash-outline" slot="start"></ion-icon>
                  Solicitar Retiro
                }
              </ion-button>
            </form>
          </ion-card-content>
        </ion-card>
      } @else {
        <ion-card class="sin-fondos">
          <ion-card-content>
            <ion-icon name="wallet-outline"></ion-icon>
            <h3>Sin fondos disponibles</h3>
            <p>Completa trabajos para acumular ganancias que puedas retirar.</p>
            <ion-button 
              fill="outline" 
              size="small" 
              (click)="recalcularFondos()"
              [disabled]="recalculando"
            >
              @if (recalculando) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                Actualizar Fondos
              }
            </ion-button>
          </ion-card-content>
        </ion-card>
      }

      <!-- Historial de retiros -->
      @if (historialRetiros.length > 0) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>
              <ion-icon name="time-outline"></ion-icon>
              Historial de Retiros
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list>
              @for (retiro of historialRetiros; track $index) {
                <ion-item>
                  <ion-icon 
                    [name]="obtenerIconoEstado(retiro.estado)" 
                    [color]="obtenerColorEstado(retiro.estado)"
                    slot="start"
                  ></ion-icon>
                  <ion-label>
                    <h3>\${{ retiro.monto | number:'1.2-2' }}</h3>
                    <p>{{ retiro.banco }} - ****{{ retiro.numeroCuenta?.slice(-4) }}</p>
                    <p class="fecha">{{ retiro.fecha | date:'dd/MM/yyyy HH:mm' }}</p>
                  </ion-label>
                  <ion-note slot="end" [color]="obtenerColorEstado(retiro.estado)">
                    {{ obtenerEtiquetaEstado(retiro.estado) }}
                  </ion-note>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>
      }
    </ion-content>
  `,
  styles: [`
    .fondos-card {
      margin-bottom: 16px;
      background: linear-gradient(135deg, var(--ion-color-success), var(--ion-color-success-shade));
      color: white;

      .fondos-resumen {
        .fondos-disponible {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.2);

          > ion-icon {
            font-size: 48px;
          }

          > div {
            flex: 1;
          }

          .label {
            display: block;
            font-size: 12px;
            opacity: 0.9;
          }

          .monto {
            display: block;
            font-size: 32px;
            font-weight: 700;
          }

          .btn-refresh {
            --padding-start: 8px;
            --padding-end: 8px;
            margin: 0;
          }
        }

        .fondos-stats {
          display: flex;
          justify-content: space-around;

          .stat {
            text-align: center;

            .value {
              display: block;
              font-size: 18px;
              font-weight: 600;
            }

            .label {
              font-size: 11px;
              opacity: 0.8;
            }
          }
        }
      }
    }

    ion-card {
      border-radius: 12px;
      margin-bottom: 16px;
    }

    ion-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;

      ion-icon {
        font-size: 22px;
      }
    }

    ion-item {
      --padding-start: 0;
      margin-bottom: 12px;
    }

    .error-note {
      display: block;
      padding: 4px 0 8px;
      font-size: 12px;
    }

    .btn-retirar {
      margin-top: 24px;
      height: 48px;

      ion-spinner {
        margin-right: 8px;
      }
    }

    .sin-fondos {
      text-align: center;
      padding: 32px 16px;

      ion-icon {
        font-size: 64px;
        color: var(--ion-color-medium);
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        color: var(--ion-text-color);
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .fecha {
      font-size: 11px !important;
      color: var(--ion-color-medium);
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonButton, IonIcon, IonSpinner, IonList, IonNote,
    NgFor, NgIf, DecimalPipe, DatePipe, ReactiveFormsModule
  ]
})
export class RetirarFondosPage implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authServicio = inject(AuthServicio);
  private usuariosServicio = inject(UsuariosServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  formulario!: FormGroup;
  fondosDisponibles = 0;
  totalGanado = 0;
  totalRetirado = 0;
  historialRetiros: Retiro[] = [];
  procesando = false;
  recalculando = false;

  constructor() {
    addIcons({
      walletOutline, cashOutline, cardOutline, checkmarkCircleOutline,
      timeOutline, alertCircleOutline, refreshOutline
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    this.inicializarFormulario();
  }

  cargarDatos(): void {
    this.authServicio.usuarioActual$.subscribe(usuario => {
      if (usuario?.datosTecnico?.fondos) {
        this.fondosDisponibles = usuario.datosTecnico.fondos.disponible || 0;
        this.totalGanado = usuario.datosTecnico.fondos.totalGanado || 0;
        this.totalRetirado = usuario.datosTecnico.fondos.totalRetirado || 0;
      }
      if (usuario?.datosTecnico?.historialRetiros) {
        this.historialRetiros = usuario.datosTecnico.historialRetiros || [];
      }
    });
  }

  inicializarFormulario(): void {
    this.formulario = this.fb.group({
      monto: [null, [Validators.required, Validators.min(10), Validators.max(this.fondosDisponibles)]],
      banco: ['', Validators.required],
      numeroCuenta: ['', [Validators.required, Validators.minLength(22), Validators.maxLength(22)]],
      titular: ['', Validators.required]
    });
  }

  async procesarRetiro(): Promise<void> {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const monto = this.formulario.value.monto;

    if (monto > this.fondosDisponibles) {
      await this.mostrarToast('El monto excede los fondos disponibles', 'danger');
      return;
    }

    // Confirmar retiro
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Retiro',
      message: `¿Deseas retirar $${monto.toFixed(2)} a tu cuenta bancaria?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => this.ejecutarRetiro()
        }
      ]
    });
    await alert.present();
  }

  private async ejecutarRetiro(): Promise<void> {
    this.procesando = true;

    const loading = await this.loadingCtrl.create({
      message: 'Procesando solicitud...',
      spinner: 'crescent'
    });
    await loading.present();

    const datosRetiro = {
      monto: this.formulario.value.monto,
      banco: this.formulario.value.banco,
      numeroCuenta: this.formulario.value.numeroCuenta,
      titular: this.formulario.value.titular
    };

    this.usuariosServicio.retirarFondos(datosRetiro).subscribe({
      next: async (respuesta) => {
        await loading.dismiss();
        this.procesando = false;

        if (respuesta.exito) {
          // Actualizar datos locales
          const montoRetirado = datosRetiro.monto;
          this.fondosDisponibles -= montoRetirado;
          this.totalRetirado += montoRetirado;

          // Agregar al historial local
          this.historialRetiros.unshift({
            monto: montoRetirado,
            fecha: new Date(),
            estado: 'completado',
            banco: datosRetiro.banco,
            numeroCuenta: datosRetiro.numeroCuenta
          });

          // Mostrar éxito
          const alert = await this.alertCtrl.create({
            header: 'Retiro Exitoso',
            message: `Se han enviado $${montoRetirado.toFixed(2)} a tu cuenta bancaria. El depósito se reflejará en las próximas 24-48 horas hábiles.`,
            buttons: ['Entendido']
          });
          await alert.present();

          // Resetear formulario
          this.formulario.reset();

          // Recargar datos del usuario
          this.authServicio.cargarUsuario();
        } else {
          await this.mostrarToast(respuesta.mensaje || 'Error al procesar retiro', 'danger');
        }
      },
      error: async (error) => {
        await loading.dismiss();
        this.procesando = false;
        console.error('Error en retiro:', error);
        await this.mostrarToast(error.error?.mensaje || 'Error al procesar retiro', 'danger');
      }
    });
  }

  obtenerIconoEstado(estado: string): string {
    const iconos: Record<string, string> = {
      'pendiente': 'time-outline',
      'procesando': 'time-outline',
      'completado': 'checkmark-circle-outline',
      'rechazado': 'alert-circle-outline'
    };
    return iconos[estado] || 'time-outline';
  }

  obtenerColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      'pendiente': 'warning',
      'procesando': 'warning',
      'completado': 'success',
      'rechazado': 'danger'
    };
    return colores[estado] || 'medium';
  }

  obtenerEtiquetaEstado(estado: string): string {
    const etiquetas: Record<string, string> = {
      'pendiente': 'Pendiente',
      'procesando': 'Procesando',
      'completado': 'Completado',
      'rechazado': 'Rechazado'
    };
    return etiquetas[estado] || estado;
  }

  async recalcularFondos(): Promise<void> {
    this.recalculando = true;

    this.usuariosServicio.recalcularFondos().subscribe({
      next: async (res) => {
        this.recalculando = false;
        if (res.exito && res.datos) {
          this.fondosDisponibles = res.datos.fondosDisponibles || 0;
          this.totalGanado = res.datos.totalGanado || 0;
          this.totalRetirado = res.datos.totalRetirado || 0;

          // Actualizar validaciones del formulario
          this.inicializarFormulario();

          // Recargar datos del usuario
          this.authServicio.cargarUsuario();

          await this.mostrarToast(`Fondos actualizados: $${this.fondosDisponibles.toFixed(2)} disponibles`, 'success');
        }
      },
      error: async (error) => {
        this.recalculando = false;
        console.error('Error al recalcular:', error);
        await this.mostrarToast('Error al actualizar fondos', 'danger');
      }
    });
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
