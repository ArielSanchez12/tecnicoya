/**
 * Configuración de SendGrid
 * TécnicoYa - Backend
 * Servicio de correos electrónicos con SendGrid
 */

const sgMail = require('@sendgrid/mail');

let correoConfigurado = false;

/**
 * Inicializa SendGrid con la API Key
 */
const inicializarCorreo = () => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('⚠️ SENDGRID_API_KEY no configurada');
      return false;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    correoConfigurado = true;
    console.log('✅ Servicio de correo (SendGrid) configurado correctamente');
    console.log('   Email remitente:', process.env.EMAIL_FROM);
    return true;

  } catch (error) {
    console.log('❌ Error configurando SendGrid:', error.message);
    correoConfigurado = false;
    return false;
  }
};

/**
 * Verifica si el servicio está disponible
 */
const correoDisponible = () => correoConfigurado;

/**
 * Envía un correo usando SendGrid
 */
const enviarCorreo = async ({ to, subject, html }) => {
  if (!correoConfigurado) {
    console.log('⚠️ SendGrid no inicializado, intentando inicializar...');
    inicializarCorreo();
    
    if (!correoConfigurado) {
      return { exito: false, error: 'Servicio de correo no disponible' };
    }
  }

  try {
    const emailFrom = process.env.EMAIL_FROM || 'noreply@tecnicoya.com';
    
    const msg = {
      to: to,
      from: {
        email: emailFrom,
        name: 'TécnicoYa'
      },
      subject: subject,
      html: html
    };

    const response = await sgMail.send(msg);
    console.log(`✅ Correo enviado a ${to} (Status: ${response[0].statusCode})`);
    return { exito: true, statusCode: response[0].statusCode };

  } catch (error) {
    console.error('❌ Error al enviar correo:', error.message);
    if (error.response) {
      console.error('   Detalles:', error.response.body);
    }
    return { exito: false, error: error.message };
  }
};

// Inicializar al cargar el módulo
inicializarCorreo();

module.exports = {
  inicializarCorreo,
  correoDisponible,
  enviarCorreo
};
