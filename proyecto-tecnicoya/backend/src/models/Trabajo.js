/**
 * Modelo de Trabajo
 * TécnicoYa - Backend
 * Trabajos aceptados y en progreso
 */

const mongoose = require('mongoose');

const esquemaTrabajo = new mongoose.Schema({
  idServicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: [true, 'El servicio es obligatorio']
  },
  idCotizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion',
    required: [true, 'La cotización es obligatoria']
  },
  idCliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El cliente es obligatorio']
  },
  idTecnico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El técnico es obligatorio']
  },
  fechaProgramada: {
    type: Date,
    required: [true, 'La fecha programada es obligatoria']
  },
  horaProgramada: {
    type: String,
    default: null
  },
  estado: {
    type: String,
    enum: [
      'programado',     // Trabajo agendado
      'en_camino',      // Técnico en camino
      'en_progreso',    // Trabajo iniciado
      'completado',     // Trabajo terminado
      'cancelado',      // Cancelado
      'disputa'         // En disputa
    ],
    default: 'programado'
  },
  // Fotos del trabajo
  fotosAntes: [{
    url: { type: String },
    publicId: { type: String },
    descripcion: { type: String },
    fechaSubida: { type: Date, default: Date.now }
  }],
  fotosDespues: [{
    url: { type: String },
    publicId: { type: String },
    descripcion: { type: String },
    fechaSubida: { type: Date, default: Date.now }
  }],
  // Información de pago
  pago: {
    monto: {
      type: Number,
      required: true
    },
    metodo: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia'],
      default: 'efectivo'
    },
    estado: {
      type: String,
      enum: ['pendiente', 'retenido', 'liberado', 'reembolsado', 'parcial'],
      default: 'pendiente'
    },
    comision: {
      type: Number,
      default: 0
    },
    porcentajeComision: {
      type: Number,
      default: 12 // 12% normal, 20% emergencia
    },
    montoNeto: {
      type: Number, // Monto que recibe el técnico
      default: 0
    },
    // Sistema de garantía
    tarifaGarantia: {
      type: Number,
      default: 0
    },
    tieneGarantia: {
      type: Boolean,
      default: false
    },
    garantiaAprobada: {
      type: Boolean,
      default: null
    },
    fechaPago: {
      type: Date,
      default: null
    }
  },
  // Información de disputa si aplica
  disputa: {
    motivo: { type: String },
    descripcion: { type: String },
    fotos: [{ type: String }],
    fechaApertura: { type: Date },
    estado: {
      type: String,
      enum: ['abierta', 'en_revision', 'resuelta'],
      default: 'abierta'
    },
    resolucion: { type: String },
    montoReembolsado: { type: Number, default: 0 }
  },
  // Historial de estados con timestamps
  historialEstados: [{
    estado: String,
    fecha: { type: Date, default: Date.now },
    ubicacion: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: [Number]
    },
    nota: String
  }],
  // Tracking de ubicación del técnico
  ubicacionTecnico: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  ultimaActualizacionUbicacion: {
    type: Date,
    default: null
  },
  // Notas y observaciones
  notasCliente: {
    type: String,
    default: ''
  },
  notasTecnico: {
    type: String,
    default: ''
  },
  // Calificaciones (referencias a Reseñas)
  resenaCliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resena',
    default: null
  },
  resenaTecnico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resena',
    default: null
  },
  // Fechas importantes
  fechaInicio: {
    type: Date,
    default: null
  },
  fechaFinalizacion: {
    type: Date,
    default: null
  },
  duracionReal: {
    type: Number, // En minutos
    default: null
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índices para búsquedas frecuentes
esquemaTrabajo.index({ idCliente: 1, estado: 1 });
esquemaTrabajo.index({ idTecnico: 1, estado: 1 });
esquemaTrabajo.index({ fechaProgramada: 1 });
esquemaTrabajo.index({ 'ubicacionTecnico': '2dsphere' });

// Middleware para agregar al historial cuando cambia el estado
esquemaTrabajo.pre('save', function (siguiente) {
  if (this.isModified('estado')) {
    this.historialEstados.push({
      estado: this.estado,
      fecha: new Date()
    });

    // Actualizar fechas según estado
    if (this.estado === 'en_progreso' && !this.fechaInicio) {
      this.fechaInicio = new Date();
    }

    if (this.estado === 'completado' && !this.fechaFinalizacion) {
      this.fechaFinalizacion = new Date();

      // Calcular duración real
      if (this.fechaInicio) {
        this.duracionReal = Math.floor((this.fechaFinalizacion - this.fechaInicio) / (1000 * 60));
      }
    }
  }
  siguiente();
});

// Virtual para verificar si puede ser cancelado
esquemaTrabajo.virtual('puedeCancelarse').get(function () {
  return ['programado'].includes(this.estado);
});

// Virtual para verificar si está activo
esquemaTrabajo.virtual('estaActivo').get(function () {
  return ['programado', 'en_camino', 'en_progreso'].includes(this.estado);
});

// Virtual para obtener porcentaje de progreso
esquemaTrabajo.virtual('porcentajeProgreso').get(function () {
  const estados = {
    'programado': 20,
    'en_camino': 40,
    'en_progreso': 60,
    'completado': 100,
    'cancelado': 0,
    'disputa': 80
  };
  return estados[this.estado] || 0;
});

// Método para calcular pago con garantía
esquemaTrabajo.methods.calcularPago = function (tieneGarantia = false, esEmergencia = false) {
  const monto = this.pago.monto;
  const porcentajeComision = esEmergencia ? 20 : 12;
  const comision = monto * (porcentajeComision / 100);

  let tarifaGarantia = 0;
  if (tieneGarantia) {
    tarifaGarantia = monto * 0.03; // 3% adicional
  }

  const montoNeto = monto - comision;

  this.pago.porcentajeComision = porcentajeComision;
  this.pago.comision = comision;
  this.pago.tarifaGarantia = tarifaGarantia;
  this.pago.tieneGarantia = tieneGarantia;
  this.pago.montoNeto = montoNeto;

  if (tieneGarantia) {
    this.pago.estado = 'retenido';
  }

  return {
    monto,
    comision,
    tarifaGarantia,
    montoNeto,
    total: monto + tarifaGarantia
  };
};

// Método para aprobar trabajo (Sistema de Garantía)
esquemaTrabajo.methods.aprobarTrabajo = function () {
  if (this.pago.tieneGarantia) {
    this.pago.garantiaAprobada = true;
    this.pago.estado = 'liberado';
    this.pago.fechaPago = new Date();
  }
  return this;
};

// Método para abrir disputa
esquemaTrabajo.methods.abrirDisputa = function (motivo, descripcion, fotos = []) {
  this.estado = 'disputa';
  this.disputa = {
    motivo,
    descripcion,
    fotos,
    fechaApertura: new Date(),
    estado: 'abierta'
  };

  // Liberar 50% automáticamente
  if (this.pago.tieneGarantia) {
    this.pago.estado = 'parcial';
    this.disputa.montoReembolsado = this.pago.monto * 0.5;
  }

  return this;
};

// Método estático para obtener trabajos activos de un usuario
esquemaTrabajo.statics.obtenerActivos = function (idUsuario, rol) {
  const filtro = rol === 'tecnico'
    ? { idTecnico: idUsuario }
    : { idCliente: idUsuario };

  return this.find({
    ...filtro,
    estado: { $in: ['programado', 'en_camino', 'en_progreso'] }
  })
    .populate('idServicio')
    .populate('idCliente', 'perfil')
    .populate('idTecnico', 'perfil datosTecnico')
    .sort({ fechaProgramada: 1 });
};

// Asegurar que los virtuals se incluyan en JSON
esquemaTrabajo.set('toJSON', { virtuals: true });
esquemaTrabajo.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trabajo', esquemaTrabajo);
