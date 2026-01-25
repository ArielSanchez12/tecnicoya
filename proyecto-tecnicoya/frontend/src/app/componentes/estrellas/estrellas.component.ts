import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { starOutline, star } from 'ionicons/icons';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-estrellas',
  template: `
    <div class="estrellas-container" [class.readonly]="soloLectura">
      @for (i of [1, 2, 3, 4, 5]; track i) {
        <ion-icon 
          [name]="i <= valor ? 'star' : 'star-outline'"
          [class.activa]="i <= valor"
          [class.hover]="i <= valorHover && !soloLectura"
          (click)="seleccionar(i)"
          (mouseenter)="hover(i)"
          (mouseleave)="hover(0)"
        ></ion-icon>
      }
    </div>
  `,
  styles: [`
    .estrellas-container {
      display: inline-flex;
      gap: 4px;

      &.readonly {
        pointer-events: none;
      }

      ion-icon {
        font-size: 20px;
        color: #ddd;
        cursor: pointer;
        transition: all 0.2s ease;

        &.activa {
          color: #ffc107;
        }

        &.hover {
          color: #ffd54f;
          transform: scale(1.1);
        }

        &:hover:not(.readonly) {
          transform: scale(1.2);
        }
      }
    }
  `],
  standalone: true,
  imports: [IonIcon, NgFor],
})
export class EstrellasComponent {
  @Input() valor = 0;
  @Input() soloLectura = false;
  @Input() tamano: 'small' | 'medium' | 'large' = 'medium';
  @Output() valorCambiado = new EventEmitter<number>();

  valorHover = 0;

  constructor() {
    addIcons({ starOutline, star });
  }

  seleccionar(valor: number): void {
    if (!this.soloLectura) {
      this.valor = valor;
      this.valorCambiado.emit(valor);
    }
  }

  hover(valor: number): void {
    if (!this.soloLectura) {
      this.valorHover = valor;
    }
  }
}
