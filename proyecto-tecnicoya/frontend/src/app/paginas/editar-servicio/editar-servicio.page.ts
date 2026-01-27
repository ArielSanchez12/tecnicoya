import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonButton, IonIcon, IonSpinner,
  IonNote, ToastController, AlertController, LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, saveOutline, closeCircle, addOutline, checkmarkCircleOutline
} from 'ionicons/icons';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { GeolocalizacionServicio } from '../../servicios/geolocalizacion.servicio';
import { Servicio, TIPOS_SERVICIO, TipoServicio } from '../../modelos';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-editar-servicio',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button [defaultHref]="'/detalle-servicio/' + servicioId"></ion-back-button>
        </ion-buttons>
        <ion-title>Editar Servicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Cargando...</p>
        </div>
      } @else if (servicio) {
        <form [formGroup]="formulario" (ngSubmit)="guardar()">
          <ion-card>
            <ion-card-content>
              <!-- Tipo de servicio (no editable) -->
              <ion-item>
                <ion-label position="stacked">Tipo de servicio</ion-label>
                <ion-input 
                  [value]="obtenerEtiquetaTipo(servicio.tipo || servicio.tipoServicio)"
                  readonly="true"
                ></ion-input>
              </ion-item>

              <!-- Título -->
              <ion-item>
                <ion-label position="stacked">Título del problema *</ion-label>
                <ion-input 
                  formControlName="titulo"
                  placeholder="Ej: Fuga de agua en el baño"
                ></ion-input>
              </ion-item>
              @if (formulario.get('titulo')?.touched && formulario.get('titulo')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El título es obligatorio</ion-note>
              }
              @if (formulario.get('titulo')?.errors?.['minlength']) {
                <ion-note color="danger" class="error-note">Mínimo 10 caracteres</ion-note>
              }

              <!-- Descripción -->
              <ion-item>
                <ion-label position="stacked">Descripción detallada *</ion-label>
                <ion-textarea 
                  formControlName="descripcion"
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows="4"
                ></ion-textarea>
              </ion-item>
              @if (formulario.get('descripcion')?.touched && formulario.get('descripcion')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">La descripción es obligatoria</ion-note>
              }
              @if (formulario.get('descripcion')?.errors?.['minlength']) {
                <ion-note color="danger" class="error-note">Mínimo 20 caracteres</ion-note>
              }
            </ion-card-content>
          </ion-card>

          <!-- Ubicación -->
          <ion-card>
            <ion-card-content>
              <h3 style="color:white" class="seccion-titulo">Ubicación del servicio</h3>
              
              <ion-item>
                <ion-label position="stacked">Dirección *</ion-label>
                <ion-input 
                  formControlName="direccion"
                  placeholder="Ej: Sector, calle"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">Referencia</ion-label>
                <ion-input 
                  formControlName="referencia"
                  placeholder="Ej: Cerca del parque"
                ></ion-input>
              </ion-item>

              <ion-button 
                fill="outline" 
                expand="block" 
                (click)="obtenerUbicacion()"
                [disabled]="obteniendoUbicacion"
              >
                @if (obteniendoUbicacion) {
                  <ion-spinner name="crescent"></ion-spinner>
                } @else {
                  <ion-icon name="location-outline" slot="start"></ion-icon>
                  Actualizar ubicación
                }
              </ion-button>

              @if (coordenadas) {
                <ion-note color="success" class="ubicacion-confirmada">
                  <ion-icon style="color:white" name="checkmark-circle-outline"></ion-icon>
                  Ubicación confirmada
                </ion-note>
              }
            </ion-card-content>
          </ion-card>

          <!-- Urgencia -->
          <ion-card>
            <ion-card-content>
              <h3 style="color:white" class="seccion-titulo">Urgencia</h3>
              <ion-item>
                <ion-label position="stacked">Nivel de urgencia</ion-label>
                <ion-select 
                  formControlName="urgencia"
                  interface="action-sheet"
                >
                  <ion-select-option value="normal">Normal</ion-select-option>
                  <ion-select-option value="emergencia">Emergencia (tarifa adicional)</ion-select-option>
                </ion-select>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Nota informativa -->
          <ion-card color="warning" class="card-info">
            <ion-card-content>
              <p><strong>Nota:</strong> Si ya hay técnicos que enviaron cotizaciones, serán notificados de los cambios realizados.</p>
            </ion-card-content>
          </ion-card>

          <!-- Botón guardar -->
          <div class="ion-padding">
            <ion-button 
              expand="block" 
              type="submit"
              [disabled]="!formulario.valid || guardando"
            >
              @if (guardando) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                <ion-icon name="save-outline" slot="start"></ion-icon>
                Guardar Cambios
              }
            </ion-button>
          </div>
        </form>
      }
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;

      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    ion-card {
      margin: 16px;
      border-radius: 12px;
    }

    .seccion-titulo {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .error-note {
      display: block;
      padding: 8px 16px;
      font-size: 12px;
    }

    .ubicacion-confirmada {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--ion-color-success-tint);
      border-radius: 8px;
      font-size: 14px;

      ion-icon {
        font-size: 18px;
      }
    }

    .card-info {
      ion-card-content {
        padding: 12px 16px;
      }

      p {
        margin: 0;
        font-size: 13px;
      }
    }

    ion-item {
      --padding-start: 0;
      --inner-padding-end: 0;
    }
  `],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgFor, NgIf,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea,
    IonSelect, IonSelectOption, IonButton, IonIcon, IonSpinner, IonNote
  ]
})
export class EditarServicioPage implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private serviciosServicio = inject(ServiciosServicio);
  private geoServicio = inject(GeolocalizacionServicio);

  servicioId = '';
  servicio: Servicio | null = null;
  cargando = true;
  guardando = false;
  obteniendoUbicacion = false;
  coordenadas: { lat: number; lng: number } | null = null;

  tiposServicio = TIPOS_SERVICIO;

  formulario: FormGroup = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(10)]],
    descripcion: ['', [Validators.required, Validators.minLength(20)]],
    direccion: ['', Validators.required],
    referencia: [''],
    urgencia: ['normal']
  });

  constructor() {
    addIcons({
      locationOutline, saveOutline, closeCircle, addOutline, checkmarkCircleOutline
    });
  }

  ngOnInit(): void {
    this.servicioId = this.route.snapshot.params['id'];
    this.cargarServicio();
  }

  cargarServicio(): void {
    this.cargando = true;
    this.serviciosServicio.obtenerServicio(this.servicioId).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.exito && res.datos) {
          // Extraer servicio de la respuesta (puede venir como res.datos o res.datos.servicio)
          this.servicio = (res.datos as any).servicio || res.datos;
          this.llenarFormulario();
        }
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('Error al cargar el servicio', 'danger');
        this.router.navigate(['/tabs/servicios']);
      }
    });
  }

  llenarFormulario(): void {
    if (!this.servicio) return;

    this.formulario.patchValue({
      titulo: this.servicio.titulo,
      descripcion: this.servicio.descripcion,
      direccion: this.servicio.ubicacion?.direccion || '',
      referencia: this.servicio.ubicacion?.referencia || '',
      urgencia: this.servicio.urgencia || 'normal'
    });

    // Guardar coordenadas existentes
    const coords = this.servicio.ubicacion?.coordenadas?.coordinates;
    if (coords && coords.length === 2) {
      this.coordenadas = { lng: coords[0], lat: coords[1] };
    }
  }

  obtenerEtiquetaTipo(tipo: TipoServicio | string | undefined): string {
    if (!tipo) return 'No especificado';
    const encontrado = this.tiposServicio.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  async obtenerUbicacion(): Promise<void> {
    this.obteniendoUbicacion = true;
    try {
      const posicion = await this.geoServicio.obtenerPosicionActual();
      if (posicion) {
        this.coordenadas = {
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude
        };
        this.mostrarToast('Ubicación actualizada');
      } else {
        this.mostrarToast('No se pudo obtener la ubicación', 'warning');
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      this.mostrarToast('No se pudo obtener la ubicación', 'warning');
    } finally {
      this.obteniendoUbicacion = false;
    }
  }

  async guardar(): Promise<void> {
    if (!this.formulario.valid || !this.servicio) return;

    const confirmacion = await this.alertCtrl.create({
      header: 'Confirmar cambios',
      message: '¿Deseas guardar los cambios en este servicio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: () => this.ejecutarGuardado()
        }
      ]
    });
    await confirmacion.present();
  }

  async ejecutarGuardado(): Promise<void> {
    this.guardando = true;

    const datos: any = {
      titulo: this.formulario.value.titulo,
      descripcion: this.formulario.value.descripcion,
      urgencia: this.formulario.value.urgencia,
      ubicacion: {
        direccion: this.formulario.value.direccion,
        referencia: this.formulario.value.referencia
      }
    };

    if (this.coordenadas) {
      datos.ubicacion.latitud = this.coordenadas.lat;
      datos.ubicacion.longitud = this.coordenadas.lng;
    }

    this.serviciosServicio.editarServicio(this.servicioId, datos).subscribe({
      next: (res) => {
        this.guardando = false;
        if (res.exito) {
          this.mostrarToast('Servicio actualizado correctamente', 'success');
          this.router.navigate(['/detalle-servicio', this.servicioId]);
        } else {
          this.mostrarToast(res.mensaje || 'Error al actualizar', 'danger');
        }
      },
      error: (err) => {
        this.guardando = false;
        this.mostrarToast(err.error?.mensaje || 'Error al actualizar servicio', 'danger');
      }
    });
  }

  async mostrarToast(mensaje: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
