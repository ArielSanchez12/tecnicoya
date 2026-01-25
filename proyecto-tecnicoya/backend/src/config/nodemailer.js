/**
 * Configuración de Nodemailer
 * TécnicoYa - Backend
 * Configuración del servicio de correos electrónicos
 */

const nodemailer = require('nodemailer');

let transporter = null;
let correoConfigurado = false;
let intentosReconexion = 0;
const MAX_INTENTOS = 3;

/**
 * Crea el transporter con configuración optimizada para servicios cloud
 */
const crearTransporter = () => {
  return nodemailer.createTransport({
    // Configuración explícita de Gmail (más confiable que 'service')
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Pool de conexiones para mejor rendimiento
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    // Timeouts más largos para servicios cloud
    connectionTimeout: 30000,  // 30 segundos
    greetingTimeout: 30000,
    socketTimeout: 60000,
    // Configuración adicional
    tls: {
      rejectUnauthorized: false // Permite certificados auto-firmados
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  });
};

/**
 * Inicializa el transporter de nodemailer con reintentos
 */
const inicializarCorreo = async () => {
  try {
    // Verificar que existan las credenciales
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️ Credenciales de correo no configuradas');
      console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✓ configurado' : '✗ falta');
      console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ configurado' : '✗ falta');
      return false;
    }

    console.log('📧 Inicializando servicio de correo...');
    console.log('   Usuario:', process.env.EMAIL_USER);
    
    // Crear transporter
    transporter = crearTransporter();

    // Verificar conexión con timeout extendido
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout verificando conexión SMTP (30s)'));
      }, 30000);

      transporter.verify((error, success) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve(success);
        }
      });
    });
    
    correoConfigurado = true;
    intentosReconexion = 0;
    console.log('✅ Servicio de correo configurado correctamente');
    return true;

  } catch (error) {
    console.log('⚠️ Error configurando correo:', error.message);
    
    // Reintentar si no hemos excedido los intentos
    if (intentosReconexion < MAX_INTENTOS) {
      intentosReconexion++;
      const tiempoEspera = intentosReconexion * 10000; // 10s, 20s, 30s
      console.log(`   Reintentando en ${tiempoEspera/1000}s (intento ${intentosReconexion}/${MAX_INTENTOS})...`);
      
      setTimeout(() => {
        inicializarCorreo();
      }, tiempoEspera);
    } else {
      console.log('❌ No se pudo configurar el correo después de varios intentos');
      console.log('   Verifica que:');
      console.log('   1. La cuenta de Gmail tenga verificación en 2 pasos activada');
      console.log('   2. EMAIL_PASS sea una "Contraseña de aplicación" (no la contraseña normal)');
      console.log('   3. Para crear App Password: Google Account → Seguridad → Contraseñas de aplicaciones');
    }
    
    transporter = null;
    correoConfigurado = false;
    return false;
  }
};

/**
 * Obtiene el transporter, intentando reconectar si es necesario
 */
const obtenerTransporter = () => {
  if (!transporter) {
    console.log('⚠️ Transporter no disponible');
    return null;
  }
  return transporter;
};

/**
 * Verifica si el servicio de correo está disponible
 */
const correoDisponible = () => correoConfigurado;

/**
 * Envía un correo con reintentos automáticos
 */
const enviarCorreoConReintentos = async (mailOptions, intentos = 3) => {
  for (let i = 0; i < intentos; i++) {
    try {
      if (!transporter) {
        // Intentar inicializar si no está listo
        await inicializarCorreo();
        if (!transporter) {
          throw new Error('Servicio de correo no disponible');
        }
      }

      const resultado = await transporter.sendMail(mailOptions);
      console.log(`✅ Correo enviado a ${mailOptions.to}`);
      return { exito: true, resultado };
      
    } catch (error) {
      console.log(`⚠️ Intento ${i + 1}/${intentos} fallido:`, error.message);
      
      // Si es error de conexión, reintentar
      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        transporter = null;
        correoConfigurado = false;
        
        if (i < intentos - 1) {
          console.log('   Esperando 5s antes de reintentar...');
          await new Promise(r => setTimeout(r, 5000));
        }
      } else {
        // Error no recuperable
        break;
      }
    }
  }
  
  return { exito: false, error: 'No se pudo enviar el correo' };
};

// Inicializar después de que el servidor arranque (no bloquea)
setTimeout(() => {
  inicializarCorreo();
}, 3000);

module.exports = {
  obtenerTransporter,
  correoDisponible,
  inicializarCorreo,
  enviarCorreoConReintentos
};
