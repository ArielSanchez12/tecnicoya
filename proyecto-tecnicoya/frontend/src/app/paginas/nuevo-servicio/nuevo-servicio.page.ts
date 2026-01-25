import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonButton, IonIcon, IonChip, IonSpinner,
  IonToggle, IonNote, ToastController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, cameraOutline, imageOutline, closeCircle,
  flashOutline, calendarOutline, addOutline
} from 'ionicons/icons';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { GeolocalizacionServicio } from '../../servicios/geolocalizacion.servicio';
import { TIPOS_SERVICIO, TipoServicio } from '../../modelos';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-nuevo-servicio',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/servicios"></ion-back-button>
        </ion-buttons>
        <ion-title>Nuevo Servicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form [formGroup]="formulario" (ngSubmit)="enviar()">
        <ion-card>
          <ion-card-content>
            <!-- Tipo de servicio -->
            @if (tipoPreseleccionado) {
              <ion-item>
                <ion-label position="stacked">Tipo de servicio</ion-label>
                <ion-input 
                  [value]="obtenerEtiquetaTipo(tipoPreseleccionado)"
                  readonly="true"
                ></ion-input>
              </ion-item>
            } @else {
              <ion-item>
                <ion-label position="stacked">Tipo de servicio *</ion-label>
                <ion-select 
                  formControlName="tipoServicio"
                  placeholder="Selecciona el tipo de servicio"
                  interface="action-sheet"
                >
                  @for (tipo of tiposServicio; track tipo.valor) {
                    <ion-select-option [value]="tipo.valor">
                      {{ tipo.etiqueta }}
                    </ion-select-option>
                  }
                </ion-select>
              </ion-item>
              @if (formulario.get('tipoServicio')?.touched && formulario.get('tipoServicio')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">Selecciona un tipo de servicio</ion-note>
              }
            }

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
            <h3 class="seccion-titulo">Ubicación del servicio (verifica que sea correcta)</h3>
            
            <ion-item>
              <ion-label position="stacked">Dirección *</ion-label>
              <ion-input 
                formControlName="direccion"
                placeholder="Ej: Sector, calle"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Ciudad *</ion-label>
              <ion-input 
                formControlName="ciudad"
                placeholder="Ej: Quito"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Provincia *</ion-label>
              <ion-input 
                formControlName="estado"
                placeholder="Ej: Pichincha"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Referencia</ion-label>
              <ion-input 
                formControlName="referencia"
                placeholder="Ej: Cerca del parque, frente a la farmacia"
                type="text"
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
                Usar mi ubicación actual
              }
            </ion-button>

            @if (coordenadas) {
              <ion-note color="success" class="ubicacion-confirmada">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                Ubicación obtenida correctamente
              </ion-note>
            }
          </ion-card-content>
        </ion-card>

        <!-- Fotos -->
        <ion-card>
          <ion-card-content>
            <h3 class="seccion-titulo">Fotos del problema (opcional)</h3>
            <p class="seccion-descripcion">Las fotos ayudan a los técnicos a entender mejor el problema</p>

            <div class="fotos-grid">
              @for (foto of fotosPreview; track $index) {
                <div class="foto-item">
                  <img [src]="foto" alt="Foto del problema"/>
                  <ion-icon 
                    name="close-circle" 
                    class="btn-eliminar"
                    (click)="eliminarFoto($index)"
                  ></ion-icon>
                </div>
              }
              @if (fotosPreview.length < 5) {
                <div class="foto-agregar" (click)="agregarFoto()">
                  <ion-icon name="add-outline"></ion-icon>
                  <span>Agregar</span>
                </div>
              }
            </div>
            <input 
              type="file" 
              #inputFoto 
              accept="image/*" 
              style="display: none"
              (change)="onFotoSeleccionada($event)"
              multiple
            />
          </ion-card-content>
        </ion-card>

        <!-- Urgencia y horario -->
        <ion-card>
          <ion-card-content>
            <h3 class="seccion-titulo">Urgencia y disponibilidad</h3>

            <ion-item>
              <ion-label position="stacked">Nivel de urgencia *</ion-label>
              <ion-select formControlName="urgencia" interface="action-sheet">
                <ion-select-option value="normal">
                  Normal - Programar para los próximos días
                </ion-select-option>
                <ion-select-option value="emergencia">
                  🚨 Emergencia - ¡Lo necesito AHORA!
                </ion-select-option>
              </ion-select>
            </ion-item>

            @if (formulario.get('urgencia')?.value === 'emergencia') {
              <div class="alerta-emergencia">
                <ion-icon name="flash-outline"></ion-icon>
                <span>Las solicitudes de emergencia se envían a técnicos con servicio 24/7</span>
              </div>
            }

            <ion-item>
              <ion-label position="stacked">Fecha preferida (opcional)</ion-label>
              <ion-input 
                type="date"
                formControlName="fechaPreferida"
                [min]="fechaMinima"
              ></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Horario preferido (opcional)</ion-label>
              <ion-select formControlName="horarioPreferido" interface="action-sheet">
                <ion-select-option value="manana">Mañana (8am - 12pm)</ion-select-option>
                <ion-select-option value="tarde">Tarde (12pm - 6pm)</ion-select-option>
                <ion-select-option value="noche">Noche (6pm - 9pm)</ion-select-option>
                <ion-select-option value="cualquiera">Cualquier horario</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-card-content>
        </ion-card>

        <!-- Botón enviar -->
        <div class="ion-padding">
          <ion-button 
            expand="block" 
            type="submit"
            [disabled]="!formulario.valid || enviando"
          >
            @if (enviando) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Publicar Solicitud
            }
          </ion-button>
        </div>
      </form>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 16px;
      border-radius: 12px;
    }

    .seccion-titulo {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 8px;
      color: var(--ion-text-color);
    }

    .seccion-descripcion {
      font-size: 13px;
      color: var(--ion-color-medium);
      margin: 0 0 16px;
    }

    .error-note {
      display: block;
      padding: 4px 16px;
      font-size: 12px;
    }

    .ubicacion-confirmada {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      font-size: 13px;
    }

    .fotos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 12px;
    }

    .foto-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .btn-eliminar {
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 24px;
        color: var(--ion-color-danger);
        background: white;
        border-radius: 50%;
        cursor: pointer;
      }
    }

    .foto-agregar {
      aspect-ratio: 1;
      border: 2px dashed var(--ion-color-medium);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 32px;
      }

      span {
        font-size: 12px;
        margin-top: 4px;
      }

      &:active {
        background: var(--ion-color-light);
      }
    }

    .alerta-emergencia {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--ion-color-danger-tint);
      border-radius: 8px;
      margin: 12px 0;
      color: white;
      font-size: 13px;

      ion-icon {
        font-size: 20px;
      }
    }

    ion-button[type="submit"] {
      height: 48px;
      font-size: 16px;
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea,
    IonSelect, IonSelectOption, IonButton, IonIcon, IonChip, IonSpinner,
    IonToggle, IonNote,
    NgFor, NgIf, ReactiveFormsModule
  ],
})
export class NuevoServicioPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private serviciosServicio = inject(ServiciosServicio);
  private geoServicio = inject(GeolocalizacionServicio);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  formulario!: FormGroup;
  tiposServicio = TIPOS_SERVICIO;
  fotosPreview: string[] = [];
  archivosSeleccionados: File[] = [];
  coordenadas: { lat: number; lng: number } | null = null;
  obteniendoUbicacion = false;
  enviando = false;
  fechaMinima = new Date().toISOString().split('T')[0];
  tipoPreseleccionado: string | null = null;

  constructor() {
    addIcons({
      locationOutline, cameraOutline, imageOutline, closeCircle,
      flashOutline, calendarOutline, addOutline
    });
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      tipoServicio: ['', Validators.required],
      titulo: ['', [Validators.required, Validators.minLength(10)]],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      direccion: ['', Validators.required],
      ciudad: ['', Validators.required],
      estado: ['', Validators.required],
      referencia: [''],
      urgencia: ['normal', Validators.required],
      fechaPreferida: [''],
      horarioPreferido: ['cualquiera']
    });

    // Leer tipo de servicio desde query params
    this.route.queryParams.subscribe(params => {
      if (params['tipo']) {
        this.tipoPreseleccionado = params['tipo'];
        this.formulario.patchValue({ tipoServicio: params['tipo'] });
      }
    });
  }

  async obtenerUbicacion(): Promise<void> {
    this.obteniendoUbicacion = true;

    const posicion = await this.geoServicio.obtenerPosicionActual();

    if (posicion) {
      this.coordenadas = {
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude
      };

      // Intentar obtener dirección mediante geocodificación inversa
      await this.obtenerDireccionDesdeCoordenadas(
        posicion.coords.latitude,
        posicion.coords.longitude
      );

      this.mostrarToast('Ubicación obtenida correctamente', 'success');
    } else {
      this.mostrarToast('No se pudo obtener la ubicación', 'danger');
    }

    this.obteniendoUbicacion = false;
  }

  /**
   * Geocodificación inversa usando Nominatim (OpenStreetMap)
   * Obtiene la dirección a partir de coordenadas
   */
  private async obtenerDireccionDesdeCoordenadas(lat: number, lng: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`;

      const response: any = await this.http.get(url).toPromise();

      if (response && response.address) {
        const address = response.address;

        // Construir dirección (sector/barrio/calle)
        let direccion = '';
        if (address.road) {
          direccion = address.road;
        }
        if (address.neighbourhood) {
          direccion = direccion ? `${address.neighbourhood}, ${direccion}` : address.neighbourhood;
        } else if (address.suburb) {
          direccion = direccion ? `${address.suburb}, ${direccion}` : address.suburb;
        }

        // Ciudad
        let ciudad = address.city || address.town || address.village || address.municipality || '';

        // Provincia/Estado - Si es Quito, asignar Pichincha
        let provincia = address.state || address.province || address.region || '';

        // Mapeo de ciudades a provincias conocidas de Ecuador
        if (ciudad.toLowerCase().includes('quito') || provincia.toLowerCase().includes('quito')) {
          ciudad = 'Quito';
          provincia = 'Pichincha';
        } else if (ciudad.toLowerCase().includes('guayaquil')) {
          provincia = 'Guayas';
        } else if (ciudad.toLowerCase().includes('cuenca')) {
          provincia = 'Azuay';
        }

        // Autocompletar solo si los campos están vacíos
        if (direccion && !this.formulario.get('direccion')?.value) {
          this.formulario.patchValue({ direccion });
        }
        if (ciudad && !this.formulario.get('ciudad')?.value) {
          this.formulario.patchValue({ ciudad });
        }
        if (provincia && !this.formulario.get('estado')?.value) {
          this.formulario.patchValue({ estado: provincia });
        }
      }
    } catch (error) {
      // Si falla la geocodificación, solo continuamos sin autocompletar
      console.log('No se pudo obtener la dirección automáticamente');
    }
  }

  agregarFoto(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => this.onFotoSeleccionada(e);
    input.click();
  }

  onFotoSeleccionada(event: any): void {
    const archivos = event.target.files;
    if (!archivos) return;

    for (let i = 0; i < archivos.length; i++) {
      if (this.fotosPreview.length >= 5) break;

      const archivo = archivos[i];
      this.archivosSeleccionados.push(archivo);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotosPreview.push(e.target.result);
      };
      reader.readAsDataURL(archivo);
    }
  }

  eliminarFoto(index: number): void {
    this.fotosPreview.splice(index, 1);
    this.archivosSeleccionados.splice(index, 1);
  }

  async enviar(): Promise<void> {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando = true;

    // Validar que tenemos coordenadas
    if (!this.coordenadas) {
      this.mostrarToast('Por favor, obtén tu ubicación antes de continuar', 'warning');
      this.enviando = false;
      return;
    }

    // Construir dirección completa
    const direccionCompleta = [
      this.formulario.value.direccion,
      this.formulario.value.ciudad,
      this.formulario.value.estado
    ].filter(Boolean).join(', ');

    // Usar FormData para enviar datos + fotos juntos
    const formData = new FormData();
    formData.append('tipo', this.formulario.value.tipoServicio);
    formData.append('titulo', this.formulario.value.titulo);
    formData.append('descripcion', this.formulario.value.descripcion);
    formData.append('ubicacion[direccion]', direccionCompleta);
    formData.append('ubicacion[referencia]', this.formulario.value.referencia || '');
    formData.append('ubicacion[latitud]', this.coordenadas.lat.toString());
    formData.append('ubicacion[longitud]', this.coordenadas.lng.toString());
    formData.append('urgencia', this.formulario.value.urgencia === 'emergencia' ? 'emergencia' : 'normal');

    if (this.formulario.value.fechaPreferida) {
      formData.append('fechaPreferida', this.formulario.value.fechaPreferida);
    }
    if (this.formulario.value.horarioPreferido) {
      formData.append('horaPreferida', this.formulario.value.horarioPreferido);
    }

    // Agregar fotos al FormData
    this.archivosSeleccionados.forEach((archivo) => {
      formData.append('fotos', archivo);
    });

    this.serviciosServicio.crearServicio(formData).subscribe({
      next: async (res: any) => {
        this.enviando = false;

        // El backend devuelve: { datos: { servicio, tecnicosNotificados } }
        const servicio = res.datos?.servicio || res.datos;

        if (servicio?._id) {
          await this.mostrarExito();
          this.router.navigate(['/tabs/inicio']);
        }
      },
      error: (err) => {
        this.enviando = false;
        const mensaje = err.error?.mensaje || 'Error al crear el servicio';
        this.mostrarToast(mensaje, 'danger');
        console.error('Error:', err);
      }
    });
  }

  private async mostrarExito(): Promise<void> {
    const alerta = await this.alertCtrl.create({
      header: '¡Solicitud Creada!',
      message: 'Tu solicitud de servicio ha sido publicada. Los técnicos cercanos podrán enviarte cotizaciones.',
      buttons: ['Entendido']
    });
    await alerta.present();
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

  obtenerEtiquetaTipo(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }
}
