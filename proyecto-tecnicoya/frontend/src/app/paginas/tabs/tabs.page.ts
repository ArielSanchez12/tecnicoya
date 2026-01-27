import { Component, inject, OnInit } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, home,
  searchOutline, search,
  personOutline, person
} from 'ionicons/icons';
import { AuthServicio } from '../../servicios/auth.servicio';

@Component({
  selector: 'app-tabs',
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="buscar">
          <ion-icon name="search-outline"></ion-icon>
          <ion-label>Buscar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="perfil">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    ion-tab-bar {
      --background: var(--ion-color-light);
      border-top: 1px solid var(--ion-color-light-shade);
    }

    ion-tab-button {
      --color: var(--ion-color-medium);
      --color-selected: var(--ion-color-primary);
    }
  `],
  standalone: true,
  imports: [
    IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel
  ],
})
export class TabsPage implements OnInit {
  private authServicio = inject(AuthServicio);

  constructor() {
    addIcons({
      homeOutline, home,
      searchOutline, search,
      personOutline, person
    });
  }

  ngOnInit(): void {
    // Tab Buscar ahora visible para todos los usuarios
  }
}
