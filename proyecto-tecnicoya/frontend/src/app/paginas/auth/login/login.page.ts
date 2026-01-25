import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton,
  IonButtons, IonButton, IonIcon, IonInput, IonItem, IonList,
  IonText, IonSpinner, IonInputPasswordToggle,
  ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, eyeOutline,
  eyeOffOutline, logInOutline
} from 'ionicons/icons';
import { AuthServicio } from '../../../servicios/auth.servicio';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/bienvenida"></ion-back-button>
        </ion-buttons>
        <ion-title>Iniciar Sesión</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="login-container">
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-circle">
            <ion-icon name="log-in-outline"></ion-icon>
          </div>
          <h2>Bienvenido de vuelta</h2>
        </div>

        <!-- Formulario -->
        <form [formGroup]="formulario" (ngSubmit)="iniciarSesion()">
          <ion-list class="formulario-registro">
            <ion-item>
              <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="email"
                type="email"
                label="Correo electrónico"
                labelPlacement="floating"
                placeholder="tu@email.com"
              ></ion-input>
            </ion-item>
            @if (campoInvalido('email')) {
              <p class="error-validacion">Ingresa un correo válido</p>
            }

            <ion-item>
              <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="contrasena"
                type="password"
                label="Contraseña"
                labelPlacement="floating"
                placeholder="Tu contraseña"
              >
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
            </ion-item>
            @if (campoInvalido('contrasena')) {
              <p class="error-validacion">La contraseña es obligatoria</p>
            }
          </ion-list>

          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="formulario.invalid || cargando"
            class="boton-submit"
          >
            @if (cargando) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Iniciar Sesión
            }
          </ion-button>
        </form>

        <!-- Links adicionales -->
        <div class="links-adicionales">
          <ion-button fill="clear" size="small" (click)="recuperarContrasena()">
            ¿Olvidaste tu contraseña?
          </ion-button>
          
          <p>
            ¿No tienes cuenta? 
            <ion-text color="primary" (click)="irARegistro()">
              <strong>Regístrate</strong>
            </ion-text>
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      max-width: 400px;
      margin: 0 auto;
      padding-top: 24px;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;

      ion-icon {
        font-size: 40px;
        color: white;
      }
    }

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: white;
      margin: 0;
    }

    .boton-submit {
      margin-top: 24px;
      --border-radius: 12px;
      height: 50px;
    }

    .links-adicionales {
      text-align: center;
      margin-top: 24px;

      p {
        color: var(--ion-color-medium);
        
        ion-text {
          cursor: pointer;
        }
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton,
    IonButtons, IonButton, IonIcon, IonInput, IonItem, IonList,
    IonText, IonSpinner, IonInputPasswordToggle,
    ReactiveFormsModule, NgIf
  ],
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authServicio = inject(AuthServicio);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  formulario: FormGroup;
  cargando = false;

  constructor() {
    addIcons({
      mailOutline, lockClosedOutline, eyeOutline,
      eyeOffOutline, logInOutline
    });

    this.formulario = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required]]
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return control ? control.invalid && control.touched : false;
  }

  async iniciarSesion(): Promise<void> {
    if (this.formulario.invalid) return;

    this.cargando = true;

    try {
      const { email, contrasena } = this.formulario.value;

      this.authServicio.login({ email, contrasena }).subscribe({
        next: async (respuesta) => {
          this.cargando = false;

          if (respuesta.exito) {
            // Navegar al dashboard dentro de tabs
            console.log('✅ Login exitoso, navegando a /tabs/inicio');
            this.router.navigate(['/tabs/inicio'], { replaceUrl: true });
          } else {
            await this.mostrarError(respuesta.mensaje || 'Error al iniciar sesión');
          }
        },
        error: async (error) => {
          this.cargando = false;
          await this.mostrarError(
            error.error?.mensaje || 'Error de conexión. Inténtalo de nuevo.'
          );
        }
      });
    } catch (error) {
      this.cargando = false;
      await this.mostrarError('Error inesperado');
    }
  }

  async recuperarContrasena(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Recuperar contraseña',
      message: 'Ingresa tu correo electrónico y te enviaremos instrucciones.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'tu@email.com'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: async (data) => {
            if (data.email) {
              const toast = await this.toastCtrl.create({
                message: 'Si el correo existe, recibirás instrucciones.',
                duration: 3000,
                position: 'bottom',
                color: 'success'
              });
              await toast.present();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  irARegistro(): void {
    this.router.navigate(['/registro']);
  }

  private async mostrarError(mensaje: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
