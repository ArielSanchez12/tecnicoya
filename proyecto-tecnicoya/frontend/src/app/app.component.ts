import { Component, OnInit, inject, NgZone } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthServicio } from './servicios/auth.servicio';
import { NotificacionesServicio } from './servicios/notificaciones.servicio';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private authServicio = inject(AuthServicio);
  private notificacionesServicio = inject(NotificacionesServicio);
  private router = inject(Router);
  private zone = inject(NgZone);

  constructor() { }

  ngOnInit(): void {
    // Verificar autenticación al iniciar la app (restaurar sesión si existe token)
    this.restaurarSesion();
    
    // Inicializar manejo de deep links solo en plataformas nativas
    if (Capacitor.isNativePlatform()) {
      this.inicializarDeepLinks();
      // Inicializar push notifications
      this.inicializarPushNotifications();
    }
  }

  /**
   * Inicializa las push notifications para Android/iOS
   */
  private async inicializarPushNotifications(): Promise<void> {
    try {
      console.log('🔔 Inicializando push notifications...');
      // Pequeño delay para asegurar que la app esté lista
      setTimeout(async () => {
        try {
          const permiso = await this.notificacionesServicio.solicitarPermisosPush();
          if (permiso) {
            console.log('✅ Push notifications habilitadas');
          } else {
            console.log('⚠️ Push notifications no habilitadas (puede ser por permisos)');
          }
        } catch (innerError) {
          console.warn('⚠️ Error en push notifications (no crítico):', innerError);
        }
      }, 2000);
    } catch (error) {
      console.warn('⚠️ Push notifications no disponibles:', error);
    }
  }

  private restaurarSesion(): void {
    const token = this.authServicio.obtenerToken();
    if (token) {
      console.log('🔄 Restaurando sesión...');
      // Verificar que el token sigue siendo válido con el backend
      this.authServicio.verificarAutenticacion().subscribe({
        next: (respuesta) => {
          if (respuesta.exito) {
            console.log('✅ Sesión restaurada correctamente');
          } else {
            console.log('❌ Token inválido, cerrando sesión');
          }
        },
        error: (err) => {
          console.error('❌ Error al verificar sesión:', err);
        }
      });
    }
  }

  /**
   * Inicializa el listener para deep links desde correos o enlaces externos
   */
  private inicializarDeepLinks(): void {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      // Usar NgZone para asegurar que Angular detecte los cambios
      this.zone.run(() => {
        console.log('🔗 Deep link recibido:', event.url);
        this.manejarDeepLink(event.url);
      });
    });
    
    console.log('✅ Deep links inicializados');
  }

  /**
   * Procesa y navega según el deep link recibido
   */
  private manejarDeepLink(url: string): void {
    try {
      // Manejar esquema personalizado tecnicoya://
      if (url.startsWith('tecnicoya://')) {
        const path = url.replace('tecnicoya://app', '').replace('tecnicoya://', '');
        this.navegarAPagina(path);
        return;
      }

      // Manejar URLs https://tecnicoya.app/...
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const params = urlObj.searchParams;
      
      // Extraer parámetros si existen
      const token = params.get('token');
      const verificado = params.get('verificado');
      
      // Navegar según la ruta
      if (path.includes('confirmar-cuenta') || path.includes('verificar')) {
        const tokenPath = path.split('/').pop();
        this.router.navigate(['/confirmar-cuenta', tokenPath || token]);
      } else if (path.includes('restablecer-contrasena') || path.includes('recuperar')) {
        const tokenPath = path.split('/').pop();
        this.router.navigate(['/restablecer-contrasena', tokenPath || token]);
      } else if (path.includes('login') && verificado) {
        this.router.navigate(['/login'], { queryParams: { verificado: 'true' } });
      } else if (path.includes('servicio/')) {
        const servicioId = path.split('/').pop();
        this.router.navigate(['/detalle-servicio', servicioId]);
      } else if (path.includes('trabajo/')) {
        const trabajoId = path.split('/').pop();
        this.router.navigate(['/detalle-trabajo', trabajoId]);
      } else if (path.includes('perfil-tecnico/')) {
        const tecnicoId = path.split('/').pop();
        this.router.navigate(['/perfil-tecnico', tecnicoId]);
      } else {
        // Ruta genérica
        this.navegarAPagina(path);
      }
    } catch (error) {
      console.error('❌ Error procesando deep link:', error);
    }
  }

  /**
   * Navegación genérica a partir de un path
   */
  private navegarAPagina(path: string): void {
    // Limpiar el path
    const rutaLimpia = path.startsWith('/') ? path : '/' + path;
    
    // Verificar si la ruta existe y navegar
    if (rutaLimpia && rutaLimpia !== '/') {
      this.router.navigateByUrl(rutaLimpia);
    }
  }
}
