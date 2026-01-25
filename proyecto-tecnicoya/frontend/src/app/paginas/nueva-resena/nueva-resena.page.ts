import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
  IonInput, IonTextarea, IonButton, IonIcon, IonSpinner, IonNote,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { starOutline, star, cameraOutline, closeCircle, addOutline, sparkles } from 'ionicons/icons';
import { ResenasServicio } from '../../servicios/resenas.servicio';
import { TrabajosServicio } from '../../servicios/trabajos.servicio';
import { Trabajo } from '../../modelos';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-nueva-resena',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Escribir Reseña</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
        </div>
      } @else if (trabajo) {
        <form [formGroup]="formulario" (ngSubmit)="enviar()">
          <!-- Info del trabajo -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Trabajo completado</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p><strong>{{ trabajo.idServicio?.titulo }}</strong></p>
              @if (tipoResena === 'cliente') {
                <p class="tecnico-nombre">
                  Cliente: {{ trabajo.idCliente?.perfil?.nombre }} {{ trabajo.idCliente?.perfil?.apellido }}
                </p>
              } @else {
                <p class="tecnico-nombre">
                  Técnico: {{ trabajo.idTecnico?.perfil?.nombre }} {{ trabajo.idTecnico?.perfil?.apellido }}
                </p>
              }
            </ion-card-content>
          </ion-card>

          <!-- Calificación -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ tipoResena === 'cliente' ? '¿Cómo calificarías al cliente?' : '¿Cómo calificarías el servicio?' }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="estrellas-container">
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <ion-icon 
                    [name]="i <= calificacion ? 'star' : 'star-outline'"
                    [class.activa]="i <= calificacion"
                    (click)="setCalificacion(i)"
                  ></ion-icon>
                }
              </div>
              <p class="calificacion-texto">{{ obtenerTextoCalificacion() }}</p>
              @if (formulario.get('calificacion')?.touched && formulario.get('calificacion')?.errors?.['min']) {
                <ion-note color="danger">Selecciona una calificación</ion-note>
              }
            </ion-card-content>
          </ion-card>

          <!-- Calificaciones detalladas -->
          @if (tipoResena !== 'cliente') {
            <ion-card>
              <ion-card-header>
                <ion-card-title>Calificaciones detalladas</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <!-- Puntualidad -->
                <div class="calificacion-detalle">
                  <span>Puntualidad</span>
                  <div class="estrellas-mini">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                      <ion-icon 
                        [name]="i <= puntualidad ? 'star' : 'star-outline'"
                        [class.activa]="i <= puntualidad"
                        (click)="puntualidad = i"
                      ></ion-icon>
                    }
                  </div>
                </div>

                <!-- Calidad -->
                <div class="calificacion-detalle">
                  <span>Calidad del trabajo</span>
                  <div class="estrellas-mini">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                      <ion-icon 
                        [name]="i <= calidadTrabajo ? 'star' : 'star-outline'"
                        [class.activa]="i <= calidadTrabajo"
                        (click)="calidadTrabajo = i"
                      ></ion-icon>
                    }
                  </div>
                </div>

                <!-- Precio justo -->
                <div class="calificacion-detalle">
                  <span>Precio justo</span>
                  <div class="estrellas-mini">
                    @for (i of [1, 2, 3, 4, 5]; track i) {
                      <ion-icon 
                        [name]="i <= precioJusto ? 'star' : 'star-outline'"
                        [class.activa]="i <= precioJusto"
                        (click)="precioJusto = i"
                      ></ion-icon>
                    }
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          }

          <!-- Comentario -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>{{ tipoResena === 'cliente' ? 'Cuéntanos sobre el cliente' : 'Cuéntanos tu experiencia' }}</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-textarea
                  formControlName="comentario"
                  [placeholder]="tipoResena === 'cliente' ? 'Describe cómo fue tu experiencia con el cliente...' : 'Describe cómo fue tu experiencia con el técnico...'"
                  rows="4"
                ></ion-textarea>
              </ion-item>
              @if (formulario.get('comentario')?.touched && formulario.get('comentario')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El comentario es obligatorio</ion-note>
              }
              @if (formulario.get('comentario')?.errors?.['minlength']) {
                <ion-note color="danger" class="error-note">Mínimo 20 caracteres</ion-note>
              }
            </ion-card-content>
          </ion-card>

          <!-- Fotos opcionales (solo para clientes reseñando técnicos) -->
          @if (tipoResena !== 'cliente') {
            <ion-card>
              <ion-card-header>
                <ion-card-title>Fotos del trabajo terminado (opcional)</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="fotos-grid">
                  @for (foto of fotosPreview; track $index) {
                    <div class="foto-item">
                      <img [src]="foto" alt="Foto"/>
                      <ion-icon 
                        name="close-circle" 
                        class="btn-eliminar"
                        (click)="eliminarFoto($index)"
                      ></ion-icon>
                    </div>
                  }
                  @if (fotosPreview.length < 3) {
                    <div class="foto-agregar" (click)="agregarFoto()">
                      <ion-icon name="add-outline"></ion-icon>
                    </div>
                  }
                </div>
              </ion-card-content>
            </ion-card>
          }

          <!-- Botón enviar -->
          <div class="ion-padding">
            <!-- Solo mostrar puntos para clientes (no técnicos) -->
            @if (tipoResena !== 'cliente') {
              <div class="puntos-info">
                <ion-icon name="sparkles"></ion-icon>
                <span>¡Ganarás <strong>+5 puntos</strong> por dejar esta reseña!</span>
              </div>
            }
            <ion-button 
              expand="block" 
              type="submit"
              [disabled]="!formulario.valid || enviando"
            >
              @if (enviando) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                Publicar Reseña
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
      justify-content: center;
      padding: 64px;
    }

    ion-card {
      margin: 16px;
      border-radius: 12px;
    }

    .tecnico-nombre {
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .estrellas-container {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 16px 0;

      ion-icon {
        font-size: 40px;
        color: #ddd;
        cursor: pointer;
        transition: transform 0.2s, color 0.2s;

        &.activa {
          color: #ffc107;
        }

        &:hover {
          transform: scale(1.1);
        }
      }
    }

    .calificacion-texto {
      text-align: center;
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .calificacion-detalle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--ion-color-light);

      &:last-child {
        border-bottom: none;
      }

      span {
        font-size: 14px;
      }

      .estrellas-mini {
        display: flex;
        gap: 4px;

        ion-icon {
          font-size: 20px;
          color: #ddd;
          cursor: pointer;

          &.activa {
            color: #ffc107;
          }
        }
      }
    }

    .error-note {
      display: block;
      padding: 4px 16px;
      font-size: 12px;
    }

    .fotos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
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
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--ion-color-medium);

      ion-icon {
        font-size: 32px;
      }

      &:active {
        background: var(--ion-color-light);
      }
    }

    ion-button[type="submit"] {
      height: 48px;
      font-size: 16px;
    }

    .puntos-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      margin-bottom: 12px;
      background: var(--ion-color-success);
      border-radius: 8px;
      color: white;
      font-size: 14px;

      ion-icon {
        font-size: 20px;
        color: white;
      }

      strong {
        color: white;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
    IonInput, IonTextarea, IonButton, IonIcon, IonSpinner, IonNote,
    NgFor, NgIf, ReactiveFormsModule
  ],
})
export class NuevaResenaPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private resenasServicio = inject(ResenasServicio);
  private trabajosServicio = inject(TrabajosServicio);
  private toastCtrl = inject(ToastController);

  formulario!: FormGroup;
  trabajo: Trabajo | null = null;
  cargando = false;
  enviando = false;
  tipoResena: 'tecnico' | 'cliente' = 'tecnico'; // tecnico = cliente califica técnico, cliente = técnico califica cliente

  calificacion = 0;
  puntualidad = 0;
  calidadTrabajo = 0;
  precioJusto = 0;

  fotosPreview: string[] = [];
  archivosSeleccionados: File[] = [];

  constructor() {
    addIcons({ starOutline, star, cameraOutline, closeCircle, addOutline, sparkles });
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      calificacion: [0, [Validators.required, Validators.min(1)]],
      comentario: ['', [Validators.required, Validators.minLength(20)]]
    });

    // Verificar si es reseña al cliente
    const tipo = this.route.snapshot.queryParamMap.get('tipo');
    if (tipo === 'cliente') {
      this.tipoResena = 'cliente';
    }

    const trabajoId = this.route.snapshot.paramMap.get('id');
    if (trabajoId) {
      this.cargarTrabajo(trabajoId);
    }
  }

  cargarTrabajo(id: string): void {
    this.cargando = true;
    this.trabajosServicio.obtenerTrabajo(id).subscribe({
      next: (res: any) => {
        this.cargando = false;
        if (res.datos) {
          // El backend devuelve { trabajo, chat } dentro de datos
          this.trabajo = res.datos.trabajo || res.datos;
        }
      },
      error: () => {
        this.cargando = false;
        this.mostrarToast('Error al cargar información', 'danger');
      }
    });
  }

  setCalificacion(valor: number): void {
    this.calificacion = valor;
    this.formulario.patchValue({ calificacion: valor });
    this.formulario.get('calificacion')?.markAsTouched();
  }

  obtenerTextoCalificacion(): string {
    const textos = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
    return textos[this.calificacion] || 'Toca las estrellas para calificar';
  }

  agregarFoto(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => this.onFotoSeleccionada(e);
    input.click();
  }

  onFotoSeleccionada(event: any): void {
    const archivo = event.target.files?.[0];
    if (!archivo || this.fotosPreview.length >= 3) return;

    this.archivosSeleccionados.push(archivo);

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.fotosPreview.push(e.target.result);
    };
    reader.readAsDataURL(archivo);
  }

  eliminarFoto(index: number): void {
    this.fotosPreview.splice(index, 1);
    this.archivosSeleccionados.splice(index, 1);
  }

  enviar(): void {
    if (!this.formulario.valid || !this.trabajo) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando = true;

    // Usar any para acceder a las propiedades que pueden ser populadas
    const trabajoData = this.trabajo as any;

    // Construir objeto con los campos que espera el backend
    const datos: any = {
      trabajo: trabajoData._id,
      calificacion: this.calificacion,
      comentario: this.formulario.value.comentario,
      tipoResena: this.tipoResena // 'tecnico' o 'cliente'
    };

    // Solo agregar aspectos si es reseña al técnico
    if (this.tipoResena !== 'cliente') {
      datos.aspectos = {
        puntualidad: this.puntualidad || this.calificacion,
        calidad: this.calidadTrabajo || this.calificacion,
        precioJusto: this.precioJusto || this.calificacion
      };
    }

    console.log('📊 Enviando reseña:', datos);

    this.resenasServicio.crearResena(datos).subscribe({
      next: async (res) => {
        this.enviando = false;
        const mensaje = this.tipoResena === 'cliente'
          ? '¡Gracias por calificar al cliente!'
          : '¡Gracias por tu reseña!';
        await this.mostrarToast(mensaje, 'success');
        this.router.navigate(['/tabs/inicio']);
      },
      error: () => {
        this.enviando = false;
        this.mostrarToast('Error al publicar reseña', 'danger');
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
