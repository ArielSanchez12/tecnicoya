import { Component } from '@angular/core';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline, locationOutline, personOutline,
  lockClosedOutline, cloudOutline, trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-privacidad',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/perfil"></ion-back-button>
        </ion-buttons>
        <ion-title>Política de Privacidad</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="contenido">
        <div class="header-privacidad">
          <ion-icon name="shield-checkmark-outline"></ion-icon>
          <h1>Tu privacidad es importante</h1>
          <p>Nos comprometemos a proteger tus datos personales</p>
        </div>

        <p class="fecha-actualizacion">Última actualización: Enero 2025</p>

        <ion-card>
          <ion-card-header>
            <ion-icon name="person-outline"></ion-icon>
            <ion-card-title>1. Información que Recopilamos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Información proporcionada directamente:</strong></p>
            <ul>
              <li>Nombre, apellido y foto de perfil</li>
              <li>Correo electrónico y número de teléfono</li>
              <li>Dirección y ubicación</li>
              <li>Información de pago (procesada por terceros seguros)</li>
              <li>Documentos de identificación (para técnicos)</li>
            </ul>
            
            <p><strong>Información recopilada automáticamente:</strong></p>
            <ul>
              <li>Ubicación GPS (con tu consentimiento)</li>
              <li>Información del dispositivo (modelo, SO, ID)</li>
              <li>Registro de actividad en la aplicación</li>
              <li>Direcciones IP y datos de conexión</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-icon name="location-outline"></ion-icon>
            <ion-card-title>2. Uso de la Ubicación</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Utilizamos tu ubicación para:</p>
            <ul>
              <li>Conectarte con técnicos cercanos</li>
              <li>Mostrar el mapa de técnicos disponibles</li>
              <li>Calcular distancias y tiempos estimados</li>
              <li>Mejorar la precisión del servicio</li>
            </ul>
            <p>
              Puedes desactivar el acceso a tu ubicación en cualquier momento 
              desde la configuración de tu dispositivo, aunque esto limitará 
              algunas funcionalidades.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-icon name="cloud-outline"></ion-icon>
            <ion-card-title>3. Cómo Usamos tu Información</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ul>
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Procesar solicitudes y transacciones</li>
              <li>Comunicarnos contigo sobre tu cuenta y servicios</li>
              <li>Enviar notificaciones relevantes (con tu consentimiento)</li>
              <li>Verificar identidad y prevenir fraudes</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Analizar y mejorar la experiencia del usuario</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-icon name="person-outline"></ion-icon>
            <ion-card-title>4. Compartir Información</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p><strong>Compartimos información con:</strong></p>
            <ul>
              <li>
                <strong>Otros usuarios:</strong> Tu nombre, foto, calificación 
                y ubicación aproximada son visibles para otros usuarios según 
                el contexto del servicio.
              </li>
              <li>
                <strong>Proveedores de servicios:</strong> Empresas que nos 
                ayudan con hosting, pagos, analytics, comunicaciones.
              </li>
              <li>
                <strong>Autoridades:</strong> Cuando sea requerido por ley o 
                para proteger derechos legales.
              </li>
            </ul>
            <p>
              <strong>No vendemos</strong> tu información personal a terceros 
              para fines de marketing.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-icon name="lock-closed-outline"></ion-icon>
            <ion-card-title>5. Seguridad de los Datos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Implementamos medidas de seguridad que incluyen:</p>
            <ul>
              <li>Encriptación de datos en tránsito (SSL/TLS)</li>
              <li>Encriptación de datos sensibles en reposo</li>
              <li>Autenticación segura con tokens JWT</li>
              <li>Acceso restringido a datos personales</li>
              <li>Monitoreo continuo de seguridad</li>
              <li>Copias de seguridad regulares</li>
            </ul>
            <p>
              Sin embargo, ningún sistema es 100% seguro. Te recomendamos 
              usar contraseñas fuertes y no compartir tus credenciales.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-icon name="shield-checkmark-outline"></ion-icon>
            <ion-card-title>6. Tus Derechos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Tienes derecho a:</p>
            <ul>
              <li><strong>Acceder</strong> a tus datos personales</li>
              <li><strong>Rectificar</strong> información incorrecta</li>
              <li><strong>Eliminar</strong> tus datos (derecho al olvido)</li>
              <li><strong>Portabilidad</strong> de tus datos</li>
              <li><strong>Oponerte</strong> a ciertos usos de tus datos</li>
              <li><strong>Limitar</strong> el procesamiento de tus datos</li>
              <li><strong>Retirar</strong> el consentimiento en cualquier momento</li>
            </ul>
            <p>
              Para ejercer estos derechos, contacta a 
              privacidad&#64;tecnicoya.com
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-icon name="trash-outline"></ion-icon>
            <ion-card-title>7. Retención de Datos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Conservamos tu información mientras tu cuenta esté activa o sea 
              necesaria para proporcionarte servicios. Después de eliminar tu 
              cuenta:
            </p>
            <ul>
              <li>Datos de perfil: eliminados en 30 días</li>
              <li>Historial de servicios: anonimizado o eliminado en 90 días</li>
              <li>Datos de facturación: conservados según requisitos legales (hasta 10 años)</li>
              <li>Copias de seguridad: purgadas en ciclos regulares</li>
            </ul>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>8. Cookies y Tecnologías Similares</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Utilizamos:</p>
            <ul>
              <li>Almacenamiento local para preferencias</li>
              <li>Tokens de sesión para autenticación</li>
              <li>Analytics para mejorar el servicio</li>
            </ul>
            <p>
              Puedes gestionar estas preferencias desde la configuración de 
              la aplicación.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>9. Menores de Edad</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              TécnicoYa no está dirigido a menores de 18 años. No recopilamos 
              intencionalmente información de menores. Si descubrimos que hemos 
              recopilado datos de un menor, los eliminaremos inmediatamente.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>10. Cambios en esta Política</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>
              Podemos actualizar esta política periódicamente. Te notificaremos 
              sobre cambios significativos a través de la aplicación o por 
              correo electrónico. Te recomendamos revisar esta página 
              regularmente.
            </p>
          </ion-card-content>
        </ion-card>

        <ion-card>
          <ion-card-header>
            <ion-card-title>11. Contacto</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Para consultas sobre privacidad:</p>
            <ul>
              <li>Email: privacidad&#64;tecnicoya.com</li>
              <li>Delegado de Protección de Datos: dpo&#64;tecnicoya.com</li>
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

    .header-privacidad {
      text-align: center;
      padding: 24px 16px;
      background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%);
      border-radius: 16px;
      color: white;
      margin-bottom: 16px;

      ion-icon {
        font-size: 64px;
        margin-bottom: 12px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 22px;
      }

      p {
        margin: 0;
        opacity: 0.9;
      }
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
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 8px;

        ion-icon {
          font-size: 22px;
          color: var(--ion-color-primary);
        }

        ion-card-title {
          font-size: 15px;
          font-weight: 600;
        }
      }

      ion-card-content {
        p {
          margin: 0 0 12px;
          line-height: 1.6;
          font-size: 14px;
        }

        ul {
          margin: 8px 0 16px;
          padding-left: 20px;

          li {
            margin-bottom: 8px;
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
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon
  ],
})
export class PrivacidadPage {
  constructor() {
    addIcons({
      shieldCheckmarkOutline, locationOutline, personOutline,
      lockClosedOutline, cloudOutline, trashOutline
    });
  }
}
