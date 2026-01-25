/**
 * Servidor Principal - TécnicoYa API
 * Punto de entrada de la aplicación backend
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');

// Importar configuraciones
const { conectarBaseDatos, crearIndices } = require('./config/basedatos');
const { configurarCloudinary } = require('./config/cloudinary');
const { inicializarSocket } = require('./config/socket');

// Importar rutas
const authRutas = require('./routes/auth.rutas');
const usuariosRutas = require('./routes/usuarios.rutas');
const serviciosRutas = require('./routes/servicios.rutas');
const cotizacionesRutas = require('./routes/cotizaciones.rutas');
const trabajosRutas = require('./routes/trabajos.rutas');
const resenasRutas = require('./routes/resenas.rutas');
const fidelizacionRutas = require('./routes/fidelizacion.rutas');
const membresiasRutas = require('./routes/membresias.rutas');
const mensajesRutas = require('./routes/mensajes.rutas');

// Importar middleware de errores
const { manejarErrorMulter } = require('./middleware/subidaArchivos');

// Crear aplicación Express
const app = express();
const servidor = http.createServer(app);

// Configurar Socket.io
inicializarSocket(servidor);

// Configurar Cloudinary
configurarCloudinary();

// ===== MIDDLEWARE GLOBALES =====

// CORS - Configurado para web y móvil
const origensPermitidos = [
  process.env.URL_FRONTEND || 'http://localhost:4200',
  'http://localhost:4200',
  'http://localhost:8100',
  'http://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  'https://localhost',
  // Permitir cualquier origen de Capacitor/Cordova en móvil
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como apps móviles nativas)
    if (!origin) return callback(null, true);
    
    // Verificar si el origen está en la lista permitida
    if (origensPermitidos.includes(origin) || 
        origin.startsWith('capacitor://') || 
        origin.startsWith('ionic://') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.')) {
      return callback(null, true);
    }
    
    // En desarrollo, permitir todo
    if (process.env.ENTORNO === 'desarrollo') {
      return callback(null, true);
    }
    
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}));

// Manejar preflight requests
app.options('*', cors());

// Parsear JSON
app.use(express.json({ limit: '10mb' }));

// Parsear URL encoded
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de requests (solo en desarrollo)
if (process.env.ENTORNO === 'desarrollo') {
  app.use((req, res, siguiente) => {
    console.log(`📨 ${req.method} ${req.url}`);
    siguiente();
  });
}

// ===== RUTAS DE LA API =====

// Ruta raíz - Health check básico
app.get('/', (req, res) => {
  res.json({
    exito: true,
    mensaje: '🔧 TécnicoYa API está funcionando',
    version: '1.0.0',
    endpoints: {
      salud: '/api/salud',
      auth: '/api/auth',
      servicios: '/api/servicios'
    }
  });
});

// Ruta de health check detallado
app.get('/api/salud', async (req, res) => {
  const { correoDisponible } = require('./config/sendgrid');
  
  res.json({
    exito: true,
    mensaje: 'API TécnicoYa funcionando correctamente',
    version: '1.0.0',
    fecha: new Date().toISOString(),
    entorno: process.env.NODE_ENV || process.env.ENTORNO || 'desarrollo',
    servicios: {
      correo: correoDisponible() ? '✅ SendGrid activo' : '⚠️ No configurado',
      mongodb: '✅ Conectado',
      cloudinary: '✅ Configurado'
    }
  });
});

// Ruta para probar envío de correo
app.get('/api/test-correo', async (req, res) => {
  const { inicializarCorreo, correoDisponible, enviarCorreo } = require('./config/sendgrid');
  
  // Forzar inicialización si no está listo
  if (!correoDisponible()) {
    console.log('🔄 Inicializando servicio de correo...');
    inicializarCorreo();
  }

  if (!correoDisponible()) {
    return res.json({
      exito: false,
      mensaje: 'Servicio de correo no disponible',
      configuracion: {
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '✓ configurado' : '✗ falta',
        EMAIL_FROM: process.env.EMAIL_FROM || 'no configurado'
      },
      ayuda: 'Configura SENDGRID_API_KEY en las variables de entorno'
    });
  }

  // Email de destino (puede ser query param o el default)
  const emailDestino = req.query.to || 'riveraariel433@gmail.com';

  // Enviar correo de prueba
  const resultado = await enviarCorreo({
    to: emailDestino,
    subject: '✅ Test de correo - TécnicoYa',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3880ff;">¡El correo funciona! 🎉</h1>
        <p>Este es un correo de prueba desde <strong>TécnicoYa API</strong>.</p>
        <p>Si recibes este mensaje, SendGrid está configurado correctamente.</p>
        <hr style="border: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">Enviado desde: ${process.env.EMAIL_FROM}</p>
      </div>
    `
  });

  res.json({
    exito: resultado.exito,
    mensaje: resultado.exito ? `Correo enviado a ${emailDestino}` : 'Error al enviar correo',
    detalles: resultado
  });
});


// Rutas principales
app.use('/api/auth', authRutas);
app.use('/api/usuarios', usuariosRutas);
app.use('/api/servicios', serviciosRutas);
app.use('/api/cotizaciones', cotizacionesRutas);
app.use('/api/trabajos', trabajosRutas);
app.use('/api/resenas', resenasRutas);
app.use('/api/fidelizacion', fidelizacionRutas);
app.use('/api/membresias', membresiasRutas);
app.use('/api/mensajes', mensajesRutas);

// ===== RUTAS DE VERIFICACIÓN WEB (para enlaces de correo) =====

// Importar modelo de Usuario para verificación
const Usuario = require('./models/Usuario');

// Ruta para confirmar cuenta desde el enlace del correo
app.get('/confirmar-cuenta/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    // Buscar usuario con ese token de verificación
    const usuario = await Usuario.findOne({
      tokenVerificacion: token,
      expiracionTokenVerificacion: { $gt: new Date() }
    });

    if (!usuario) {
      return res.send(generarPaginaHTML(
        'Enlace Inválido',
        '❌',
        'El enlace de confirmación es inválido o ha expirado.',
        'Por favor solicita un nuevo enlace de verificación desde la aplicación.',
        'error'
      ));
    }

    // Activar cuenta
    usuario.emailVerificado = true;
    usuario.tokenVerificacion = undefined;
    usuario.expiracionTokenVerificacion = undefined;
    await usuario.save();

    res.send(generarPaginaHTML(
      '¡Cuenta Verificada!',
      '✅',
      `¡Felicitaciones ${usuario.perfil?.nombre || 'Usuario'}!`,
      'Tu cuenta ha sido verificada exitosamente. Ya puedes iniciar sesión en la aplicación TécnicoYa.',
      'success'
    ));

  } catch (error) {
    console.error('Error verificando cuenta:', error);
    res.send(generarPaginaHTML(
      'Error',
      '⚠️',
      'Ocurrió un error al verificar tu cuenta.',
      'Por favor intenta nuevamente o contacta soporte.',
      'error'
    ));
  }
});

// Ruta para restablecer contraseña desde el enlace del correo
app.get('/restablecer-contrasena/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    // Verificar que el token sea válido
    const usuario = await Usuario.findOne({
      tokenRecuperacion: token,
      expiracionTokenRecuperacion: { $gt: new Date() }
    });

    if (!usuario) {
      return res.send(generarPaginaHTML(
        'Enlace Inválido',
        '❌',
        'El enlace de recuperación es inválido o ha expirado.',
        'Por favor solicita un nuevo enlace desde la aplicación.',
        'error'
      ));
    }

    // Mostrar formulario para nueva contraseña
    res.send(generarFormularioContrasena(token));

  } catch (error) {
    console.error('Error en restablecimiento:', error);
    res.send(generarPaginaHTML(
      'Error',
      '⚠️',
      'Ocurrió un error.',
      'Por favor intenta nuevamente.',
      'error'
    ));
  }
});

// Procesar nueva contraseña
app.post('/restablecer-contrasena/:token', express.urlencoded({ extended: true }), async (req, res) => {
  const { token } = req.params;
  const { contrasena, confirmarContrasena } = req.body;

  try {
    if (!contrasena || contrasena.length < 6) {
      return res.send(generarPaginaHTML(
        'Error',
        '❌',
        'Contraseña inválida',
        'La contraseña debe tener al menos 6 caracteres.',
        'error'
      ));
    }

    if (contrasena !== confirmarContrasena) {
      return res.send(generarPaginaHTML(
        'Error',
        '❌',
        'Las contraseñas no coinciden',
        'Por favor intenta nuevamente.',
        'error'
      ));
    }

    const usuario = await Usuario.findOne({
      tokenRecuperacion: token,
      expiracionTokenRecuperacion: { $gt: new Date() }
    });

    if (!usuario) {
      return res.send(generarPaginaHTML(
        'Enlace Inválido',
        '❌',
        'El enlace ha expirado.',
        'Por favor solicita un nuevo enlace.',
        'error'
      ));
    }

    // Actualizar contraseña
    usuario.contrasena = contrasena;
    usuario.tokenRecuperacion = undefined;
    usuario.expiracionTokenRecuperacion = undefined;
    await usuario.save();

    res.send(generarPaginaHTML(
      '¡Contraseña Actualizada!',
      '✅',
      'Tu contraseña ha sido cambiada exitosamente.',
      'Ya puedes iniciar sesión con tu nueva contraseña en la aplicación TécnicoYa.',
      'success'
    ));

  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.send(generarPaginaHTML(
      'Error',
      '⚠️',
      'Ocurrió un error al actualizar tu contraseña.',
      'Por favor intenta nuevamente.',
      'error'
    ));
  }
});

// Función para generar página HTML de resultado
function generarPaginaHTML(titulo, icono, mensaje, submensaje, tipo) {
  const colorFondo = tipo === 'success' ? '#10b981' : '#ef4444';
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titulo} - TécnicoYa</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
        }
        .titulo {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .mensaje {
          font-size: 18px;
          color: #4b5563;
          margin-bottom: 10px;
        }
        .submensaje {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }
        .boton {
          display: inline-block;
          margin-top: 30px;
          padding: 14px 40px;
          background: linear-gradient(135deg, #3880ff 0%, #5a9cff 100%);
          color: white;
          text-decoration: none;
          border-radius: 30px;
          font-weight: 600;
          font-size: 16px;
        }
        .logo { margin-bottom: 30px; font-size: 28px; font-weight: bold; color: #3880ff; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🔧 TécnicoYa</div>
        <div class="icon">${icono}</div>
        <h1 class="titulo">${titulo}</h1>
        <p class="mensaje">${mensaje}</p>
        <p class="submensaje">${submensaje}</p>
        <a href="tecnicoya://app/login" class="boton">Abrir App</a>
      </div>
    </body>
    </html>
  `;
}

// Función para generar formulario de nueva contraseña
function generarFormularioContrasena(token) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva Contraseña - TécnicoYa</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .card {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .logo { text-align: center; margin-bottom: 30px; font-size: 28px; font-weight: bold; color: #3880ff; }
        .titulo { font-size: 22px; font-weight: 700; color: #1f2937; margin-bottom: 10px; text-align: center; }
        .subtitulo { font-size: 14px; color: #6b7280; margin-bottom: 30px; text-align: center; }
        .campo { margin-bottom: 20px; }
        label { display: block; font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
        input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 16px;
          transition: border-color 0.2s;
        }
        input:focus { outline: none; border-color: #3880ff; }
        .boton {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #3880ff 0%, #5a9cff 100%);
          color: white;
          border: none;
          border-radius: 30px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          margin-top: 10px;
        }
        .boton:hover { opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🔧 TécnicoYa</div>
        <h1 class="titulo">Nueva Contraseña</h1>
        <p class="subtitulo">Ingresa tu nueva contraseña</p>
        <form method="POST" action="/restablecer-contrasena/${token}">
          <div class="campo">
            <label for="contrasena">Nueva contraseña</label>
            <input type="password" id="contrasena" name="contrasena" required minlength="6" placeholder="Mínimo 6 caracteres">
          </div>
          <div class="campo">
            <label for="confirmarContrasena">Confirmar contraseña</label>
            <input type="password" id="confirmarContrasena" name="confirmarContrasena" required minlength="6" placeholder="Repite tu contraseña">
          </div>
          <button type="submit" class="boton">Cambiar Contraseña</button>
        </form>
      </div>
    </body>
    </html>
  `;
}

// ===== MANEJO DE ERRORES =====

// Manejo de errores de Multer
app.use(manejarErrorMulter);

// Ruta no encontrada
app.use((req, res, siguiente) => {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta no encontrada: ${req.method} ${req.url}`
  });
});

// Manejador global de errores
app.use((error, req, res, siguiente) => {
  console.error('❌ Error:', error);

  // Error de validación de Mongoose
  if (error.name === 'ValidationError') {
    const mensajes = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({
      exito: false,
      mensaje: 'Error de validación',
      errores: mensajes
    });
  }

  // Error de ID inválido de Mongoose
  if (error.name === 'CastError') {
    return res.status(400).json({
      exito: false,
      mensaje: 'ID inválido'
    });
  }

  // Error de duplicado (índice único)
  if (error.code === 11000) {
    const campo = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      exito: false,
      mensaje: `Ya existe un registro con ese ${campo}`
    });
  }

  // Error genérico
  res.status(error.statusCode || 500).json({
    exito: false,
    mensaje: error.message || 'Error interno del servidor',
    ...(process.env.ENTORNO === 'desarrollo' && { stack: error.stack })
  });
});

// ===== INICIAR SERVIDOR =====

const PUERTO = process.env.PUERTO || 3000;

const iniciarServidor = async () => {
  try {
    // Conectar a MongoDB
    await conectarBaseDatos();

    // Crear índices
    await crearIndices();

    // Iniciar servidor HTTP
    // En Render/Railway, debemos escuchar en 0.0.0.0 para aceptar conexiones externas
    const HOST = process.env.HOST || '0.0.0.0';
    
    servidor.listen(PUERTO, HOST, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║                                                ║');
      console.log('║        🔧 TécnicoYa API v1.0.0 🔧             ║');
      console.log('║                                                ║');
      console.log(`║   Servidor corriendo en puerto: ${PUERTO}            ║`);
      console.log('║                                                ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log('');
      console.log(`🌐 Host: ${HOST}:${PUERTO}`);
      console.log(`📡 Socket.io: habilitado`);
      console.log(`💊 Health Check: /api/salud`);
      console.log(`🔄 Entorno: ${process.env.NODE_ENV || process.env.ENTORNO || 'desarrollo'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Promesa rechazada no manejada:', error);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  servidor.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Iniciar servidor
iniciarServidor();

module.exports = { app, servidor };
