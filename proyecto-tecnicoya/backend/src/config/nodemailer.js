/**
 * Configuración de Nodemailer
 * TécnicoYa - Backend
 * Configuración del servicio de correos electrónicos
 */

const nodemailer = require('nodemailer');

// Crear transporter con configuración de Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Error al configurar el servicio de correo:', error.message);
  } else {
    console.log('✅ Servicio de correo configurado correctamente');
  }
});

module.exports = transporter;
