import { Component } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-terminos',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Términos y Condiciones</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="contenido">
        <p class="fecha-actualizacion">Última actualización: Enero 2025</p>

        <ion-card>
          <ion-card-header>
            <ion-card-title>1. Aceptación de los Términos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Al acceder y utilizar la aplicación TécnicoYa, usted acepta estar 
              legalmente obligado por estos Términos y Condiciones. Si no está de 
              acuerdo con alguna parte de estos términos, no debe utilizar nuestra 
              aplicación.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>2. Descripción del Servicio</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              TécnicoYa es una plataforma que conecta usuarios que necesitan servicios 
              técnicos del hogar con profesionales independientes. Actuamos únicamente 
              como intermediarios y no somos responsables directos de los servicios 
              prestados por los técnicos.
            </p>
            <p>
              <strong>Servicios disponibles:</strong> plomería, electricidad, cerrajería, 
              climatización, carpintería, pintura, limpieza, jardinería, reparación de 
              electrodomésticos, mudanzas y otros servicios técnicos.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>3. Registro y Cuentas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Para Clientes:</strong></p>
            <ul>
              <li>Debe ser mayor de 18 años</li>
              <li>Proporcionar información veraz y actualizada</li>
              <li>Mantener la confidencialidad de sus credenciales</li>
              <li>Notificar cualquier uso no autorizado de su cuenta</li>
            </ul>
            <p><strong>Para Técnicos:</strong></p>
            <ul>
              <li>Ser profesional en el área de servicio declarada</li>
              <li>Contar con las habilitaciones legales correspondientes</li>
              <li>Proporcionar documentación verificable</li>
              <li>Mantener actualizada su disponibilidad y tarifas</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>4. Uso de la Plataforma</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Está prohibido:</strong></p>
            <ul>
              <li>Proporcionar información falsa o engañosa</li>
              <li>Usar la plataforma para fines ilegales</li>
              <li>Contactar usuarios fuera de la plataforma para evadir comisiones</li>
              <li>Publicar contenido ofensivo, discriminatorio o inapropiado</li>
              <li>Manipular el sistema de calificaciones</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>5. Pagos y Comisiones</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Los pagos se realizan directamente entre el cliente y el técnico. 
              TécnicoYa puede aplicar una comisión sobre los servicios realizados 
              a través de la plataforma.
            </p>
            <p>
              Las cotizaciones enviadas por los técnicos son estimaciones. El precio 
              final puede variar según las condiciones reales del trabajo.
            </p>
            <p>
              Los técnicos son responsables de sus obligaciones fiscales y tributarias.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>6. Cancelaciones y Reembolsos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Cancelación por el Cliente:</strong></p>
            <ul>
              <li>Sin cargo: hasta 2 horas antes del servicio programado</li>
              <li>Con cargo parcial: menos de 2 horas antes</li>
              <li>Con cargo completo: si el técnico ya está en camino</li>
            </ul>
            <p><strong>Cancelación por el Técnico:</strong></p>
            <ul>
              <li>Cancelaciones frecuentes pueden resultar en suspensión</li>
              <li>Debe notificar con la mayor anticipación posible</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>7. Calificaciones y Reseñas</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Las calificaciones y reseñas deben ser honestas y basadas en 
              experiencias reales. TécnicoYa se reserva el derecho de eliminar 
              contenido que viole estas políticas.
            </p>
            <p>
              No se permite:
            </p>
            <ul>
              <li>Reseñas falsas o pagadas</li>
              <li>Comentarios difamatorios</li>
              <li>Información personal de terceros</li>
              <li>Contenido promocional no relacionado</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>8. Responsabilidad y Garantías</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              TécnicoYa actúa como intermediario y no es responsable directo de:
            </p>
            <ul>
              <li>La calidad de los servicios prestados por los técnicos</li>
              <li>Daños causados durante la prestación del servicio</li>
              <li>Incumplimiento de acuerdos entre usuarios</li>
            </ul>
            <p>
              Ofrecemos un sistema de mediación para resolver disputas. Los técnicos 
              verificados pueden ofrecer garantías adicionales sobre sus trabajos.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>9. Propiedad Intelectual</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Todo el contenido de la aplicación (logos, diseños, textos, código) 
              es propiedad de TécnicoYa o sus licenciantes. No está permitida su 
              reproducción sin autorización escrita.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>10. Modificaciones</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier 
              momento. Los cambios serán notificados a través de la aplicación. 
              El uso continuado después de las modificaciones implica la aceptación 
              de los nuevos términos.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>11. Contacto</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Para consultas sobre estos términos:</p>
            <ul>
              <li>Email: legal&#64;tecnicoya.com</li>
              <li>Teléfono: +54 11 5555-5555</li>
              <li>Dirección: Av. Corrientes 1234, CABA, Argentina</li>
            </ul>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .contenido {
      padding: 16px;
    }

    .fecha-actualizacion {
      text-align: center;
      color: var(--ion-color-medium);
      font-size: 13px;
      margin-bottom: 16px;
    }

    ion-card {
      margin-bottom: 16px;
      border-radius: 12px;

      ion-card-header {
        padding-bottom: 8px;
      }

      ion-card-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--ion-color-primary);
      }

      ion-card-content {
        p {
          margin: 0 0 12px;
          line-height: 1.6;
          font-size: 14px;
        }

        ul {
          margin: 8px 0;
          padding-left: 20px;

          li {
            margin-bottom: 6px;
            font-size: 14px;
            line-height: 1.5;
          }
        }
      }
    }
  `],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle
  ],
})
export class TerminosPage { }
