import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonAvatar, IonIcon, IonButton,
  IonList, IonItem, IonLabel, IonBadge, IonChip, IonToggle,
  IonRefresher, IonRefresherContent, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, callOutline, locationOutline,
  settingsOutline, logOutOutline, starOutline, star,
  briefcaseOutline, shieldCheckmarkOutline, timeOutline,
  ribbonOutline, createOutline, cameraOutline, chevronForward,
  flashOutline, heartOutline, helpCircleOutline, documentTextOutline,
  diamondOutline, cashOutline, walletOutline
} from 'ionicons/icons';
import { AuthServicio } from '../../servicios/auth.servicio';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { FidelizacionServicio } from '../../servicios/fidelizacion.servicio';
import { TrabajosServicio } from '../../servicios/trabajos.servicio';
import { Usuario, NIVELES_LEALTAD, TIPOS_SERVICIO } from '../../modelos';
import { NgFor, NgIf, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Mi Perfil</ion-title>
        <ion-button slot="end" fill="clear" (click)="editarPerfil()">
          <ion-icon name="create-outline"></ion-icon>
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (usuario) {
        <!-- Cabecera del perfil -->
        <div class="perfil-header">
          <div class="avatar-container" (click)="cambiarFoto()">
            <ion-avatar>
              <img [src]="usuario.perfil?.fotoUrl || usuario.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt="Foto de perfil"/>
            </ion-avatar>
            <div class="camera-overlay">
              <ion-icon name="camera-outline"></ion-icon>
            </div>
          </div>
          <h2>{{ usuario.nombre }} {{ usuario.apellido }}</h2>
          <p class="rol">{{ usuario.rol === 'tecnico' ? 'Técnico' : 'Cliente' }}</p>
          
          @if (esTecnico && usuario.datosTecnico?.verificado) {
            <ion-chip color="success">
              <ion-icon name="shield-checkmark-outline"></ion-icon>
              <ion-label>Verificado</ion-label>
            </ion-chip>
          }
        </div>

        <!-- Programa de fidelización (solo para clientes) -->
        @if (fidelizacion && !esTecnico) {
          <ion-card class="tarjeta-fidelizacion" (click)="verFidelizacion()">
            <ion-card-content>
              <div class="fidelizacion-content">
                <div class="nivel-info">
                  <ion-icon name="ribbon-outline" [style.color]="obtenerColorNivel()"></ion-icon>
                  <div>
                    <h4>{{ obtenerNombreNivel() }}</h4>
                    <p>{{ fidelizacion.puntos }} puntos</p>
                  </div>
                </div>
                <ion-icon name="chevron-forward" color="medium"></ion-icon>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Estadísticas para técnicos -->
        @if (esTecnico) {
          <ion-card class="tarjeta-estadisticas">
            <ion-card-header>
              <ion-card-title>Mis Estadísticas</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="estadisticas-grid estadisticas-3col">
                <div class="stat-item">
                  <div class="stat-value">
                    <ion-icon name="star" color="warning"></ion-icon>
                    {{ usuario.datosTecnico?.calificacionPromedio || usuario.datosTecnico?.calificacion | number:'1.1-1' }}
                  </div>
                  <div class="stat-label">Calificación</div>
                </div>
                <div class="stat-item fondos-item">
                  <div class="stat-value fondos-valor">
                    <ion-icon name="cash-outline" color="success"></ion-icon>
                    \${{ usuario.datosTecnico?.fondos?.disponible || 0 | number:'1.2-2' }}
                  </div>
                  <div class="stat-label">Fondos</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ usuario.datosTecnico?.trabajosCompletados || 0 }}</div>
                  <div class="stat-label">Trabajos</div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Disponibilidad -->
          <ion-card class="tarjeta-disponibilidad">
            <ion-card-header>
              <ion-card-title>Disponibilidad</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <ion-item lines="none">
                <ion-icon name="time-outline" slot="start"></ion-icon>
                <ion-label>Disponible ahora</ion-label>
                <ion-toggle 
                  [(ngModel)]="disponibleAhora"
                  (ngModelChange)="toggleDisponibilidad($event)"
                ></ion-toggle>
              </ion-item>
              <ion-item lines="none">
                <ion-icon name="flash-outline" slot="start"></ion-icon>
                <ion-label>Servicio 24/7 emergencias</ion-label>
                <ion-toggle 
                  [(ngModel)]="emergencia24h"
                  (ngModelChange)="toggleEmergencia($event)"
                ></ion-toggle>
              </ion-item>
            </ion-card-content>
          </ion-card>

          <!-- Especialidades -->
          <ion-card>
            <ion-card-header>
              <ion-card-title>Especialidades</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="especialidades">
                @for (esp of usuario.datosTecnico?.especialidades; track esp) {
                  <ion-chip>
                    <ion-label>{{ obtenerEtiquetaEspecialidad(esp) }}</ion-label>
                  </ion-chip>
                }
              </div>
            </ion-card-content>
          </ion-card>
        }

        <!-- Información de contacto -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Información de contacto</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-icon name="mail-outline" slot="start" color="primary"></ion-icon>
                <ion-label>{{ usuario.email }}</ion-label>
              </ion-item>
              <ion-item>
                <ion-icon name="call-outline" slot="start" color="primary"></ion-icon>
                <ion-label>{{ usuario.perfil?.telefono || usuario.telefono || 'No registrado' }}</ion-label>
              </ion-item>
              @if (usuario.perfil?.direccion) {
                <ion-item>
                  <ion-icon name="location-outline" slot="start" color="primary"></ion-icon>
                  <ion-label class="ion-text-wrap">{{ obtenerDireccionTexto(usuario.perfil?.direccion) }}</ion-label>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Menú de opciones -->
        <ion-list class="menu-opciones">
          <ion-item button detail (click)="verMisServicios()">
            <ion-icon name="briefcase-outline" slot="start" color="primary"></ion-icon>
            <ion-label>{{ esTecnico ? 'Mis Trabajos' : 'Mis Servicios' }}</ion-label>
          </ion-item>
          <ion-item button detail (click)="verResenas()">
            <ion-icon name="star-outline" slot="start" color="primary"></ion-icon>
            <ion-label>Mis Reseñas</ion-label>
          </ion-item>
          @if (esTecnico) {
            <ion-item button detail (click)="verMembresias()">
              <ion-icon name="diamond-outline" slot="start" color="warning"></ion-icon>
              <ion-label>
                Membresías
                @if (usuario?.datosTecnico?.membresia?.tipo && usuario?.datosTecnico?.membresia?.tipo !== 'basico') {
                  <ion-badge color="warning" style="margin-left: 8px;">
                    {{ usuario?.datosTecnico?.membresia?.tipo | titlecase }}
                  </ion-badge>
                }
              </ion-label>
            </ion-item>
            <ion-item button detail (click)="retirarFondos()">
              <ion-icon name="wallet-outline" slot="start" color="success"></ion-icon>
              <ion-label>
                Retirar Fondos
                @if (usuario?.datosTecnico?.fondos?.disponible && usuario?.datosTecnico?.fondos?.disponible > 0) {
                  <ion-badge color="success" style="margin-left: 8px;">
                    \${{ usuario?.datosTecnico?.fondos?.disponible | number:'1.2-2' }}
                  </ion-badge>
                }
              </ion-label>
            </ion-item>
          }
          @if (!esTecnico) {
            <ion-item button detail (click)="verFidelizacion()">
              <ion-icon name="heart-outline" slot="start" color="primary"></ion-icon>
              <ion-label>Programa de Fidelización</ion-label>
            </ion-item>
          }
          <ion-item button detail (click)="verAyuda()">
            <ion-icon name="help-circle-outline" slot="start" color="primary"></ion-icon>
            <ion-label>Ayuda y Soporte</ion-label>
          </ion-item>
          <ion-item button detail (click)="verTerminos()">
            <ion-icon name="document-text-outline" slot="start" color="primary"></ion-icon>
            <ion-label>Términos y Condiciones</ion-label>
          </ion-item>
          <ion-item button detail (click)="abrirConfiguracion()">
            <ion-icon name="settings-outline" slot="start" color="primary"></ion-icon>
            <ion-label>Configuración</ion-label>
          </ion-item>
          <ion-item button (click)="cerrarSesion()" class="cerrar-sesion">
            <ion-icon name="log-out-outline" slot="start" color="danger"></ion-icon>
            <ion-label color="danger">Cerrar Sesión</ion-label>
          </ion-item>
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .perfil-header {
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
      color: white;
      padding: 32px 16px;
      text-align: center;

      .avatar-container {
        position: relative;
        display: inline-block;
        margin-bottom: 16px;

        ion-avatar {
          width: 100px;
          height: 100px;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .camera-overlay {
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--ion-color-secondary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;

          ion-icon {
            font-size: 18px;
          }
        }
      }

      h2 {
        margin: 0 0 4px;
        font-size: 24px;
        font-weight: 600;
      }

      .rol {
        margin: 0 0 12px;
        opacity: 0.9;
        font-size: 14px;
      }
    }

    .tarjeta-fidelizacion {
      margin: 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      cursor: pointer;

      ion-card-content {
        color: white;
      }

      .fidelizacion-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .nivel-info {
        display: flex;
        align-items: center;
        gap: 12px;

        ion-icon {
          font-size: 40px;
        }

        h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        p {
          margin: 4px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
      }
    }

    .tarjeta-estadisticas {
      margin: 16px;
      border-radius: 12px;

      .estadisticas-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        text-align: center;

        &.estadisticas-3col {
          grid-template-columns: repeat(3, 1fr);
        }

        .stat-item {
          padding: 8px;

          .stat-value {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            font-size: 20px;
            font-weight: 700;
            color: var(--ion-color-primary);
          }

          &.fondos-item .stat-value {
            color: var(--ion-color-success);
            font-size: 16px;
          }

          .stat-label {
            font-size: 12px;
            color: var(--ion-color-medium);
            margin-top: 4px;
          }
        }
      }
    }

    .tarjeta-disponibilidad {
      margin: 16px;
      border-radius: 12px;

      ion-item {
        --padding-start: 0;
        --inner-padding-end: 0;
      }
    }

    .especialidades {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    ion-card {
      margin: 16px;
      border-radius: 12px;
    }

    .menu-opciones {
      margin: 16px;
      border-radius: 12px;
      overflow: hidden;

      ion-item {
        --padding-start: 16px;
      }

      .cerrar-sesion {
        --background: transparent;
        margin-top: 8px;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonAvatar, IonIcon, IonButton,
    IonList, IonItem, IonLabel, IonBadge, IonChip, IonToggle,
    IonRefresher, IonRefresherContent,
    NgFor, NgIf, DecimalPipe, TitleCasePipe, FormsModule
  ],
})
export class PerfilPage implements OnInit {
  private router = inject(Router);
  private authServicio = inject(AuthServicio);
  private usuariosServicio = inject(UsuariosServicio);
  private fidelizacionServicio = inject(FidelizacionServicio);
  private trabajosServicio = inject(TrabajosServicio);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  
  tieneTrabajoActivo = false;

  usuario: Usuario | null = null;
  fidelizacion: any = null;
  disponibleAhora = false;
  emergencia24h = false;
  private actualizando = false;

  constructor() {
    addIcons({
      personOutline, mailOutline, callOutline, locationOutline,
      settingsOutline, logOutOutline, starOutline, star,
      briefcaseOutline, shieldCheckmarkOutline, timeOutline,
      ribbonOutline, createOutline, cameraOutline, chevronForward,
      flashOutline, heartOutline, helpCircleOutline, documentTextOutline,
      diamondOutline, cashOutline, walletOutline
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Recargar datos cada vez que se muestra la página
  ionViewWillEnter(): void {
    // Forzar actualización del usuario desde localStorage
    const usuarioGuardado = localStorage.getItem('tecnicoya_usuario');
    if (usuarioGuardado) {
      try {
        this.usuario = JSON.parse(usuarioGuardado);
        // Sincronizar valores de toggles
        if (this.usuario?.datosTecnico) {
          this.disponibleAhora = this.usuario.datosTecnico.disponibleAhora || false;
          this.emergencia24h = this.usuario.datosTecnico.emergencia24h || false;
        }
      } catch (e) {
        console.error('Error parsing usuario:', e);
      }
    }
    // Verificar trabajos activos cada vez que se muestra la página
    this.verificarTrabajosActivos();
  }

  get esTecnico(): boolean {
    return this.authServicio.esTecnico();
  }

  cargarDatos(): void {
    this.authServicio.usuarioActual$.subscribe(usuario => {
      this.usuario = usuario;
      // Sincronizar valores de toggles
      if (usuario?.datosTecnico) {
        this.disponibleAhora = usuario.datosTecnico.disponibleAhora || false;
        this.emergencia24h = usuario.datosTecnico.emergencia24h || false;
      }
    });

    this.fidelizacionServicio.obtenerMiFidelizacion().subscribe({
      next: (res) => {
        if (res.datos) {
          this.fidelizacion = res.datos;
        }
      }
    });
    
    // Verificar si tiene trabajos activos
    this.verificarTrabajosActivos();
  }
  
  private verificarTrabajosActivos(): void {
    if (!this.esTecnico) return;
    
    this.trabajosServicio.obtenerMisTrabajos({ estado: 'en_progreso' }).subscribe({
      next: (res) => {
        const trabajosEnProgreso = res.datos || [];
        this.tieneTrabajoActivo = trabajosEnProgreso.length > 0;
        console.log('🔧 Trabajos activos:', trabajosEnProgreso.length, 'tiene activo:', this.tieneTrabajoActivo);
      },
      error: () => {
        this.tieneTrabajoActivo = false;
      }
    });
  }

  async refrescar(event: any): Promise<void> {
    this.authServicio.cargarUsuario();
    this.cargarDatos();
    setTimeout(() => event.target.complete(), 1000);
  }

  cambiarFoto(): void {
    this.router.navigate(['/editar-perfil'], { queryParams: { modo: 'foto' } });
  }

  editarPerfil(): void {
    this.router.navigate(['/editar-perfil']);
  }

  async toggleDisponibilidad(disponible: boolean): Promise<void> {
    if (this.actualizando) return;
    
    // Si intenta desactivar, verificar si tiene trabajos activos
    if (!disponible && this.tieneTrabajoActivo) {
      const alert = await this.alertCtrl.create({
        header: 'No puedes desactivarte',
        message: 'Tienes trabajos activos en progreso. Finaliza todos tus trabajos antes de desactivar tu disponibilidad.',
        buttons: ['Entendido']
      });
      await alert.present();
      // Revertir el toggle
      this.disponibleAhora = true;
      return;
    }
    
    this.actualizando = true;

    this.usuariosServicio.actualizarPerfil({
      datosTecnico: { disponibleAhora: disponible }
    }).subscribe({
      next: (res) => {
        this.mostrarToast(disponible ? 'Ahora estás disponible para nuevos trabajos' : 'Ya no recibirás nuevos trabajos');
        if (this.usuario?.datosTecnico) {
          this.usuario.datosTecnico.disponibleAhora = disponible;
        }
        this.actualizando = false;
      },
      error: () => {
        this.mostrarToast('Error al actualizar disponibilidad', 'danger');
        // Revertir el toggle
        this.disponibleAhora = !disponible;
        this.actualizando = false;
      }
    });
  }

  toggleEmergencia(emergencia: boolean): void {
    if (this.actualizando) return;
    this.actualizando = true;

    this.usuariosServicio.actualizarPerfil({
      datosTecnico: { emergencia24h: emergencia }
    }).subscribe({
      next: (res) => {
        this.mostrarToast(emergencia ? 'Servicio 24/7 activado' : 'Servicio 24/7 desactivado');
        if (this.usuario?.datosTecnico) {
          this.usuario.datosTecnico.emergencia24h = emergencia;
        }
        this.actualizando = false;
      },
      error: () => {
        this.mostrarToast('Error al actualizar configuración', 'danger');
        // Revertir el toggle
        this.emergencia24h = !emergencia;
        this.actualizando = false;
      }
    });
  }

  obtenerEtiquetaEspecialidad(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  obtenerNombreNivel(): string {
    if (!this.fidelizacion) return '';
    const nivel = NIVELES_LEALTAD.find(n => n.nivel === this.fidelizacion.nivel);
    return nivel?.nombre || this.fidelizacion.nivel;
  }

  obtenerColorNivel(): string {
    if (!this.fidelizacion) return '#CD7F32';
    const nivel = NIVELES_LEALTAD.find(n => n.nivel === this.fidelizacion.nivel);
    return nivel?.color || '#CD7F32';
  }

  obtenerDireccionTexto(direccion: any): string {
    if (!direccion) return 'Sin dirección';
    if (typeof direccion === 'string') return direccion;

    // Si es un objeto Direccion, construir el texto
    const partes: string[] = [];
    if (direccion.calle) partes.push(direccion.calle);
    if (direccion.ciudad) partes.push(direccion.ciudad);
    if (direccion.estado) partes.push(direccion.estado);
    if (direccion.referencia) partes.push(`(${direccion.referencia})`);

    return partes.length > 0 ? partes.join(', ') : 'Sin dirección';
  }

  verMisServicios(): void {
    this.router.navigate([this.esTecnico ? '/mis-trabajos' : '/mis-servicios']);
  }

  verResenas(): void {
    this.router.navigate(['/mis-resenas']);
  }

  verMembresias(): void {
    this.router.navigate(['/membresias']);
  }

  retirarFondos(): void {
    this.router.navigate(['/retirar-fondos']);
  }

  verFidelizacion(): void {
    this.router.navigate(['/fidelizacion']);
  }

  verAyuda(): void {
    this.router.navigate(['/ayuda']);
  }

  verTerminos(): void {
    this.router.navigate(['/terminos']);
  }

  abrirConfiguracion(): void {
    this.router.navigate(['/configuracion']);
  }

  async cerrarSesion(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar Sesión',
          role: 'destructive',
          handler: () => {
            this.authServicio.logout();
            this.router.navigate(['/bienvenida']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarToast(mensaje: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
