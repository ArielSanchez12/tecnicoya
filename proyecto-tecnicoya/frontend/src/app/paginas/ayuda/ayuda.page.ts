import { Component, inject, OnInit } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonSearchbar, IonList, IonItem, IonLabel, IonIcon, IonAccordionGroup,
  IonAccordion, IonCard, IonCardContent, IonButton, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { AuthServicio } from '../../servicios/auth.servicio';
import {
  helpCircleOutline, chatbubbleOutline, callOutline, mailOutline,
  documentTextOutline, personOutline, cardOutline, shieldOutline,
  starOutline, buildOutline, chevronForward
} from 'ionicons/icons';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
  categoria: string;
}

interface CategoriaAyuda {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
}

@Component({
  selector: 'app-ayuda',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Centro de Ayuda</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar 
          [(ngModel)]="busqueda"
          placeholder="¿Cómo podemos ayudarte?"
          (ionInput)="buscar()"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (!busqueda) {
        <!-- Categorías -->
        <div class="categorias-grid">
          @for (cat of categorias; track cat.id) {
            <div class="categoria-card" (click)="seleccionarCategoria(cat.id)">
              <ion-icon [name]="cat.icono"></ion-icon>
              <span>{{ cat.nombre }}</span>
            </div>
          }
        </div>

        <!-- Preguntas frecuentes -->
        <div class="seccion">
          <h2>Preguntas frecuentes</h2>
          <ion-accordion-group>
            @for (faq of preguntasFrecuentes; track faq.pregunta) {
              <ion-accordion>
                <ion-item slot="header">
                  <ion-label>{{ faq.pregunta }}</ion-label>
                </ion-item>
                <div class="ion-padding" slot="content">
                  {{ faq.respuesta }}
                </div>
              </ion-accordion>
            }
          </ion-accordion-group>
        </div>
      } @else {
        <!-- Resultados de búsqueda -->
        <div class="seccion">
          <h2>Resultados para "{{ busqueda }}"</h2>
          @if (resultados.length === 0) {
            <div class="sin-resultados">
              <ion-icon name="help-circle-outline"></ion-icon>
              <p>No encontramos resultados para tu búsqueda</p>
            </div>
          } @else {
            <ion-accordion-group>
              @for (faq of resultados; track faq.pregunta) {
                <ion-accordion>
                  <ion-item slot="header">
                    <ion-label>
                      {{ faq.pregunta }}
                      <ion-chip size="small">{{ faq.categoria }}</ion-chip>
                    </ion-label>
                  </ion-item>
                  <div class="ion-padding" slot="content">
                    {{ faq.respuesta }}
                  </div>
                </ion-accordion>
              }
            </ion-accordion-group>
          }
        </div>
      }

      <!-- Contacto -->
      <ion-card class="tarjeta-contacto">
        <ion-card-content>
          <h3>¿No encuentras lo que buscas?</h3>
          <p>Nuestro equipo de soporte está aquí para ayudarte</p>
          
          <div class="opciones-contacto">
            <ion-button fill="outline" (click)="abrirChat()">
              <ion-icon name="chatbubble-outline" slot="start"></ion-icon>
              Chat en vivo
            </ion-button>
            <ion-button fill="outline" href="tel:+5491155555555">
              <ion-icon name="call-outline" slot="start"></ion-icon>
              Llamar
            </ion-button>
            <ion-button fill="outline" href="mailto:soporte@tecnicoya.com">
              <ion-icon name="mail-outline" slot="start"></ion-icon>
              Email
            </ion-button>
          </div>

          <p class="horario">Horario de atención: Lun - Vie 8:00 - 20:00</p>
        </ion-card-content>
      </ion-card>

      <!-- Guías rápidas -->
      <div class="seccion">
        <h2>Guías rápidas</h2>
        <ion-accordion-group class="guias-accordion">
          <ion-accordion>
            <ion-item slot="header">
              <ion-icon name="document-text-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Cómo solicitar un servicio</h3>
                <p>Aprende a crear tu primera solicitud</p>
              </ion-label>
            </ion-item>
            <div class="ion-padding guia-contenido" slot="content">
              <p><strong>Paso 1:</strong> Ve a la pantalla de inicio y toca el botón "Nuevo servicio" o el ícono "+".</p>
              <p><strong>Paso 2:</strong> Selecciona el tipo de servicio que necesitas (plomería, electricidad, etc.).</p>
              <p><strong>Paso 3:</strong> Describe el problema con el mayor detalle posible.</p>
              <p><strong>Paso 4:</strong> Agrega fotos del problema para que los técnicos puedan evaluar mejor.</p>
              <p><strong>Paso 5:</strong> Confirma tu ubicación donde se realizará el servicio.</p>
              <p><strong>Paso 6:</strong> Elige si es una emergencia o puede esperar.</p>
              <p><strong>Paso 7:</strong> ¡Listo! Los técnicos cercanos recibirán tu solicitud y podrán enviarte cotizaciones.</p>
            </div>
          </ion-accordion>
          <ion-accordion>
            <ion-item slot="header">
              <ion-icon name="person-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Cómo elegir un técnico</h3>
                <p>Tips para seleccionar el mejor profesional</p>
              </ion-label>
            </ion-item>
            <div class="ion-padding guia-contenido" slot="content">
              <p><strong>Revisa las calificaciones:</strong> Los técnicos con 4+ estrellas tienen buen historial de servicio.</p>
              <p><strong>Verifica la insignia:</strong> Los técnicos con ✓ Verificado han pasado nuestro proceso de verificación.</p>
              <p><strong>Compara cotizaciones:</strong> No siempre el más barato es la mejor opción, considera calidad y experiencia.</p>
              <p><strong>Revisa trabajos completados:</strong> Un técnico con muchos trabajos tiene más experiencia.</p>
              <p><strong>Comunícate antes:</strong> Usa el chat para aclarar dudas antes de aceptar.</p>
            </div>
          </ion-accordion>
          <ion-accordion>
            <ion-item slot="header">
              <ion-icon name="card-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Métodos de pago</h3>
                <p>Conoce las opciones disponibles</p>
              </ion-label>
            </ion-item>
            <div class="ion-padding guia-contenido" slot="content">
              <p><strong>Efectivo:</strong> Paga directamente al técnico al finalizar el servicio.</p>
              <p><strong>Tarjeta de crédito/débito:</strong> Visa, Mastercard, American Express son aceptadas.</p>
              <p><strong>Mercado Pago:</strong> Paga de forma segura usando tu cuenta de Mercado Pago.</p>
              <p><strong>Transferencia bancaria:</strong> Realiza una transferencia antes o después del servicio.</p>
              <p><strong>Importante:</strong> El pago queda retenido hasta que apruebes el trabajo completado, garantizando tu satisfacción.</p>
            </div>
          </ion-accordion>
          <ion-accordion>
            <ion-item slot="header">
              <ion-icon name="star-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Sistema de calificaciones</h3>
                <p>Cómo funcionan las reseñas</p>
              </ion-label>
            </ion-item>
            <div class="ion-padding guia-contenido" slot="content">
              <p><strong>Calificación de 1 a 5 estrellas:</strong> Evalúa la calidad general del servicio.</p>
              <p><strong>Aspectos específicos:</strong> Puntualidad, calidad del trabajo y precio justo.</p>
              <p><strong>Comentarios:</strong> Describe tu experiencia para ayudar a otros usuarios.</p>
              <p><strong>Fotos:</strong> Puedes agregar fotos del trabajo terminado.</p>
              @if (esCliente) {
                <p><strong>Gana puntos:</strong> Recibe +5 puntos de fidelización por cada reseña que dejes.</p>
              }
              <p><strong>Las reseñas son públicas:</strong> Ayudan a la comunidad a elegir mejores técnicos.</p>
            </div>
          </ion-accordion>
          <ion-accordion>
            <ion-item slot="header">
              <ion-icon name="shield-outline" slot="start" color="primary"></ion-icon>
              <ion-label>
                <h3>Seguridad y garantías</h3>
                <p>Tu protección es nuestra prioridad</p>
              </ion-label>
            </ion-item>
            <div class="ion-padding guia-contenido" slot="content">
              <p><strong>Técnicos verificados:</strong> Validamos identidad y antecedentes de los profesionales.</p>
              <p><strong>Pago seguro:</strong> El dinero se retiene hasta que apruebes el trabajo.</p>
              <p><strong>Garantía de satisfacción:</strong> Si no estás conforme, mediamos para encontrar una solución.</p>
              <p><strong>Sistema de disputas:</strong> Reporta problemas dentro de 48 horas para revisión.</p>
              <p><strong>Chat integrado:</strong> Toda la comunicación queda registrada como respaldo.</p>
              <p><strong>Soporte 24/7:</strong> Nuestro equipo está disponible para emergencias.</p>
            </div>
          </ion-accordion>
        </ion-accordion-group>
      </div>
    </ion-content>
  `,
  styles: [`
    .categorias-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 16px;
    }

    .categoria-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px;
      background: var(--ion-color-light);
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s;

      &:active {
        transform: scale(0.95);
      }

      span {
        color: var(--ion-color-primary);
      }

      ion-icon {
        font-size: 28px;
        color: var(--ion-color-primary);
        margin-bottom: 8px;
      }

      span {
        font-size: 12px;
        text-align: center;
        font-weight: 500;
      }
    }

    .seccion {
      padding: 16px;

      h2 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 16px;
      }
    }

    .sin-resultados {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      text-align: center;

      ion-icon {
        font-size: 48px;
        color: var(--ion-color-medium);
        margin-bottom: 12px;
      }

      p {
        color: var(--ion-color-medium);
        margin: 0;
      }
    }

    .tarjeta-contacto {
      margin: 16px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
      color: white;

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
      }

      p {
        margin: 0 0 16px;
        opacity: 0.9;
      }

      .opciones-contacto {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        ion-button {
          --color: white;
          --border-color: rgba(255, 255, 255, 0.5);
        }
      }

      .horario {
        font-size: 12px;
        margin: 16px 0 0;
        opacity: 0.7;
      }
    }

    ion-accordion {
      background: var(--ion-color-light);
      border-radius: 8px;
      margin-bottom: 8px;

      ion-chip {
        margin-left: 8px;
        font-size: 10px;
      }

      [slot="content"] {
        color: #333;
        background: white;
        line-height: 1.6;
      }
    }

    ion-list {
      background: transparent;

      ion-item {
        --background: var(--ion-color-light);
        border-radius: 8px;
        margin-bottom: 8px;

        ion-icon[slot="start"] {
          color: var(--ion-color-primary);
        }

        h3 {
          font-weight: 500;
        }

        p {
          font-size: 12px;
          color: var(--ion-color-medium);
        }
      }
    }

    .guias-accordion {
      ion-accordion {
        ion-item {
          --background: var(--ion-color-light);

          h3 {
            font-weight: 500;
            color: var(--ion-color-primary);
          }

          p {
            font-size: 12px;
            color: var(--ion-color-medium);
          }
        }
      }

      .guia-contenido {
        background: white;
        color: #333;

        p {
          margin: 8px 0;
          line-height: 1.5;
          color: #333;

          strong {
            color: var(--ion-color-primary);
          }
        }
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonSearchbar, IonList, IonItem, IonLabel, IonIcon, IonAccordionGroup,
    IonAccordion, IonCard, IonCardContent, IonButton, IonChip,
    NgFor, NgIf, FormsModule
  ],
})
export class AyudaPage implements OnInit {
  private authServicio = inject(AuthServicio);

  busqueda = '';
  resultados: PreguntaFrecuente[] = [];
  categoriaSeleccionada = '';
  esCliente = false;

  categorias: CategoriaAyuda[] = [
    { id: 'servicios', nombre: 'Servicios', icono: 'build-outline', descripcion: 'Sobre solicitudes y servicios' },
    { id: 'pagos', nombre: 'Pagos', icono: 'card-outline', descripcion: 'Métodos de pago y facturación' },
    { id: 'cuenta', nombre: 'Mi cuenta', icono: 'person-outline', descripcion: 'Perfil y configuración' },
    { id: 'tecnicos', nombre: 'Técnicos', icono: 'build-outline', descripcion: 'Sobre los profesionales' },
    { id: 'seguridad', nombre: 'Seguridad', icono: 'shield-outline', descripcion: 'Garantías y protección' },
    { id: 'puntos', nombre: 'Puntos', icono: 'star-outline', descripcion: 'Programa de fidelización' }
  ];

  preguntasFrecuentes: PreguntaFrecuente[] = [
    {
      categoria: 'Servicios',
      pregunta: '¿Cómo solicito un servicio?',
      respuesta: 'Desde la pantalla de inicio, toca el botón "Nuevo servicio". Selecciona el tipo de servicio, describe el problema, agrega fotos si es necesario y elige tu ubicación. Los técnicos cercanos recibirán tu solicitud y podrán enviarte cotizaciones.'
    },
    {
      categoria: 'Servicios',
      pregunta: '¿Puedo cancelar un servicio?',
      respuesta: 'Sí, puedes cancelar un servicio en cualquier momento antes de que el técnico llegue a tu ubicación. Si el técnico ya está en camino, puede aplicar un cargo por cancelación según los términos del servicio.'
    },
    {
      categoria: 'Pagos',
      pregunta: '¿Qué métodos de pago aceptan?',
      respuesta: 'Aceptamos efectivo, tarjetas de crédito/débito (Visa, Mastercard, American Express), Mercado Pago y transferencias bancarias. El pago se realiza directamente al técnico al finalizar el servicio.'
    },
    {
      categoria: 'Pagos',
      pregunta: '¿Cómo funciona el presupuesto?',
      respuesta: 'Los técnicos pueden enviarte cotizaciones antes de aceptar el trabajo. Puedes comparar precios y elegir la opción que más te convenga. Una vez aceptada la cotización, ese será el precio acordado (salvo imprevistos que el técnico comunicará).'
    },
    {
      categoria: 'Técnicos',
      pregunta: '¿Cómo sé si un técnico es confiable?',
      respuesta: 'Todos los técnicos pasan por un proceso de verificación. Puedes ver su calificación, reseñas de otros clientes, cantidad de trabajos completados y si tiene la insignia de "Verificado". Los técnicos con mejor reputación tienen más visibilidad.'
    },
    {
      categoria: 'Seguridad',
      pregunta: '¿Tienen alguna garantía?',
      respuesta: 'Sí, ofrecemos garantía de satisfacción. Si no estás conforme con el servicio, puedes reportarlo dentro de las 48 horas y mediaremos para encontrar una solución. Los técnicos verificados ofrecen garantía adicional en sus trabajos.'
    },
    {
      categoria: 'Cuenta',
      pregunta: '¿Cómo cambio mi información personal?',
      respuesta: 'Ve a tu perfil, toca "Editar perfil" y podrás modificar tu nombre, foto, teléfono y dirección. Para cambiar tu email o contraseña, ve a Configuración > Privacidad.'
    },
    {
      categoria: 'Puntos',
      pregunta: '¿Cómo funcionan los puntos de fidelización?',
      respuesta: 'Ganas puntos por cada servicio completado, por dejar reseñas y por referir amigos. Los puntos se pueden canjear por descuentos en futuros servicios. Además, acumula puntos para subir de nivel y obtener beneficios exclusivos.'
    }
  ];

  constructor() {
    addIcons({
      helpCircleOutline, chatbubbleOutline, callOutline, mailOutline,
      documentTextOutline, personOutline, cardOutline, shieldOutline,
      starOutline, buildOutline, chevronForward
    });
  }

  ngOnInit(): void {
    const usuario = this.authServicio.obtenerUsuarioActual();
    this.esCliente = usuario?.rol === 'cliente';
  }

  buscar(): void {
    if (!this.busqueda.trim()) {
      this.resultados = [];
      return;
    }

    const termino = this.busqueda.toLowerCase();
    this.resultados = this.preguntasFrecuentes.filter(faq =>
      faq.pregunta.toLowerCase().includes(termino) ||
      faq.respuesta.toLowerCase().includes(termino) ||
      faq.categoria.toLowerCase().includes(termino)
    );
  }

  seleccionarCategoria(categoriaId: string): void {
    this.categoriaSeleccionada = categoriaId;
    // Filtrar por categoría
  }

  abrirChat(): void {
    // Implementar chat de soporte
    console.log('Abrir chat de soporte');
  }
}
