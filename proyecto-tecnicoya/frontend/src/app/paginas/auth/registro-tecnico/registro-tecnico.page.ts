import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton,
  IonButtons, IonButton, IonIcon, IonInput, IonItem, IonList,
  IonText, IonSpinner, IonInputPasswordToggle, IonTextarea,
  IonSelect, IonSelectOption, IonChip, IonLabel, IonCheckbox,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, lockClosedOutline,
  callOutline, briefcaseOutline, cashOutline,
  documentTextOutline, closeCircle, locationOutline
} from 'ionicons/icons';
import { AuthServicio } from '../../../servicios/auth.servicio';
import { TIPOS_SERVICIO, TipoServicio } from '../../../modelos';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-registro-tecnico',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/bienvenida"></ion-back-button>
        </ion-buttons>
        <ion-title>Registro de Técnico</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="registro-container">
        <!-- Encabezado -->
        <div class="header-section">
          <h2>Únete como Técnico</h2>
          <p>Ofrece tus servicios a miles de clientes</p>
        </div>

        <!-- Formulario -->
        <form [formGroup]="formulario" (ngSubmit)="registrar()">
          <ion-list class="formulario-registro">
            <!-- Datos Personales -->
            <h3 class="section-title">Datos Personales</h3>

            <ion-item>
              <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="nombre"
                type="text"
                label="Nombre"
                labelPlacement="floating"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="apellido"
                type="text"
                label="Apellido"
                labelPlacement="floating"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-icon name="mail-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="email"
                type="email"
                label="Correo electrónico"
                labelPlacement="floating"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-icon name="call-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="telefono"
                type="tel"
                label="Teléfono"
                labelPlacement="floating"
              ></ion-input>
            </ion-item>

            <!-- Datos Profesionales -->
            <h3 class="section-title">Datos Profesionales</h3>

            <!-- Especialidades -->
            <ion-item class="select-especialidades">
              <ion-select
                label="Especialidades"
                labelPlacement="floating"
                [multiple]="true"
                formControlName="especialidades"
                placeholder="Selecciona tus especialidades"
              >
                @for (tipo of tiposServicio; track tipo.valor) {
                  <ion-select-option [value]="tipo.valor">
                    {{ tipo.etiqueta }}
                  </ion-select-option>
                }
              </ion-select>
            </ion-item>

            <!-- Chips de especialidades seleccionadas -->
            @if (formulario.get('especialidades')?.value?.length) {
              <div class="chips-container">
                @for (esp of formulario.get('especialidades')?.value; track esp) {
                  <ion-chip color="primary">
                    <ion-label>{{ obtenerEtiquetaEspecialidad(esp) }}</ion-label>
                  </ion-chip>
                }
              </div>
            }



            <ion-item>
              <ion-textarea
                formControlName="descripcion"
                label="Descripción de tus servicios"
                labelPlacement="floating"
                placeholder="Cuéntanos sobre tu experiencia y servicios..."
                [autoGrow]="true"
                rows="3"
              ></ion-textarea>
            </ion-item>

            <!-- Contraseña -->
            <h3 class="section-title">Seguridad</h3>

            <ion-item>
              <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="contrasena"
                type="password"
                label="Contraseña"
                labelPlacement="floating"
              >
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
            </ion-item>

            <ion-item>
              <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
              <ion-input
                formControlName="confirmarContrasena"
                type="password"
                label="Confirmar contraseña"
                labelPlacement="floating"
              >
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
            </ion-item>

            <!-- Términos -->
            <ion-item lines="none" class="terminos-item">
              <ion-checkbox formControlName="aceptaTerminos" slot="start"></ion-checkbox>
              <ion-label class="ion-text-wrap terminos-texto">
                Acepto los <a routerLink="/terminos" class="link-terminos">Términos y Condiciones</a> 
                y la <a routerLink="/privacidad" class="link-terminos">Política de Privacidad</a>
              </ion-label>
            </ion-item>
          </ion-list>

          <ion-button 
            expand="block" 
            type="submit" 
            [disabled]="formulario.invalid || !contrasenasCoinciden() || cargando"
            class="boton-submit"
          >
            @if (cargando) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Registrarme como Técnico
            }
          </ion-button>
        </form>

        <!-- Link a login -->
        <div class="links-adicionales">
          <p>
            ¿Ya tienes cuenta? 
            <ion-text color="primary" (click)="irALogin()">
              <strong>Inicia sesión</strong>
            </ion-text>
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .registro-container {
      max-width: 500px;
      margin: 0 auto;
    }

    .header-section {
      text-align: center;
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        font-weight: 600;
        color: white;
        margin: 0 0 8px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-primary);
      margin: 24px 0 8px 16px;
    }

    .chips-container {
      display: flex;
      flex-wrap: wrap;
      padding: 8px 16px;
      gap: 4px;
    }

    .boton-submit {
      margin-top: 24px;
      --border-radius: 12px;
      height: 50px;
    }

    .links-adicionales {
      text-align: center;
      margin-top: 24px;
      padding-bottom: 24px;

      p {
        color: var(--ion-color-medium);
        
        ion-text {
          cursor: pointer;
        }
      }
    }

    /* Estilos para el select de especialidades */
    .select-especialidades {
      --color: var(--ion-color-dark);
    }

    .select-especialidades ion-select {
      color: var(--ion-color-dark) !important;
    }

    .select-especialidades ion-select::part(text),
    .select-especialidades ion-select::part(label) {
      color: var(--ion-color-dark) !important;
    }

    /* Estilos para términos y condiciones */
    .terminos-item {
      --color: var(--ion-color-dark);
    }

    .terminos-texto {
      color: var(--ion-color-dark) !important;
      font-size: 14px;
    }

    .link-terminos {
      color: var(--ion-color-primary) !important;
      text-decoration: none;
      font-weight: 500;
    }

    .link-terminos:hover {
      text-decoration: underline;
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonBackButton,
    IonButtons, IonButton, IonIcon, IonInput, IonItem, IonList,
    IonText, IonSpinner, IonInputPasswordToggle, IonTextarea,
    IonSelect, IonSelectOption, IonChip, IonLabel, IonCheckbox,
    ReactiveFormsModule, NgIf, NgFor, RouterLink
  ],
})
export class RegistroTecnicoPage {
  private fb = inject(FormBuilder);
  private authServicio = inject(AuthServicio);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  formulario: FormGroup;
  cargando = false;
  tiposServicio = TIPOS_SERVICIO;

  constructor() {
    addIcons({
      personOutline, mailOutline, lockClosedOutline,
      callOutline, briefcaseOutline, cashOutline,
      documentTextOutline, closeCircle, locationOutline
    });

    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required]],
      especialidades: [[], [Validators.required, Validators.minLength(1)]],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      contrasena: ['', [Validators.required, Validators.minLength(6)]],
      confirmarContrasena: ['', [Validators.required]],
      aceptaTerminos: [false, [Validators.requiredTrue]]
    });
  }

  obtenerEtiquetaEspecialidad(valor: TipoServicio): string {
    const tipo = this.tiposServicio.find(t => t.valor === valor);
    return tipo?.etiqueta || valor;
  }

  contrasenasCoinciden(): boolean {
    const contrasena = this.formulario.get('contrasena')?.value;
    const confirmar = this.formulario.get('confirmarContrasena')?.value;
    return contrasena === confirmar;
  }

  async registrar(): Promise<void> {
    if (this.formulario.invalid || !this.contrasenasCoinciden()) return;

    this.cargando = true;

    try {
      const datos = this.formulario.value;

      this.authServicio.registrarTecnico({
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono,
        contrasena: datos.contrasena,
        rol: 'tecnico',
        especialidades: datos.especialidades,
        descripcion: datos.descripcion
      }).subscribe({
        next: async (respuesta) => {
          this.cargando = false;

          if (respuesta.exito) {
            await this.mostrarExito('¡Registro exitoso! Tu cuenta está pendiente de verificación.');
            this.router.navigate(['/tabs/inicio'], { replaceUrl: true });
          } else {
            await this.mostrarError(respuesta.mensaje || 'Error al registrar');
          }
        },
        error: async (error) => {
          this.cargando = false;
          await this.mostrarError(
            error.error?.mensaje || 'Error de conexión'
          );
        }
      });
    } catch (error) {
      this.cargando = false;
      await this.mostrarError('Error inesperado');
    }
  }

  irALogin(): void {
    this.router.navigate(['/login']);
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

  private async mostrarExito(mensaje: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
