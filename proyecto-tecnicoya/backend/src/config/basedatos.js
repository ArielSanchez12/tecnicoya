/**
 * Configuración de conexión a MongoDB Atlas
 * TécnicoYa - Backend
 * Con reconexión automática para producción
 */

const mongoose = require('mongoose');

// Contador de intentos de reconexión
let intentosReconexion = 0;
const MAX_INTENTOS = 10;
const TIEMPO_ESPERA_BASE = 5000; // 5 segundos

const conectarBaseDatos = async () => {
  try {
    // Configuración optimizada para MongoDB Atlas
    const opciones = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Forzar IPv4
      retryWrites: true,
      retryReads: true,
    };

    const conexion = await mongoose.connect(process.env.MONGODB_URI, opciones);

    console.log(`✅ MongoDB conectado: ${conexion.connection.host}`);
    console.log(`📦 Base de datos: ${conexion.connection.name}`);
    intentosReconexion = 0; // Reset contador en conexión exitosa

    // Manejar eventos de conexión
    mongoose.connection.on('error', (error) => {
      console.error('❌ Error de MongoDB:', error.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado - intentando reconectar...');
      reconectarConRetraso();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado exitosamente');
      intentosReconexion = 0;
    });

    return conexion;
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    
    // Intentar reconectar en producción
    if (process.env.ENTORNO === 'produccion' || process.env.NODE_ENV === 'production') {
      reconectarConRetraso();
    } else {
      process.exit(1);
    }
  }
};

// Función de reconexión con backoff exponencial
const reconectarConRetraso = () => {
  if (intentosReconexion >= MAX_INTENTOS) {
    console.error('❌ Máximo de intentos de reconexión alcanzado. Reiniciando proceso...');
    process.exit(1); // El proceso se reiniciará si está en un servicio como Railway/Render
    return;
  }

  intentosReconexion++;
  const tiempoEspera = TIEMPO_ESPERA_BASE * Math.min(intentosReconexion, 5);
  
  console.log(`🔄 Intento de reconexión ${intentosReconexion}/${MAX_INTENTOS} en ${tiempoEspera/1000}s...`);
  
  setTimeout(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Reconexión exitosa');
      intentosReconexion = 0;
    } catch (error) {
      console.error('❌ Reconexión fallida:', error.message);
      reconectarConRetraso();
    }
  }, tiempoEspera);
};

// Crear índices para optimizar consultas frecuentes
const crearIndices = async () => {
  try {
    const Usuario = require('../models/Usuario');
    const Servicio = require('../models/Servicio');
    const Trabajo = require('../models/Trabajo');

    // Índice geoespacial para ubicación de técnicos
    await Usuario.collection.createIndex(
      { 'datosTecnico.ubicacionBase.coordenadas': '2dsphere' },
      { background: true, sparse: true }
    ).catch(() => {});

    // Índice para búsqueda de técnicos por especialidad
    await Usuario.collection.createIndex(
      { 'datosTecnico.especialidades': 1 },
      { background: true }
    ).catch(() => {});

    // Índice geoespacial para servicios - CRÍTICO para búsqueda por ubicación
    await Servicio.collection.createIndex(
      { 'ubicacion.coordenadas': '2dsphere' },
      { background: true }
    ).catch(() => {});

    // Índice compuesto para servicios por estado y ubicación
    await Servicio.collection.createIndex(
      { estado: 1, fechaCreacion: -1 },
      { background: true }
    ).catch(() => {});

    // Índice para trabajos por usuario y estado
    await Trabajo.collection.createIndex(
      { idCliente: 1, estado: 1 },
      { background: true }
    ).catch(() => {});
    
    await Trabajo.collection.createIndex(
      { idTecnico: 1, estado: 1 },
      { background: true }
    ).catch(() => {});

    console.log('📇 Índices de MongoDB verificados/creados correctamente');
  } catch (error) {
    console.warn('⚠️ Algunos índices ya existen o no se pudieron crear:', error.message);
  }
};

module.exports = { conectarBaseDatos, crearIndices };
