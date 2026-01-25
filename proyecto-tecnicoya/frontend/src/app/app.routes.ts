import { Routes } from '@angular/router';
import { autenticacionGuard } from './guards/autenticacion.guard';
import { invitadoGuard } from './guards/invitado.guard';

export const routes: Routes = [
  // Redirección inicial
  {
    path: '',
    redirectTo: 'bienvenida',
    pathMatch: 'full',
  },

  // ===== RUTAS PÚBLICAS =====
  {
    path: 'bienvenida',
    loadComponent: () => import('./paginas/bienvenida/bienvenida.page').then(m => m.BienvenidaPage),
    canActivate: [invitadoGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./paginas/auth/login/login.page').then(m => m.LoginPage),
    canActivate: [invitadoGuard]
  },
  {
    path: 'registro',
    loadComponent: () => import('./paginas/auth/registro/registro.page').then(m => m.RegistroPage),
    canActivate: [invitadoGuard]
  },
  {
    path: 'registro-tecnico',
    loadComponent: () => import('./paginas/auth/registro-tecnico/registro-tecnico.page').then(m => m.RegistroTecnicoPage),
    canActivate: [invitadoGuard]
  },

  // ===== RUTAS PROTEGIDAS - TABS =====
  {
    path: 'tabs',
    loadComponent: () => import('./paginas/tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [autenticacionGuard],
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
      },
      {
        path: 'inicio',
        loadComponent: () => import('./paginas/inicio/inicio.page').then(m => m.InicioPage)
      },
      {
        path: 'buscar',
        loadComponent: () => import('./paginas/buscar/buscar.page').then(m => m.BuscarPage)
      },
      {
        path: 'servicios',
        loadComponent: () => import('./paginas/mis-servicios/mis-servicios.page').then(m => m.MisServiciosPage)
      },
      {
        path: 'trabajos',
        loadComponent: () => import('./paginas/mis-trabajos/mis-trabajos.page').then(m => m.MisTrabajosPage)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./paginas/perfil/perfil.page').then(m => m.PerfilPage)
      }
    ]
  },

  // ===== RUTAS PROTEGIDAS - PÁGINAS INDIVIDUALES =====
  {
    path: 'nuevo-servicio',
    loadComponent: () => import('./paginas/nuevo-servicio/nuevo-servicio.page').then(m => m.NuevoServicioPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'servicio/:id',
    loadComponent: () => import('./paginas/detalle-servicio/detalle-servicio.page').then(m => m.DetalleServicioPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'editar-servicio/:id',
    loadComponent: () => import('./paginas/editar-servicio/editar-servicio.page').then(m => m.EditarServicioPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'tecnico/:id',
    loadComponent: () => import('./paginas/perfil-tecnico/perfil-tecnico.page').then(m => m.PerfilTecnicoPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'nueva-cotizacion/:id',
    loadComponent: () => import('./paginas/nueva-cotizacion/nueva-cotizacion.page').then(m => m.NuevaCotizacionPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'editar-cotizacion/:id',
    loadComponent: () => import('./paginas/nueva-cotizacion/nueva-cotizacion.page').then(m => m.NuevaCotizacionPage),
    canActivate: [autenticacionGuard]
  },
  // Nota: El detalle de cotización ahora se muestra en un modal desde detalle-servicio
  {
    path: 'trabajo/:id',
    loadComponent: () => import('./paginas/detalle-trabajo/detalle-trabajo.page').then(m => m.DetalleTrabajoPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'completar-trabajo/:id',
    loadComponent: () => import('./paginas/nueva-resena/nueva-resena.page').then(m => m.NuevaResenaPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'chat/:id',
    loadComponent: () => import('./paginas/chat/chat.page').then(m => m.ChatPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'nueva-resena/:id',
    loadComponent: () => import('./paginas/nueva-resena/nueva-resena.page').then(m => m.NuevaResenaPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'fidelizacion',
    loadComponent: () => import('./paginas/fidelizacion/fidelizacion.page').then(m => m.FidelizacionPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'mis-resenas',
    loadComponent: () => import('./paginas/mis-resenas/mis-resenas.page').then(m => m.MisResenasPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'mapa-tecnicos',
    loadComponent: () => import('./paginas/mapa-tecnicos/mapa-tecnicos.page').then(m => m.MapaTecnicosPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'editar-perfil',
    loadComponent: () => import('./paginas/editar-perfil/editar-perfil.page').then(m => m.EditarPerfilPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'tecnico-instantaneo',
    loadComponent: () => import('./paginas/tecnico-instantaneo/tecnico-instantaneo.page').then(m => m.TecnicoInstantaneoPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'mis-trabajos',
    loadComponent: () => import('./paginas/mis-trabajos/mis-trabajos.page').then(m => m.MisTrabajosPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'mis-servicios',
    loadComponent: () => import('./paginas/mis-servicios/mis-servicios.page').then(m => m.MisServiciosPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'notificaciones',
    loadComponent: () => import('./paginas/notificaciones/notificaciones.page').then(m => m.NotificacionesPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'membresias',
    loadComponent: () => import('./paginas/membresias/membresias.page').then(m => m.MembresiasPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'configuracion',
    loadComponent: () => import('./paginas/configuracion/configuracion.page').then(m => m.ConfiguracionPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'ayuda',
    loadComponent: () => import('./paginas/ayuda/ayuda.page').then(m => m.AyudaPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'terminos',
    loadComponent: () => import('./paginas/terminos/terminos.page').then(m => m.TerminosPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'privacidad',
    loadComponent: () => import('./paginas/privacidad/privacidad.page').then(m => m.PrivacidadPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'retirar-fondos',
    loadComponent: () => import('./paginas/retirar-fondos/retirar-fondos.page').then(m => m.RetirarFondosPage),
    canActivate: [autenticacionGuard]
  },

  // ===== RUTA 404 =====
  {
    path: '**',
    redirectTo: 'bienvenida'
  }
];
