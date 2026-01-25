import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('../inicio/inicio.page').then(m => m.InicioPage),
      },
      {
        path: 'buscar',
        loadComponent: () => import('../buscar/buscar.page').then(m => m.BuscarPage),
      },
      {
        path: 'mis-servicios',
        loadComponent: () => import('../servicios/mis-servicios/mis-servicios.page').then(m => m.MisServiciosPage),
      },
      {
        path: 'mis-trabajos',
        loadComponent: () => import('../trabajos/mis-trabajos/mis-trabajos.page').then(m => m.MisTrabajosPage),
      },
      {
        path: 'perfil',
        loadComponent: () => import('../perfil/perfil.page').then(m => m.PerfilPage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
];
