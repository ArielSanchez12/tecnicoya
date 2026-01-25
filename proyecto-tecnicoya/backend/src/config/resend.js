/**
 * Configuración de Resend
 * TécnicoYa - Backend
 * Servicio de correos electrónicos con Resend
 */

const { Resend } = require('resend');

let resend = null;
let correoConfigurado = false;

/**
 * Inicializa el cliente de Resend
 */
const inicializarCorreo = () => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY no configurada');
      return false;
    }

    if (process.env.RESEND_API_KEY === 're_PEGA_TU_API_KEY_AQUI') {
      console.log('⚠️ Debes reemplazar RESEND_API_KEY con tu API Key real');
      return false;
    }

    resend = new Resend(process.env.RESEND_API_KEY);
    correoConfigurado = true;
    console.log('✅ Servicio de correo (Resend) configurado correctamente');
    return true;

  } catch (error) {
    console.log('❌ Error configurando Resend:', error.message);
    correoConfigurado = false;
    return false;
  }
};

/**
 * Verifica si el servicio está disponible
 */
const correoDisponible = () => correoConfigurado;

/**
 * Envía un correo usando Resend
 */
const enviarCorreo = async ({ to, subject, html }) => {
  if (!resend) {
    console.log('⚠️ Resend no inicializado, intentando inicializar...');
    inicializarCorreo();
    
    if (!resend) {
      return { exito: false, error: 'Servicio de correo no disponible' };
    }
  }

  try {
    const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: `TécnicoYa <${emailFrom}>`,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html
    });

    if (error) {
      console.error('❌ Error Resend:', error);
      return { exito: false, error: error.message };
    }

    console.log(`✅ Correo enviado a ${to} (ID: ${data.id})`);
    return { exito: true, id: data.id };

  } catch (error) {
    console.error('❌ Error al enviar correo:', error.message);
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
