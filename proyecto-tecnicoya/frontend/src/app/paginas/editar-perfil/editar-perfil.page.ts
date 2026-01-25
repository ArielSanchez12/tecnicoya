import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
  IonInput, IonTextarea, IonButton, IonIcon, IonAvatar, IonSpinner,
  IonList, IonSelect, IonSelectOption, IonChip, IonNote, ToastController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, cameraOutline, saveOutline, locationOutline,
  callOutline, mailOutline, closeCircle, navigateOutline
} from 'ionicons/icons';
import { AuthServicio } from '../../servicios/auth.servicio';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { GeolocalizacionServicio } from '../../servicios/geolocalizacion.servicio';
import { Usuario, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-editar-perfil',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Editar Perfil</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="guardar()" [disabled]="!formulario?.valid || guardando || cargando">
            @if (guardando) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              <ion-icon name="save-outline"></ion-icon>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="cargando-container">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Cargando datos...</p>
        </div>
      } @else if (usuario) {
        <form [formGroup]="formulario">
          <!-- Foto de perfil -->
          <div class="foto-container">
            <ion-avatar (click)="cambiarFoto()">
              <img [src]="fotoPreview || usuario.perfil?.fotoUrl || usuario.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt="Foto"/>
            </ion-avatar>
            <ion-button fill="clear" (click)="cambiarFoto()">
              <ion-icon name="camera-outline" slot="start"></ion-icon>
              Cambiar Foto
            </ion-button>
          </div>

          <!-- Información básica -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="person-outline"></ion-icon>
                Información Personal
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">Nombre *</ion-label>
                <ion-input formControlName="nombre"></ion-input>
              </ion-item>
              @if (formulario.get('nombre')?.touched && formulario.get('nombre')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El nombre es obligatorio</ion-note>
              }

              <ion-item>
                <ion-label position="stacked">Apellido *</ion-label>
                <ion-input formControlName="apellido"></ion-input>
              </ion-item>
              @if (formulario.get('apellido')?.touched && formulario.get('apellido')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El apellido es obligatorio</ion-note>
              }

              <ion-item>
                <ion-label position="stacked">Teléfono *</ion-label>
                <ion-input formControlName="telefono" type="tel"></ion-input>
              </ion-item>
              @if (formulario.get('telefono')?.touched && formulario.get('telefono')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El teléfono es obligatorio</ion-note>
              }

              <ion-item>
                <ion-label position="stacked">Dirección</ion-label>
                <ion-input formControlName="direccion" placeholder="Tu dirección"></ion-input>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Datos de técnico -->
          @if (esTecnico) {
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="construct-outline"></ion-icon>
                  Datos Profesionales
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-item>
                  <ion-label position="stacked">Descripción profesional</ion-label>
                  <ion-textarea 
                    formControlName="descripcion"
                    placeholder="Cuéntale a tus clientes sobre ti y tu experiencia..."
                    rows="4"
                  ></ion-textarea>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Especialidades</ion-label>
                  <ion-select 
                    formControlName="especialidades"
                    multiple="true"
                    placeholder="Selecciona tus especialidades"
                    interface="alert"
                  >
                    @for (tipo of tiposServicio; track tipo.valor) {
                      <ion-select-option [value]="tipo.valor">
                        {{ tipo.etiqueta }}
                      </ion-select-option>
                    }
                  </ion-select>
                </ion-item>

                <div class="especialidades-seleccionadas">
                  @for (esp of formulario.get('especialidades')?.value || []; track esp) {
                    <ion-chip>
                      <ion-label>{{ obtenerEtiquetaEspecialidad(esp) }}</ion-label>
                    </ion-chip>
                  }
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Ubicación del técnico -->
            <ion-card>
              <ion-card-header>
                <ion-card-title>
                  <ion-icon name="location-outline"></ion-icon>
                  Mi Ubicación Base
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p class="ubicacion-info">
                  Esta es tu ubicación de trabajo. Los clientes cercanos verán tus servicios.
                </p>
                
                @if (ubicacionTexto) {
                  <div class="ubicacion-actual">
                    <ion-icon name="location-outline" color="primary"></ion-icon>
                    <span>{{ ubicacionTexto }}</span>
                  </div>
                } @else {
                  <div class="ubicacion-actual sin-ubicacion">
                    <ion-icon name="location-outline" color="warning"></ion-icon>
                    <span>Sin ubicación configurada</span>
                  </div>
                }

                <ion-button 
                  expand="block" 
                  fill="outline"
                  (click)="obtenerMiUbicacion()"
                  [disabled]="obteniendoUbicacion"
                >
                  @if (obteniendoUbicacion) {
                    <ion-spinner name="crescent" slot="start"></ion-spinner>
                    Obteniendo ubicación...
                  } @else {
                    <ion-icon name="navigate-outline" slot="start"></ion-icon>
                    Usar mi ubicación actual
                  }
                </ion-button>
              </ion-card-content>
            </ion-card>

          }

          <!-- Botón guardar -->
          <div class="ion-padding">
            <ion-button 
              expand="block" 
              (click)="guardar()"
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
    .foto-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));

      ion-avatar {
        width: 120px;
        height: 120px;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        cursor: pointer;
      }

      ion-button {
        margin-top: 12px;
        --color: white;
      }
    }

    .ubicacion-info {
      color: var(--ion-color-medium);
      font-size: 14px;
      margin-bottom: 12px;
    }

    .ubicacion-actual {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 12px;

      ion-icon {
        font-size: 20px;
      }

      span {
        flex: 1;
        font-size: 14px;
      }

      &.sin-ubicacion {
        background: var(--ion-color-warning-tint);
      }
    }

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

    ion-card {
      margin: 16px;
      border-radius: 12px;

      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 18px;

        ion-icon {
          font-size: 22px;
        }
      }
    }

    .error-note {
      display: block;
      padding: 4px 16px;
      font-size: 12px;
    }

    .especialidades-seleccionadas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    ion-button[expand="block"] {
      height: 48px;
      font-size: 16px;
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
    IonInput, IonTextarea, IonButton, IonIcon, IonAvatar, IonSpinner,
    IonList, IonSelect, IonSelectOption, IonChip, IonNote,
    NgFor, NgIf, ReactiveFormsModule
  ],
})
export class EditarPerfilPage implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authServicio = inject(AuthServicio);
  private usuariosServicio = inject(UsuariosServicio);
  private geoServicio = inject(GeolocalizacionServicio);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);

  formulario!: FormGroup;
  usuario: Usuario | null = null;
  tiposServicio = TIPOS_SERVICIO;
  fotoPreview: string | null = null;
  archivoFoto: File | null = null;
  guardando = false;
  cargando = true;

  // Ubicación del técnico
  obteniendoUbicacion = false;
  ubicacionTexto: string = '';
  coordenadasTecnico: { latitud: number; longitud: number } | null = null;

  constructor() {
    addIcons({
      personOutline, cameraOutline, saveOutline, locationOutline,
      callOutline, mailOutline, closeCircle, navigateOutline
    });
  }

  ngOnInit(): void {
    // Cargar datos frescos del backend
    this.cargarDatosUsuario();
  }

  private cargarDatosUsuario(): void {
    this.cargando = true;
    this.usuariosServicio.obtenerPerfil().subscribe({
      next: (respuesta) => {
        if (respuesta.exito && respuesta.datos) {
          this.usuario = respuesta.datos;
          this.inicializarFormulario();
        } else {
          // Fallback al usuario del localStorage
          this.usuario = this.authServicio.obtenerUsuarioActual();
          this.inicializarFormulario();
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        // Fallback al usuario del localStorage
        this.usuario = this.authServicio.obtenerUsuarioActual();
        this.inicializarFormulario();
        this.cargando = false;
      }
    });
  }

  get esTecnico(): boolean {
    return this.authServicio.esTecnico();
  }

  inicializarFormulario(): void {
    // Obtener nombre, apellido y teléfono (pueden estar en la raíz o dentro de perfil)
    const nombre = this.usuario?.nombre || this.usuario?.perfil?.nombre || '';
    const apellido = this.usuario?.apellido || this.usuario?.perfil?.apellido || '';
    const telefono = this.usuario?.telefono || this.usuario?.perfil?.telefono || '';

    // Obtener dirección como texto
    const direccionTexto = this.obtenerDireccionTexto(this.usuario?.perfil?.direccion);

    // Cargar ubicación existente del técnico
    if (this.esTecnico) {
      this.cargarUbicacionExistente();
    }

    this.formulario = this.fb.group({
      nombre: [nombre, Validators.required],
      apellido: [apellido, Validators.required],
      telefono: [telefono, Validators.required],
      direccion: [direccionTexto],
      // Campos para técnicos
      descripcion: [this.usuario?.datosTecnico?.descripcion || ''],
      especialidades: [this.usuario?.datosTecnico?.especialidades || []]
    });
  }

  /**
   * Cargar ubicación existente del técnico
   */
  private cargarUbicacionExistente(): void {
    const ubicacionBase = this.usuario?.datosTecnico?.ubicacionBase;
    const coordenadas = ubicacionBase?.coordenadas;

    if (coordenadas?.coordinates?.length === 2) {
      const [lon, lat] = coordenadas.coordinates;

      // Verificar que no sean coordenadas vacías [0,0]
      if (lon !== 0 || lat !== 0) {
        this.coordenadasTecnico = { latitud: lat, longitud: lon };
        this.ubicacionTexto = ubicacionBase?.direccion || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    }
  }

  /**
   * Obtener ubicación actual del técnico usando geolocalización
   */
  async obtenerMiUbicacion(): Promise<void> {
    this.obteniendoUbicacion = true;

    try {
      const ubicacion = await this.geoServicio.obtenerUbicacionActual();

      if (ubicacion) {
        this.coordenadasTecnico = {
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud
        };

        // Intentar obtener dirección con geocodificación inversa
        try {
          const direccion = await this.obtenerDireccionDesdeCoords(ubicacion.latitud, ubicacion.longitud);
          this.ubicacionTexto = direccion || `${ubicacion.latitud.toFixed(4)}, ${ubicacion.longitud.toFixed(4)}`;
        } catch {
          this.ubicacionTexto = `${ubicacion.latitud.toFixed(4)}, ${ubicacion.longitud.toFixed(4)}`;
        }

        await this.mostrarToast('Ubicación obtenida correctamente', 'success');
      } else {
        await this.mostrarToast('No se pudo obtener tu ubicación. Verifica los permisos.', 'warning');
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      await this.mostrarToast('Error al obtener ubicación', 'danger');
    } finally {
      this.obteniendoUbicacion = false;
    }
  }

  /**
   * Geocodificación inversa usando Nominatim (OpenStreetMap)
   */
  private async obtenerDireccionDesdeCoords(lat: number, lon: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'TecnicoYa-App' }
    });

    if (!response.ok) throw new Error('Error en geocodificación');

    const data = await response.json();

    // Construir dirección legible
    const address = data.address;
    const partes = [];

    if (address.road) partes.push(address.road);
    if (address.suburb) partes.push(address.suburb);
    if (address.city || address.town || address.village) {
      partes.push(address.city || address.town || address.village);
    }

    return partes.join(', ') || data.display_name?.split(',').slice(0, 3).join(',');
  }

  // Convertir objeto dirección a texto legible
  obtenerDireccionTexto(direccion: any): string {
    if (!direccion) return '';
    if (typeof direccion === 'string') return direccion;

    // Si es un objeto Direccion, construir el texto
    const partes: string[] = [];
    if (direccion.calle) partes.push(direccion.calle);
    if (direccion.ciudad) partes.push(direccion.ciudad);
    if (direccion.estado) partes.push(direccion.estado);

    return partes.length > 0 ? partes.join(', ') : '';
  }

  async cambiarFoto(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Cambiar foto de perfil',
      buttons: [
        {
          text: 'Tomar foto',
          handler: () => this.tomarFoto()
        },
        {
          text: 'Elegir de galería',
          handler: () => this.elegirDeGaleria()
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  tomarFoto(): void {
    // En una app real, usaríamos Capacitor Camera
    this.elegirDeGaleria();
  }

  elegirDeGaleria(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const archivo = e.target.files?.[0];
      if (archivo) {
        this.archivoFoto = archivo;
        const reader = new FileReader();
        reader.onload = (ev: any) => {
          this.fotoPreview = ev.target.result;
        };
        reader.readAsDataURL(archivo);
      }
    };
    input.click();
  }

  async guardar(): Promise<void> {
    if (!this.formulario.valid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;

    // El backend espera los datos dentro de 'perfil'
    const datos: any = {
      perfil: {
        nombre: this.formulario.value.nombre,
        apellido: this.formulario.value.apellido,
        telefono: this.formulario.value.telefono,
        direccion: {
          calle: this.formulario.value.direccion || ''
        }
      }
    };

    if (this.esTecnico) {
      datos.datosTecnico = {
        descripcion: this.formulario.value.descripcion,
        especialidades: this.formulario.value.especialidades
      };

      // Incluir ubicación si se ha configurado
      if (this.coordenadasTecnico) {
        datos.datosTecnico.ubicacionBase = {
          direccion: this.ubicacionTexto,
          latitud: this.coordenadasTecnico.latitud,
          longitud: this.coordenadasTecnico.longitud
        };
      }
    }

    this.usuariosServicio.actualizarPerfil(datos).subscribe({
      next: async (res) => {
        // Actualizar el usuario en memoria y localStorage inmediatamente
        if (res.exito && res.datos) {
          this.authServicio.actualizarUsuario(res.datos);
        }

        // Subir foto si hay una nueva
        if (this.archivoFoto) {
          const formData = new FormData();
          formData.append('foto', this.archivoFoto);
          this.usuariosServicio.subirFotoPerfil(formData).subscribe({
            next: () => {
              console.log('Foto subida correctamente');
              // Recargar usuario para obtener la nueva URL de foto
              this.authServicio.cargarUsuario();
            },
            error: (err) => {
              console.error('Error al subir foto:', err);
              this.mostrarToast('Error al subir la foto', 'danger');
            }
          });
        }

        this.guardando = false;
        await this.mostrarToast('Perfil actualizado correctamente', 'success');
        this.router.navigate(['/tabs/perfil']);
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.guardando = false;
        this.mostrarToast('Error al actualizar perfil', 'danger');
      }
    });
  }

  obtenerEtiquetaEspecialidad(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
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
