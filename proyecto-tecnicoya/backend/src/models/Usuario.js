/**
 * Modelo de Usuario
 * TécnicoYa - Backend
 * Incluye tanto clientes como técnicos
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const esquemaUsuario = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingresa un email válido']
  },
  contrasena: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false // No incluir por defecto en queries
  },
  rol: {
    type: String,
    enum: ['cliente', 'tecnico'],
    required: [true, 'El rol es obligatorio']
  },
  perfil: {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    apellido: {
      type: String,
      required: [true, 'El apellido es obligatorio'],
      trim: true
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      trim: true
    },
    fotoUrl: {
      type: String,
      default: null
    },
    direccion: {
      calle: { type: String, default: '' },
      ciudad: { type: String, default: '' },
      referencia: { type: String, default: '' }
      // NOTA: Las coordenadas NO se guardan aquí por privacidad
      // Los clientes solo proporcionan coordenadas en sus solicitudes de servicio
      // Los técnicos tienen su ubicación en datosTecnico.ubicacionBase
    }
  },
  // Datos específicos de clientes (para que técnicos puedan calificarlos)
  datosCliente: {
    calificacion: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalResenas: {
      type: Number,
      default: 0
    },
    serviciosSolicitados: {
      type: Number,
      default: 0
    }
  },
  // Datos específicos de técnicos
  datosTecnico: {
    especialidades: [{
      type: String,
      enum: [
        'plomeria',
        'electricidad',
        'cerrajeria',
        'carpinteria',
        'pintura',
        'aire_acondicionado',
        'refrigeracion',
        'albanileria',
        'herreria',
        'jardineria',
        'limpieza',
        'mudanzas',
        'electrodomesticos',
        'computadoras',
        'otro'
      ]
    }],
    descripcion: {
      type: String,
      default: '',
      maxlength: [500, 'La descripción no puede exceder 500 caracteres']
    },
    certificaciones: [{
      nombre: { type: String },
      url: { type: String }, // URL de Cloudinary
      fechaEmision: { type: Date }
    }],
    portafolio: [{
      titulo: { type: String },
      descripcion: { type: String },
      imagenes: [{ type: String }] // URLs de Cloudinary
    }],
    verificado: {
      type: Boolean,
      default: false
    },
    calificacion: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalResenas: {
      type: Number,
      default: 0
    },
    trabajosCompletados: {
      type: Number,
      default: 0
    },
    // Sistema de fondos/ganancias del técnico
    fondos: {
      disponible: {
        type: Number,
        default: 0
      },
      pendiente: {
        type: Number,
        default: 0
      },
      totalGanado: {
        type: Number,
        default: 0
      },
      totalRetirado: {
        type: Number,
        default: 0
      }
    },
    // Historial de retiros
    historialRetiros: [{
      monto: { type: Number },
      fecha: { type: Date, default: Date.now },
      estado: {
        type: String,
        enum: ['pendiente', 'procesando', 'completado', 'rechazado'],
        default: 'pendiente'
      },
      banco: { type: String },
      numeroCuenta: { type: String },
      titular: { type: String }
    }],
    esPremium: {
      type: Boolean,
      default: false
    },
    // Sistema de membresías para técnicos
    membresia: {
      tipo: {
        type: String,
        enum: ['basico', 'profesional', 'premium'],
        default: 'basico'
      },
      fechaInicio: {
        type: Date,
        default: null
      },
      fechaVencimiento: {
        type: Date,
        default: null
      },
      // Beneficios según plan
      radioExtendido: {
        type: Number,
        default: 0 // km adicionales al radio base
      },
      posicionDestacada: {
        type: Boolean,
        default: false
      },
      badgeVerificado: {
        type: Boolean,
        default: false
      },
      // Historial de pagos
      historialPagos: [{
        monto: Number,
        fecha: { type: Date, default: Date.now },
        tipoPlan: String,
        metodoPago: String,
        referencia: String
      }]
    },
    emergencia24h: {
      type: Boolean,
      default: false
    },
    disponibleAhora: {
      type: Boolean,
      default: true // Por defecto el técnico está disponible
    },
    // Ubicación base del técnico (para búsquedas por cercanía)
    ubicacionBase: {
      direccion: { type: String, default: '' },
      ciudad: { type: String, default: '' },
      coordenadas: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitud, latitud]
          default: [0, 0]
        }
      }
    },
    radioTrabajo: {
      type: Number,
      default: 15, // km (radio base)
      min: 1,
      max: 50
    },
    zonasCobertura: [{
      nombre: { type: String },
      radio: { type: Number, default: 10 } // km
    }]
  },
  // Sistema de fidelización (SOLO PARA CLIENTES)
  puntosLealtad: {
    type: Number,
    default: 0
  },
  historialPuntos: [{
    tipo: {
      type: String,
      enum: ['ganado', 'canjeado']
    },
    cantidad: Number,
    descripcion: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  }],
  // Metadatos
  activo: {
    type: Boolean,
    default: true
  },
  ultimaConexion: {
    type: Date,
    default: Date.now
  },
  tokenRecuperacion: String,
  expiracionTokenRecuperacion: Date
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índice geoespacial para búsquedas por ubicación (solo técnicos tienen ubicación)
esquemaUsuario.index({ 'datosTecnico.ubicacionBase.coordenadas': '2dsphere' });

// Índice para búsqueda de técnicos
esquemaUsuario.index({ rol: 1, 'datosTecnico.especialidades': 1 });
esquemaUsuario.index({ rol: 1, 'datosTecnico.calificacion': -1 });

// Hash de contraseña antes de guardar
esquemaUsuario.pre('save', async function (siguiente) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified('contrasena')) {
    return siguiente();
  }

  try {
    const sal = await bcrypt.genSalt(10);
    this.contrasena = await bcrypt.hash(this.contrasena, sal);
    siguiente();
  } catch (error) {
    siguiente(error);
  }
});

// Método para comparar contraseñas
esquemaUsuario.methods.compararContrasena = async function (contrasenaIngresada) {
  return await bcrypt.compare(contrasenaIngresada, this.contrasena);
};

// Método para obtener nombre completo
esquemaUsuario.methods.obtenerNombreCompleto = function () {
  return `${this.perfil.nombre} ${this.perfil.apellido}`;
};

// Método para agregar puntos de lealtad (SOLO CLIENTES)
esquemaUsuario.methods.agregarPuntosLealtad = function (cantidad, descripcion) {
  // Solo clientes pueden ganar puntos
  if (this.rol !== 'cliente') {
    return 0;
  }

  if (cantidad > 0) {
    this.puntosLealtad += cantidad;
    this.historialPuntos.push({
      tipo: 'ganado',
      cantidad: cantidad,
      descripcion: descripcion || `Puntos ganados`
    });
  }

  return cantidad;
};

// Método para canjear puntos (SOLO CLIENTES)
esquemaUsuario.methods.canjearPuntos = function (puntos) {
  // Solo clientes pueden canjear puntos
  if (this.rol !== 'cliente') {
    throw new Error('Solo los clientes pueden canjear puntos');
  }

  if (this.puntosLealtad < puntos) {
    throw new Error('Puntos insuficientes');
  }

  this.puntosLealtad -= puntos;
  this.historialPuntos.push({
    tipo: 'canjeado',
    cantidad: puntos,
    descripcion: `Canje de ${puntos} puntos`
  });

  // Cada 100 puntos = $10 de descuento
  return Math.floor(puntos / 100) * 10;
};

// Virtual para obtener datos públicos del técnico
esquemaUsuario.virtual('perfilPublico').get(function () {
  return {
    id: this._id,
    nombre: this.perfil.nombre,
    apellido: this.perfil.apellido,
    fotoUrl: this.perfil.fotoUrl,
    rol: this.rol,
    ...(this.rol === 'tecnico' && {
      especialidades: this.datosTecnico.especialidades,
      calificacion: this.datosTecnico.calificacion,
      totalResenas: this.datosTecnico.totalResenas,
      trabajosCompletados: this.datosTecnico.trabajosCompletados,
      verificado: this.datosTecnico.verificado,
      emergencia24h: this.datosTecnico.emergencia24h
    })
  };
});

// Asegurar que los virtuals se incluyan en JSON
esquemaUsuario.set('toJSON', { virtuals: true });
esquemaUsuario.set('toObject', { virtuals: true });

module.exports = mongoose.model('Usuario', esquemaUsuario);
