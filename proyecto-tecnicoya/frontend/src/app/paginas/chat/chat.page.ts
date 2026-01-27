import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonFooter, IonInput, IonButton, IonIcon, IonAvatar, IonSpinner, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline, shieldCheckmarkOutline, checkmarkDoneOutline, checkmarkOutline } from 'ionicons/icons';
import { SocketServicio } from '../../servicios/socket.servicio';
import { AuthServicio } from '../../servicios/auth.servicio';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { Mensaje, Usuario } from '../../modelos';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/inicio"></ion-back-button>
        </ion-buttons>
        @if (receptor) {
          <ion-avatar slot="start" class="avatar-header">
            <img [src]="receptor.perfil?.fotoUrl || receptor.perfil?.fotoPerfil || 'assets/avatar-default.png'" alt=""/>
          </ion-avatar>
          <ion-title>
            <div class="titulo-chat">
              <div class="nombre-row">
                <span class="nombre">{{ obtenerNombreReceptor() }}</span>
                @if (esUsuarioVerificado(receptor)) {
                  <span class="badge-tecnico-verificado">
                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                    Técnico verificado
                  </span>
                }
              </div>
              @if (receptorEnLinea) {
                <span class="estado-linea">En línea</span>
              }
            </div>
          </ion-title>
        }
      </ion-toolbar>
    </ion-header>

    <ion-content #content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
        </div>
      } @else {
        <div class="mensajes-container">
          @for (mensaje of mensajes; track mensaje._id) {
            <div class="mensaje" [class.enviado]="esMio(mensaje)" [class.recibido]="!esMio(mensaje)">
              <div class="burbuja">
                <p>{{ mensaje.contenido }}</p>
                <span class="hora">{{ mensaje.createdAt | date:'HH:mm' }}</span>
                @if (esMio(mensaje)) {
                  <span class="estado-mensaje">
                    @if (mensaje.leido) {
                      <ion-icon name="checkmark-done-outline" color="primary"></ion-icon>
                    } @else {
                      <ion-icon name="checkmark-outline"></ion-icon>
                    }
                  </span>
                }
              </div>
            </div>
          }
          
          @if (escribiendo) {
            <div class="mensaje recibido">
              <div class="burbuja escribiendo">
                <div class="puntos">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </ion-content>

    <ion-footer>
      <div class="input-container">
        <ion-input
          [(ngModel)]="nuevoMensaje"
          placeholder="Escribe un mensaje..."
          (keyup.enter)="enviarMensaje()"
          (ionInput)="onEscribiendo()"
        ></ion-input>
        <ion-button fill="clear" (click)="enviarMensaje()" [disabled]="!nuevoMensaje.trim()">
          <ion-icon name="send-outline" color="primary"></ion-icon>
        </ion-button>
      </div>
    </ion-footer>
  `,
  styles: [`
    .avatar-header {
      width: 36px;
      height: 36px;
      margin-right: 8px;
    }

    .titulo-chat {
      display: flex;
      flex-direction: column;

      .nombre-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .nombre {
        font-size: 16px;
        font-weight: 600;
      }

      .badge-tecnico-verificado {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: linear-gradient(135deg, #2e7d32 0%, #4caf50 100%);
        color: white;
        font-size: 10px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 4px;

        ion-icon {
          font-size: 12px;
        }
      }

      .estado-linea {
        font-size: 11px;
        color: var(--ion-color-success);
        font-weight: normal;
      }
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 32px;
    }

    .mensajes-container {
      display: flex;
      flex-direction: column;
      padding: 16px;
      min-height: 100%;
    }

    .mensaje {
      display: flex;
      margin-bottom: 8px;
      max-width: 80%;

      &.enviado {
        align-self: flex-end;

        .burbuja {
          background: var(--ion-color-primary);
          color: white;
          border-radius: 18px 18px 4px 18px;

          .hora {
            color: rgba(255, 255, 255, 0.7);
          }
        }
      }

      &.recibido {
        align-self: flex-start;

        .burbuja {
          background: var(--ion-color-light);
          color: var(--ion-text-color);
          border-radius: 18px 18px 18px 4px;

          .hora {
            color: var(--ion-color-medium);
          }
        }
      }
    }

    .burbuja {
      padding: 10px 14px;
      position: relative;

      p {
        margin: 0;
        font-size: 15px;
        line-height: 1.4;
      }

      .hora {
        font-size: 10px;
        margin-left: 8px;
        float: right;
        margin-top: 4px;
      }

      .estado-mensaje {
        margin-left: 2px;
        
        ion-icon {
          font-size: 14px;
          vertical-align: middle;
        }
      }
    }

    .escribiendo {
      .puntos {
        display: flex;
        gap: 4px;
        padding: 4px 8px;

        span {
          width: 8px;
          height: 8px;
          background: var(--ion-color-medium);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out;

          &:nth-child(1) { animation-delay: -0.32s; }
          &:nth-child(2) { animation-delay: -0.16s; }
          &:nth-child(3) { animation-delay: 0s; }
        }
      }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    ion-footer {
      background: var(--ion-background-color);
      border-top: 1px solid var(--ion-color-light);
    }

    .input-container {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      gap: 8px;

      ion-input {
        --background: #f5f5f5;
        --color: #333;
        --placeholder-color: #888;
        --border-radius: 20px;
        --padding-start: 16px;
        --padding-end: 16px;
        flex: 1;
        color: #333 !important;
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonFooter, IonInput, IonButton, IonIcon, IonAvatar, IonSpinner, IonBadge,
    NgFor, NgIf, DatePipe, FormsModule
  ],
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild('content') content!: IonContent;

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private socketServicio = inject(SocketServicio);
  private authServicio = inject(AuthServicio);
  private usuariosServicio = inject(UsuariosServicio);

  receptorId = '';
  trabajoId = ''; // ID del trabajo si viene de detalle-trabajo
  receptor: Usuario | null = null;
  receptorEnLinea = false;
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  cargando = false;
  escribiendo = false;

  private subscriptions: Subscription[] = [];
  private escribiendoTimeout: any;

  constructor() {
    addIcons({ sendOutline, shieldCheckmarkOutline, checkmarkDoneOutline, checkmarkOutline });
  }

  ngOnInit(): void {
    this.receptorId = this.route.snapshot.paramMap.get('id') || '';
    this.trabajoId = this.route.snapshot.queryParamMap.get('trabajoId') || '';

    if (this.receptorId) {
      this.cargarReceptor();
      this.cargarMensajes();
      this.configurarSocket();
      // Unirse a la sala de chat correspondiente
      if (this.trabajoId) {
        // Si hay trabajo, unirse a sala de trabajo
        this.socketServicio.unirseChat(this.trabajoId);
      } else {
        // Chat directo sin trabajo específico
        this.socketServicio.unirseChatDirecto(this.receptorId);
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.escribiendoTimeout) {
      clearTimeout(this.escribiendoTimeout);
    }
    // Salir de la sala de trabajo si aplica
    if (this.trabajoId) {
      this.socketServicio.salirChat(this.trabajoId);
    }
  }

  cargarReceptor(): void {
    this.usuariosServicio.obtenerPerfil(this.receptorId).subscribe({
      next: (res) => {
        if (res.datos) {
          this.receptor = res.datos;
        }
      }
    });
  }

  cargarMensajes(): void {
    this.cargando = true;

    // Si hay trabajo, cargar mensajes del trabajo; sino, cargar chat directo
    const url = this.trabajoId
      ? `${environment.apiUrl}/mensajes/trabajo/${this.trabajoId}`
      : `${environment.apiUrl}/mensajes/conversacion/${this.receptorId}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.datos) {
          this.mensajes = res.datos.map((m: any) => ({
            _id: m._id,
            trabajo: m.idTrabajo || '',
            remitente: m.idEmisor?._id || m.idEmisor,
            emisor: m.idEmisor?._id || m.idEmisor,
            receptor: m.idReceptor,
            contenido: m.contenido,
            tipo: m.tipoMensaje || 'texto',
            leido: m.leido,
            fechaCreacion: m.fechaEnvio || m.fechaCreacion,
            createdAt: m.fechaEnvio || m.fechaCreacion
          }));
          this.scrollToBottom();
        }
      },
      error: () => {
        this.cargando = false;
        // Si falla, simplemente mostrar chat vacío
        this.mensajes = [];
      }
    });
  }

  configurarSocket(): void {
    const usuario = this.authServicio.obtenerUsuarioActual();
    const miId = usuario?._id;

    // Escuchar mensajes entrantes de otros usuarios
    const msgSub = this.socketServicio.escucharMensajes().subscribe((mensaje: any) => {
      // Normalizar el emisor (el servidor puede enviar 'emisor' o 'idEmisor')
      const emisorId = mensaje.emisor || mensaje.idEmisor;

      // Ignorar mensajes propios (ya se mostraron como temporales)
      if (emisorId === miId) {
        return;
      }

      // Verificar si el mensaje ya existe
      const yaExiste = this.mensajes.some(m => m._id === mensaje._id);
      if (yaExiste) {
        return;
      }

      // Agregar mensaje del receptor
      const mensajeNormalizado: Mensaje = {
        _id: mensaje._id,
        trabajo: mensaje.idTrabajo || '',
        remitente: emisorId,
        emisor: emisorId,
        receptor: mensaje.receptor || miId,
        contenido: mensaje.contenido,
        tipo: 'texto',
        leido: false,
        fechaCreacion: mensaje.createdAt || mensaje.fechaEnvio || new Date().toISOString(),
        createdAt: mensaje.createdAt || mensaje.fechaEnvio || new Date().toISOString()
      };

      this.mensajes.push(mensajeNormalizado);
      this.scrollToBottom();
      this.escribiendo = false;
    });
    this.subscriptions.push(msgSub);

    // Escuchar confirmación de mensaje enviado (para actualizar ID temporal)
    const confirmSub = this.socketServicio.escucharConfirmacionMensaje().subscribe(confirmacion => {
      // Buscar mensaje temporal y actualizar su ID
      const tempIndex = this.mensajes.findIndex(m =>
        m._id?.toString().startsWith('temp_') && m.contenido === confirmacion.contenido
      );
      if (tempIndex !== -1) {
        this.mensajes[tempIndex]._id = confirmacion._id;
      }
    });
    this.subscriptions.push(confirmSub);

    // Escuchar cuando el otro usuario está escribiendo
    const escribiendoSub = this.socketServicio.escucharEscribiendo().subscribe(data => {
      if (data.usuarioId === this.receptorId) {
        this.escribiendo = true;
        this.scrollToBottom();

        // Ocultar después de 3 segundos si no hay más eventos
        if (this.escribiendoTimeout) {
          clearTimeout(this.escribiendoTimeout);
        }
        this.escribiendoTimeout = setTimeout(() => {
          this.escribiendo = false;
        }, 3000);
      }
    });
    this.subscriptions.push(escribiendoSub);
  }

  esMio(mensaje: Mensaje): boolean {
    const usuario = this.authServicio.obtenerUsuarioActual();
    return mensaje.emisor === usuario?._id;
  }

  onEscribiendo(): void {
    this.socketServicio.emitirEscribiendo(this.receptorId);
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim()) return;

    const usuario = this.authServicio.obtenerUsuarioActual();
    if (!usuario) return;

    const contenido = this.nuevoMensaje.trim();

    // Guardar el mensaje que vamos a enviar
    const mensajeTemp: Partial<Mensaje> = {
      _id: 'temp_' + Date.now(),
      emisor: usuario._id,
      receptor: this.receptorId,
      contenido: contenido,
      tipo: 'texto',
      createdAt: new Date().toISOString()
    };

    // Agregar mensaje temporal localmente
    this.mensajes.push(mensajeTemp as Mensaje);

    // Limpiar input inmediatamente
    this.nuevoMensaje = '';
    this.scrollToBottom();

    // Enviar por socket (el servidor guardará y emitirá)
    if (this.trabajoId) {
      // Si hay trabajo, enviar al chat de trabajo
      this.socketServicio.enviarMensajeTrabajo(this.trabajoId, contenido);
    } else {
      // Chat directo
      this.socketServicio.enviarMensaje(this.receptorId, contenido);
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      this.content?.scrollToBottom(300);
    }, 100);
  }

  esUsuarioVerificado(usuario: any): boolean {
    return usuario?.datosTecnico?.membresia?.badgeVerificado === true ||
      usuario?.datosTecnico?.verificado === true;
  }

  obtenerNombreReceptor(): string {
    if (!this.receptor) return '';
    const nombre = this.receptor.perfil?.nombre || this.receptor.nombre || '';
    const apellido = this.receptor.perfil?.apellido || this.receptor.apellido || '';
    return `${nombre} ${apellido}`.trim() || 'Usuario';
  }
}
