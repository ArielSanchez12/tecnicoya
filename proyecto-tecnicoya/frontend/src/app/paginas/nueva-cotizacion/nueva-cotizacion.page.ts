import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
  IonInput, IonTextarea, IonButton, IonIcon, IonSpinner, IonNote,
  IonList, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline, timeOutline, documentTextOutline, addCircleOutline,
  trashOutline, checkmarkCircle, shieldCheckmarkOutline, locationOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { CotizacionesServicio } from '../../servicios/cotizaciones.servicio';
import { ServiciosServicio } from '../../servicios/servicios.servicio';
import { Servicio } from '../../modelos';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';

interface ItemCotizacion {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

@Component({
  selector: 'app-nueva-cotizacion',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/buscar"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ modoEdicion ? 'Editar Cotización' : 'Nueva Cotización' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
        </div>
      } @else if (servicio) {
        <!-- Aviso de edición -->
        @if (modoEdicion) {
          <ion-card class="aviso-edicion">
            <ion-card-content>
              <ion-icon name="alert-circle-outline" color="warning"></ion-icon>
              <div>
                <strong>Editando cotización</strong>
                <p>Si guardas los cambios, el cliente será notificado para que revise la nueva cotización.</p>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Info del servicio -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Servicio Solicitado</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <h3>{{ servicio.titulo }}</h3>
            <p class="descripcion">{{ servicio.descripcion }}</p>
            <p class="ubicacion">
              <ion-icon name="location-outline"></ion-icon>
              {{ obtenerUbicacionTexto() }}
            </p>
          </ion-card-content>
        </ion-card>

        <form [formGroup]="formulario" (ngSubmit)="enviar()">
          <!-- Descripción de la cotización -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="document-text-outline"></ion-icon>
                Descripción del trabajo
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-textarea
                  formControlName="descripcion"
                  placeholder="Describe qué trabajo realizarás y cómo lo harás..."
                  rows="4"
                ></ion-textarea>
              </ion-item>
              @if (formulario.get('descripcion')?.touched && formulario.get('descripcion')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">La descripción es obligatoria</ion-note>
              }
            </ion-card-content>
          </ion-card>

          <!-- Desglose de costos -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="cash-outline"></ion-icon>
                Desglose de costos
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              @for (item of items; track $index) {
                <div class="item-cotizacion">
                  <div class="item-header">
                    <span class="item-numero">#{{ $index + 1 }}</span>
                    <ion-button fill="clear" size="small" color="danger" (click)="eliminarItem($index)">
                      <ion-icon name="trash-outline"></ion-icon>
                    </ion-button>
                  </div>
                  <ion-item>
                    <ion-label position="stacked">Concepto</ion-label>
                    <ion-input 
                      [(ngModel)]="item.concepto" 
                      [ngModelOptions]="{standalone: true}"
                      placeholder="Ej: Mano de obra, Material, etc."
                    ></ion-input>
                  </ion-item>
                  <div class="item-numeros">
                    <ion-item>
                      <ion-label position="stacked">Cantidad</ion-label>
                      <ion-input 
                        type="number" 
                        [(ngModel)]="item.cantidad"
                        [ngModelOptions]="{standalone: true}"
                        (ionInput)="calcularTotalItem($index)"
                        min="1"
                      ></ion-input>
                    </ion-item>
                    <ion-item>
                      <ion-label position="stacked">Precio Unit.</ion-label>
                      <ion-input 
                        type="number" 
                        [(ngModel)]="item.precioUnitario"
                        [ngModelOptions]="{standalone: true}"
                        (ionInput)="calcularTotalItem($index)"
                        min="0"
                      ></ion-input>
                    </ion-item>
                  </div>
                  <div class="item-total">
                    <span>Subtotal:</span>
                    <strong>{{ item.total | currency:'USD':'symbol':'1.2-2' }}</strong>
                  </div>
                </div>
              }

              <ion-button fill="outline" expand="block" (click)="agregarItem()">
                <ion-icon name="add-circle-outline" slot="start"></ion-icon>
                Agregar Concepto
              </ion-button>

              <!-- Total -->
              <div class="total-cotizacion">
                <span>TOTAL:</span>
                <strong>{{ calcularTotal() | currency:'USD':'symbol':'1.2-2' }}</strong>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Tiempo estimado -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="time-outline"></ion-icon>
                Tiempo estimado
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-label position="stacked">Duración del trabajo</ion-label>
                <ion-input 
                  formControlName="tiempoEstimado"
                  placeholder="Ej: 2 horas, 1 día, etc."
                ></ion-input>
              </ion-item>
              @if (formulario.get('tiempoEstimado')?.touched && formulario.get('tiempoEstimado')?.errors?.['required']) {
                <ion-note color="danger" class="error-note">El tiempo estimado es obligatorio</ion-note>
              }
            </ion-card-content>
          </ion-card>

          <!-- Garantía -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>
                <ion-icon name="shield-checkmark-outline"></ion-icon>
                Garantía (opcional)
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item>
                <ion-textarea
                  formControlName="garantia"
                  placeholder="Describe la garantía que ofreces por tu trabajo..."
                  rows="2"
                ></ion-textarea>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Botón enviar -->
          <div class="ion-padding">
            <ion-button 
              expand="block" 
              type="submit"
              [color]="modoEdicion ? 'success' : 'primary'"
              [disabled]="!formulario.valid || items.length === 0 || enviando"
            >
              @if (enviando) {
                <ion-spinner name="crescent"></ion-spinner>
              } @else {
                <ion-icon name="checkmark-circle" slot="start"></ion-icon>
                {{ modoEdicion ? 'Guardar Cambios' : 'Enviar Cotización' }}
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

    .aviso-edicion {
      margin: 16px;
      border-radius: 12px;
      background: var(--ion-color-warning-tint);
      
      ion-card-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        
        ion-icon {
          font-size: 28px;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        strong {
          display: block;
          margin-bottom: 4px;
          color: var(--ion-color-warning-shade);
        }
        
        p {
          margin: 0;
          font-size: 14px;
          color: var(--ion-color-dark);
        }
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

    .descripcion {
      color: var(--ion-color-medium);
      margin: 8px 0;
    }

    .ubicacion {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ion-color-medium);
      font-size: 14px;

      ion-icon {
        font-size: 16px;
      }
    }

    .error-note {
      display: block;
      padding: 4px 16px;
      font-size: 12px;
    }

    .item-cotizacion {
      padding: 16px;
      background: var(--ion-background-color-step-100, rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.05));
      border-radius: 12px;
      margin-bottom: 12px;
      border: 1px solid var(--ion-border-color, rgba(var(--ion-text-color-rgb, 0, 0, 0), 0.1));

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .item-numero {
          font-weight: 600;
          color: var(--ion-color-primary);
        }
      }

      .item-numeros {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .item-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--ion-color-medium-tint);

        strong {
          color: var(--ion-color-primary);
        }
      }
    }

    .total-cotizacion {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      padding: 16px;
      background: var(--ion-color-primary);
      border-radius: 12px;
      color: white;

      span {
        font-size: 16px;
      }

      strong {
        font-size: 24px;
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
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
    IonInput, IonTextarea, IonButton, IonIcon, IonSpinner, IonNote, IonList,
    NgFor, NgIf, CurrencyPipe, ReactiveFormsModule, FormsModule
  ],
})
export class NuevaCotizacionPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cotizacionesServicio = inject(CotizacionesServicio);
  private serviciosServicio = inject(ServiciosServicio);
  private toastCtrl = inject(ToastController);

  formulario!: FormGroup;
  servicio: Servicio | null = null;
  items: ItemCotizacion[] = [];
  cargando = false;
  enviando = false;

  // Modo edición
  modoEdicion = false;
  cotizacionId: string | null = null;

  constructor() {
    addIcons({
      cashOutline, timeOutline, documentTextOutline, addCircleOutline,
      trashOutline, checkmarkCircle, shieldCheckmarkOutline, locationOutline,
      alertCircleOutline
    });
  }

  ngOnInit(): void {
    this.formulario = this.fb.group({
      descripcion: ['', Validators.required],
      tiempoEstimado: ['', Validators.required],
      garantia: ['']
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    const rutaActual = this.route.snapshot.url[0]?.path || '';
    const editarQueryParam = this.route.snapshot.queryParamMap.get('editar');

    // Verificar si es modo edición por ruta o por queryParam
    if (rutaActual === 'editar-cotizacion') {
      this.modoEdicion = true;
      this.cotizacionId = idParam;
      this.cargarCotizacionPorId(idParam!);
    } else if (editarQueryParam) {
      // Modo edición desde queryParam: idParam es servicioId, editar es cotizacionId
      this.modoEdicion = true;
      this.cotizacionId = editarQueryParam;
      this.cargarCotizacionPorId(editarQueryParam);
    } else {
      // Nueva cotización - el id es el servicioId
      this.cargarServicio(idParam!);
      this.agregarItem();
    }
  }

  cargarCotizacionPorId(cotizacionId: string): void {
    // Primero obtener la cotización para saber el servicio
    this.cargando = true;
    // Usar el endpoint de mis cotizaciones para buscar por ID
    this.cotizacionesServicio.obtenerMisCotizaciones({ limite: 100 }).subscribe({
      next: (res: any) => {
        const cotizaciones = res.datos?.cotizaciones || res.datos || [];
        const cotizacion = cotizaciones.find((c: any) => c._id === cotizacionId);

        if (cotizacion) {
          const servicioId = cotizacion.idServicio?._id || cotizacion.idServicio;
          this.cargarServicio(servicioId);
          this.cargarCotizacionDatos(cotizacion);
        } else {
          this.cargando = false;
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  cargarCotizacionDatos(cot: any): void {
    // Llenar formulario con datos existentes
    this.formulario.patchValue({
      descripcion: cot.descripcionTrabajo || cot.descripcion || '',
      tiempoEstimado: cot.tiempoEstimado
        ? `${cot.tiempoEstimado.valor} ${cot.tiempoEstimado.unidad}`
        : '',
      garantia: cot.notasAdicionales || ''
    });

    // Llenar items/desglose
    if (cot.materiales && cot.materiales.length > 0) {
      this.items = cot.materiales.map((m: any) => ({
        concepto: m.nombre || m.concepto,
        cantidad: m.cantidad || 1,
        precioUnitario: m.precioUnitario || 0,
        total: (m.cantidad || 1) * (m.precioUnitario || 0)
      }));
    } else if (cot.desglose && cot.desglose.length > 0) {
      this.items = cot.desglose.map((d: any) => ({
        concepto: d.concepto,
        cantidad: d.cantidad,
        precioUnitario: d.precioUnitario,
        total: d.cantidad * d.precioUnitario
      }));
    } else {
      // Si no hay materiales ni desglose, crear item con el precio total
      this.items = [{
        concepto: 'Servicio',
        cantidad: 1,
        precioUnitario: cot.precio || cot.montoTotal || 0,
        total: cot.precio || cot.montoTotal || 0
      }];
    }
  }

  cargarServicio(id: string): void {
    this.cargando = true;
    this.serviciosServicio.obtenerServicio(id).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.datos) {
          const datos = res.datos as any;
          this.servicio = datos.servicio || datos;
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  obtenerUbicacionTexto(): string {
    if (!this.servicio?.ubicacion) return 'Sin ubicación';
    const ub = this.servicio.ubicacion as any;
    if (typeof ub === 'string') return ub;
    return ub.direccion || ub.ciudad || 'Sin ubicación';
  }

  agregarItem(): void {
    this.items.push({
      concepto: '',
      cantidad: 1,
      precioUnitario: 0,
      total: 0
    });
  }

  eliminarItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }
  }

  calcularTotalItem(index: number): void {
    const item = this.items[index];
    item.total = item.cantidad * item.precioUnitario;
  }

  calcularTotal(): number {
    return this.items.reduce((sum, item) => sum + item.total, 0);
  }

  enviar(): void {
    if (!this.formulario.valid || !this.servicio || this.items.length === 0) {
      this.formulario.markAllAsTouched();
      return;
    }

    const itemsValidos = this.items.filter(i => i.concepto && i.cantidad > 0 && i.precioUnitario > 0);
    if (itemsValidos.length === 0) {
      this.mostrarToast('Agrega al menos un concepto con precio', 'warning');
      return;
    }

    this.enviando = true;

    const datos = {
      servicio: this.servicio._id,
      descripcion: this.formulario.value.descripcion,
      tiempoEstimado: this.formulario.value.tiempoEstimado,
      garantia: this.formulario.value.garantia || undefined,
      desglose: itemsValidos.map(item => ({
        concepto: item.concepto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.total
      })),
      montoTotal: this.calcularTotal()
    };

    if (this.modoEdicion && this.cotizacionId) {
      this.cotizacionesServicio.editarCotizacion(this.cotizacionId, datos).subscribe({
        next: async () => {
          this.enviando = false;
          await this.mostrarToast('¡Cotización actualizada! El cliente ha sido notificado.', 'success');
          this.router.navigate(['/tabs/inicio']);
        },
        error: (err) => {
          this.enviando = false;
          const mensaje = err.error?.mensaje || 'Error al actualizar cotización';
          this.mostrarToast(mensaje, 'danger');
        }
      });
    } else {
      this.cotizacionesServicio.crearCotizacion(datos).subscribe({
        next: async () => {
          this.enviando = false;
          await this.mostrarToast('¡Cotización enviada exitosamente!', 'success');
          this.router.navigate(['/tabs/buscar']);
        },
        error: () => {
          this.enviando = false;
          this.mostrarToast('Error al enviar cotización', 'danger');
        }
      });
    }
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
