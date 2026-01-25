import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent, IonButton, IonIcon, IonText,
  IonImg
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  constructOutline, personOutline,
  chevronForwardOutline, flashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-bienvenida',
  template: `
    <ion-content class="ion-padding">
      <div class="bienvenida-container">
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-circle">
            <ion-icon name="construct-outline"></ion-icon>
          </div>
          <h1>TécnicoYa</h1>
          <p class="tagline">Conectamos clientes con técnicos especializados</p>
        </div>

        <!-- Características -->
        <div class="features">
          <div class="feature-item">
            <ion-icon name="flash-outline" color="warning"></ion-icon>
            <span>Técnicos disponibles 24/7</span>
          </div>
          <div class="feature-item">
            <ion-icon name="construct-outline" color="primary"></ion-icon>
            <span>Profesionales verificados</span>
          </div>
          <div class="feature-item">
            <ion-icon name="person-outline" color="success"></ion-icon>
            <span>Precios transparentes</span>
          </div>
        </div>

        <!-- Botones -->
        <div class="buttons-section">
          <ion-button expand="block" (click)="irARegistro()">
            Crear cuenta
            <ion-icon slot="end" name="chevron-forward-outline"></ion-icon>
          </ion-button>
          
          <ion-button expand="block" fill="outline" (click)="irALogin()">
            Ya tengo cuenta
          </ion-button>

          <ion-button expand="block" fill="clear" color="medium" (click)="irARegistroTecnico()">
            ¿Eres técnico? Regístrate aquí
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .bienvenida-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 100%;
      padding: 24px;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 48px;
    }

    .logo-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-tertiary) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;

      ion-icon {
        font-size: 48px;
        color: white;
      }
    }

    h1 {
      font-size: 32px;
      font-weight: bold;
      color: white;
      margin: 0 0 8px;
    }

    .tagline {
      color: var(--ion-color-medium);
      font-size: 16px;
      margin: 0;
    }

    .features {
      margin-bottom: 48px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: var(--ion-color-light);
      border-radius: 12px;
      margin-bottom: 12px;

      ion-icon {
        font-size: 24px;
      }

      span {
        font-size: 15px;
        color: var(--ion-color-dark);
      }
    }

    .buttons-section {
      ion-button {
        margin-bottom: 12px;
        --border-radius: 12px;
        height: 50px;
      }
    }
  `],
  standalone: true,
  imports: [IonContent, IonButton, IonIcon, IonText, IonImg],
})
export class BienvenidaPage {
  constructor(private router: Router) {
    addIcons({
      constructOutline, personOutline,
      chevronForwardOutline, flashOutline
    });
  }

  irALogin(): void {
    this.router.navigate(['/login']);
  }

  irARegistro(): void {
    this.router.navigate(['/registro']);
  }

  irARegistroTecnico(): void {
    this.router.navigate(['/registro-tecnico']);
  }
}
