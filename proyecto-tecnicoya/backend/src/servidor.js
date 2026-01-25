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
  const { correoDisponible } = require('./config/nodemailer');
  
  res.json({
    exito: true,
    mensaje: 'API TécnicoYa funcionando correctamente',
    version: '1.0.0',
    fecha: new Date().toISOString(),
    entorno: process.env.NODE_ENV || process.env.ENTORNO || 'desarrollo',
    servicios: {
      correo: correoDisponible() ? '✅ Activo' : '⏳ Inicializando...',
      mongodb: '✅ Conectado',
      cloudinary: '✅ Configurado'
    }
  });
});

// Ruta para probar envío de correo (solo desarrollo)
app.get('/api/test-correo', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !req.query.force) {
    return res.status(403).json({ exito: false, mensaje: 'No disponible en producción' });
  }

  const { inicializarCorreo, correoDisponible, enviarCorreoConReintentos } = require('./config/nodemailer');
  
  // Forzar inicialización si no está listo
  if (!correoDisponible()) {
    console.log('🔄 Forzando inicialización del correo...');
    await inicializarCorreo();
  }

  if (!correoDisponible()) {
    return res.json({
      exito: false,
      mensaje: 'Servicio de correo no disponible',
      configuracion: {
        EMAIL_USER: process.env.EMAIL_USER ? '✓ configurado' : '✗ falta',
        EMAIL_PASS: process.env.EMAIL_PASS ? '✓ configurado (' + process.env.EMAIL_PASS.length + ' chars)' : '✗ falta'
      }
    });
  }

  // Enviar correo de prueba
  const resultado = await enviarCorreoConReintentos({
    from: `"TécnicoYa Test" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Se envía a sí mismo
    subject: '✅ Test de correo - TécnicoYa',
    html: '<h1>¡El correo funciona!</h1><p>Este es un correo de prueba desde TécnicoYa API.</p>'
  });

  res.json({
    exito: resultado.exito,
    mensaje: resultado.exito ? 'Correo de prueba enviado' : 'Error al enviar correo',
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
