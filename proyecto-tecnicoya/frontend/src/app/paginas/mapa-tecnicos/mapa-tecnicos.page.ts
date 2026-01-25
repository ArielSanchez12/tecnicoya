import { Component, inject, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonChip, IonLabel, IonBadge,
  IonFab, IonFabButton, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locateOutline, filterOutline, starOutline, star,
  locationOutline, shieldCheckmarkOutline, flashOutline, listOutline
} from 'ionicons/icons';
import { UsuariosServicio } from '../../servicios/usuarios.servicio';
import { GeolocalizacionServicio } from '../../servicios/geolocalizacion.servicio';
import { Usuario, TIPOS_SERVICIO, TipoServicio } from '../../modelos';
import { NgFor, NgIf, DecimalPipe } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa-tecnicos',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/buscar"></ion-back-button>
        </ion-buttons>
        <ion-title>Técnicos Cercanos</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="toggleVista()">
            <ion-icon [name]="vistaLista ? 'map-outline' : 'list-outline'"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (cargando) {
        <div class="loading-container">
          <ion-spinner></ion-spinner>
          <p>Buscando técnicos cercanos...</p>
        </div>
      } @else {
        @if (!vistaLista) {
          <!-- Vista de mapa -->
          <div #mapaContainer id="mapa" class="mapa-container"></div>

          <!-- Tarjeta de técnico seleccionado -->
          @if (tecnicoSeleccionado) {
            <ion-card class="tarjeta-tecnico-flotante" (click)="verTecnico(tecnicoSeleccionado._id)">
              <ion-card-content>
                <div class="tecnico-header">
                  <img 
                    [src]="tecnicoSeleccionado.perfil?.fotoUrl || tecnicoSeleccionado.perfil?.fotoPerfil || 'assets/avatar-default.png'" 
                    alt="Foto"
                    class="foto-tecnico"
                  />
                  <div class="tecnico-info">
                    <div class="nombre-row">
                      <h3>{{ tecnicoSeleccionado.nombre }} {{ tecnicoSeleccionado.apellido }}</h3>
                      @if (esTecnicoVerificado(tecnicoSeleccionado)) {
                        <span class="badge-tecnico-verificado">
                          <ion-icon name="shield-checkmark-outline"></ion-icon>
                          Verificado
                        </span>
                      }
                    </div>
                    <div class="calificacion">
                      <ion-icon name="star" color="warning"></ion-icon>
                      <span>{{ tecnicoSeleccionado.datosTecnico?.calificacionPromedio | number:'1.1-1' }}</span>
                    </div>
                    <div class="especialidades-mini">
                      @for (esp of tecnicoSeleccionado.datosTecnico?.especialidades?.slice(0, 2); track esp) {
                        <ion-chip size="small">
                          <ion-label>{{ obtenerEtiquetaEspecialidad(esp) }}</ion-label>
                        </ion-chip>
                      }
                    </div>
                  </div>
                  <div class="tecnico-distancia">
                    <span class="distancia">{{ tecnicoSeleccionado.distancia | number:'1.1-1' }} km</span>
                    @if (tecnicoSeleccionado.datosTecnico?.disponibleAhora) {
                      <ion-badge color="success">Disponible</ion-badge>
                    }
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          }
        } @else {
          <!-- Vista de lista -->
          <div class="lista-tecnicos">
            @for (tecnico of tecnicos; track tecnico._id) {
              <ion-card class="tarjeta-tecnico" (click)="verTecnico(tecnico._id)">
                <ion-card-content>
                  <div class="tecnico-header">
                    <img 
                      [src]="tecnico.perfil?.fotoUrl || tecnico.perfil?.fotoPerfil || 'assets/avatar-default.png'" 
                      alt="Foto"
                      class="foto-tecnico"
                    />
                    <div class="tecnico-info">
                      <div class="nombre-row">
                        <h3>{{ tecnico.nombre }} {{ tecnico.apellido }}</h3>
                        @if (esTecnicoVerificado(tecnico)) {
                          <span class="badge-tecnico-verificado">
                            <ion-icon name="shield-checkmark-outline"></ion-icon>
                            Verificado
                          </span>
                        }
                      </div>
                      <div class="calificacion">
                        <ion-icon name="star" color="warning"></ion-icon>
                        <span>{{ tecnico.datosTecnico?.calificacionPromedio | number:'1.1-1' }}</span>
                        <span class="trabajos">({{ tecnico.datosTecnico?.trabajosCompletados }})</span>
                      </div>
                    </div>
                    <div class="tecnico-distancia">
                      <span class="distancia">{{ tecnico.distancia | number:'1.1-1' }} km</span>
                    </div>
                  </div>
                  <div class="especialidades">
                    @for (esp of tecnico.datosTecnico?.especialidades?.slice(0, 3); track esp) {
                      <ion-chip size="small">
                        <ion-label>{{ obtenerEtiquetaEspecialidad(esp) }}</ion-label>
                      </ion-chip>
                    }
                  </div>
                  <div class="tecnico-badges">
                    @if (tecnico.datosTecnico?.disponibleAhora) {
                      <ion-badge color="success">Disponible</ion-badge>
                    }
                    @if (tecnico.datosTecnico?.emergencia24h) {
                      <ion-badge color="danger">
                        <ion-icon name="flash-outline"></ion-icon> 24/7
                      </ion-badge>
                    }
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      }

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="centrarEnMiUbicacion()">
          <ion-icon name="locate-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;

      p {
        margin-top: 16px;
        color: var(--ion-color-medium);
      }
    }

    .mapa-container {
      width: 100%;
      height: 100%;
    }

    .tarjeta-tecnico-flotante {
      position: fixed;
      bottom: 80px;
      left: 16px;
      right: 16px;
      margin: 0;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      cursor: pointer;
    }

    .tecnico-header {
      display: flex;
      align-items: center;
      gap: 12px;

      .foto-tecnico {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
      }

      .tecnico-info {
        flex: 1;

        .nombre-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .badge-verificado {
          font-size: 10px;
          padding: 2px 6px;
          --background: #4caf50;
          --color: white;
        }

        .calificacion {
          display: flex;
          align-items: center;
          margin-top: 4px;
          gap: 4px;

          ion-icon {
            font-size: 16px;
          }

          span {
            font-size: 14px;
          }

          .trabajos {
            color: var(--ion-color-medium);
          }
        }

        .especialidades-mini {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }
      }

      .tecnico-distancia {
        text-align: right;

        .distancia {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--ion-color-primary);
        }

        ion-badge {
          margin-top: 4px;
        }
      }
    }

    .lista-tecnicos {
      padding: 16px;
    }

    .tarjeta-tecnico {
      margin: 0 0 12px;
      border-radius: 12px;
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }

    .especialidades {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 12px 0;
    }

    .tecnico-badges {
      display: flex;
      gap: 8px;

      ion-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
    }

    ion-fab {
      margin-bottom: 16px;
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonChip, IonLabel, IonBadge,
    IonFab, IonFabButton, IonCard, IonCardContent,
    NgFor, NgIf, DecimalPipe
  ],
})
export class MapaTecnicosPage implements OnInit, AfterViewInit {
  @ViewChild('mapaContainer') mapaContainer!: ElementRef;

  private router = inject(Router);
  private usuariosServicio = inject(UsuariosServicio);
  private geoServicio = inject(GeolocalizacionServicio);

  mapa: L.Map | null = null;
  tecnicos: (Usuario & { distancia?: number })[] = [];
  tecnicoSeleccionado: (Usuario & { distancia?: number }) | null = null;
  miPosicion: { lat: number; lng: number } | null = null;
  marcadores: L.Marker[] = [];
  vistaLista = false;
  cargando = true;

  constructor() {
    addIcons({
      locateOutline, filterOutline, starOutline, star,
      locationOutline, shieldCheckmarkOutline, flashOutline, listOutline
    });
  }

  ngOnInit(): void {
    this.obtenerUbicacionYTecnicos();
  }

  ngAfterViewInit(): void {
    // El mapa se inicializa después de obtener la ubicación
  }

  async obtenerUbicacionYTecnicos(): Promise<void> {
    this.cargando = true;

    const posicion = await this.geoServicio.obtenerPosicionActual();

    if (posicion) {
      this.miPosicion = {
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude
      };
    } else {
      // Usar ubicación por defecto (Quito, Ecuador)
      this.miPosicion = { lat: -0.1807, lng: -78.4678 };
    }

    this.cargarTecnicos();
  }

  cargarTecnicos(): void {
    const filtros: any = {};

    if (this.miPosicion) {
      filtros.latitud = this.miPosicion.lat;
      filtros.longitud = this.miPosicion.lng;
      filtros.radio = 10; // 10 km
    }

    this.usuariosServicio.buscarTecnicosCercanos(
      this.miPosicion!.lat,
      this.miPosicion!.lng,
      undefined,
      10
    ).subscribe({
      next: (res) => {
        this.cargando = false;
        if (res.datos) {
          this.tecnicos = res.datos.map((t: any) => ({
            ...t,
            distancia: t.distancia || this.calcularDistancia(t)
          }));

          if (!this.vistaLista) {
            this.inicializarMapa();
          }
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  inicializarMapa(): void {
    if (!this.miPosicion) return;

    setTimeout(() => {
      // Crear mapa
      this.mapa = L.map('mapa').setView([this.miPosicion!.lat, this.miPosicion!.lng], 13);

      // Agregar tiles de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.mapa);

      // Marcador de mi ubicación
      const miIcono = L.divIcon({
        className: 'mi-ubicacion-marker',
        html: '<div class="pulse"></div>',
        iconSize: [20, 20]
      });

      L.marker([this.miPosicion!.lat, this.miPosicion!.lng], { icon: miIcono })
        .addTo(this.mapa)
        .bindPopup('Tu ubicación');

      // Agregar marcadores de técnicos
      this.agregarMarcadoresTecnicos();
    }, 100);
  }

  agregarMarcadoresTecnicos(): void {
    if (!this.mapa) return;

    const tecnicoIcono = L.divIcon({
      className: 'tecnico-marker',
      html: '<ion-icon name="person-circle" style="font-size: 32px; color: var(--ion-color-primary);"></ion-icon>',
      iconSize: [32, 32]
    });

    this.tecnicos.forEach(tecnico => {
      if (tecnico.ubicacionActual?.coordinates) {
        const [lng, lat] = tecnico.ubicacionActual.coordinates;

        const marcador = L.marker([lat, lng], { icon: tecnicoIcono })
          .addTo(this.mapa!);

        marcador.on('click', () => {
          this.tecnicoSeleccionado = tecnico;
        });

        this.marcadores.push(marcador);
      }
    });
  }

  calcularDistancia(tecnico: Usuario): number {
    if (!this.miPosicion || !tecnico.ubicacionActual?.coordinates) return 0;

    const [lng, lat] = tecnico.ubicacionActual.coordinates;
    return this.geoServicio.calcularDistancia(
      this.miPosicion.lat, this.miPosicion.lng,
      lat, lng
    );
  }

  centrarEnMiUbicacion(): void {
    if (this.mapa && this.miPosicion) {
      this.mapa.setView([this.miPosicion.lat, this.miPosicion.lng], 14);
    }
  }

  toggleVista(): void {
    this.vistaLista = !this.vistaLista;
    if (!this.vistaLista && !this.mapa) {
      setTimeout(() => this.inicializarMapa(), 100);
    }
  }

  verTecnico(id: string): void {
    this.router.navigate(['/tecnico', id]);
  }

  obtenerEtiquetaEspecialidad(tipo: string): string {
    const encontrado = TIPOS_SERVICIO.find(t => t.valor === tipo);
    return encontrado?.etiqueta || tipo;
  }

  esTecnicoVerificado(tecnico: any): boolean {
    return tecnico?.datosTecnico?.membresia?.badgeVerificado === true ||
      tecnico?.datosTecnico?.verificado === true;
  }
}
