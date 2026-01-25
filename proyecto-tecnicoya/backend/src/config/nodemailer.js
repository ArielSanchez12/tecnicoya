/**
 * Configuración de Nodemailer
 * TécnicoYa - Backend
 * Configuración del servicio de correos electrónicos
 */

const nodemailer = require('nodemailer');

let transporter = null;
let correoConfigurado = false;

/**
 * Inicializa el transporter de nodemailer
 * No bloquea si falla - el servicio de correo es opcional
 */
const inicializarCorreo = async () => {
  try {
    // Verificar que existan las credenciales
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Credenciales de correo no configuradas - servicio de correo deshabilitado');
      return;
    }

    // Crear transporter con configuración de Gmail
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Timeouts más cortos para no bloquear
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Verificar conexión (con timeout)
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout verificando correo')), 15000)
      )
    ]);
    
    correoConfigurado = true;
    console.log('✅ Servicio de correo configurado correctamente');
  } catch (error) {
    console.log('⚠️ Servicio de correo no disponible:', error.message);
    console.log('   La app funcionará sin envío de correos');
    transporter = null;
    correoConfigurado = false;
  }
};

/**
 * Obtiene el transporter si está disponible
 */
const obtenerTransporter = () => {
  if (!transporter || !correoConfigurado) {
    console.log('⚠️ Intento de enviar correo pero el servicio no está disponible');
    return null;
  }
  return transporter;
};

/**
 * Verifica si el servicio de correo está disponible
 */
const correoDisponible = () => correoConfigurado;

// Inicializar en segundo plano (no bloquea el inicio del servidor)
setTimeout(() => {
  inicializarCorreo();
}, 2000);

module.exports = {
  obtenerTransporter,
  correoDisponible,
  inicializarCorreo
};
