/**
 * Modelo de Cotización
 * TécnicoYa - Backend
 * Cotizaciones enviadas por técnicos
 */

const mongoose = require('mongoose');

const esquemaCotizacion = new mongoose.Schema({
  idServicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: [true, 'El servicio es obligatorio']
  },
  idTecnico: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El técnico es obligatorio']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  tiempoEstimado: {
    valor: {
      type: Number,
      required: [true, 'El tiempo estimado es obligatorio'],
      min: [1, 'El tiempo estimado debe ser al menos 1']
    },
    unidad: {
      type: String,
      enum: ['minutos', 'horas', 'dias'],
      default: 'horas'
    }
  },
  descripcionTrabajo: {
    type: String,
    required: [true, 'La descripción del trabajo es obligatoria'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  materiales: [{
    nombre: {
      type: String,
      required: true
    },
    cantidad: {
      type: Number,
      default: 1
    },
    precioUnitario: {
      type: Number,
      default: 0
    },
    incluidoEnPrecio: {
      type: Boolean,
      default: true
    }
  }],
  costoMateriales: {
    type: Number,
    default: 0
  },
  costoManoObra: {
    type: Number,
    default: 0
  },
  validoHasta: {
    type: Date,
    required: true,
    default: function () {
      // Por defecto válido por 48 horas
      return new Date(Date.now() + 48 * 60 * 60 * 1000);
    }
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptada', 'rechazada', 'no_seleccionada', 'expirada', 'cancelada'],
    default: 'pendiente'
  },
  // Mensaje amigable cuando el cliente elige otra cotización
  motivoNoSeleccion: {
    type: String,
    default: null
  },
  notasAdicionales: {
    type: String,
    maxlength: [300, 'Las notas no pueden exceder 300 caracteres']
  },
  // Información del técnico al momento de cotizar (snapshot)
  datosTecnicoSnapshot: {
    nombre: String,
    calificacion: Number,
    trabajosCompletados: Number,
    fotoUrl: String
  },
  // Fecha de respuesta del cliente
  fechaRespuesta: {
    type: Date,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índices para búsquedas frecuentes
esquemaCotizacion.index({ idServicio: 1, estado: 1 });
esquemaCotizacion.index({ idTecnico: 1, estado: 1 });
esquemaCotizacion.index({ fechaCreacion: -1 });

// Virtual para verificar si está vigente
esquemaCotizacion.virtual('estaVigente').get(function () {
  return this.estado === 'pendiente' && new Date() < this.validoHasta;
});

// Virtual para obtener el precio total (mano de obra + materiales)
esquemaCotizacion.virtual('precioTotal').get(function () {
  return this.precio;
});

// Virtual para tiempo restante de validez
esquemaCotizacion.virtual('tiempoRestante').get(function () {
  if (this.estado !== 'pendiente') return null;

  const ahora = new Date();
  const diferencia = this.validoHasta - ahora;

  if (diferencia <= 0) return 'Expirada';

  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

  return `${horas}h ${minutos}m`;
});

// Middleware para actualizar estado a expirada si ya pasó la fecha
esquemaCotizacion.pre('find', function () {
  // Esto se ejecuta antes de cada búsqueda
});

// Método para verificar y actualizar cotizaciones expiradas
esquemaCotizacion.statics.actualizarExpiradas = async function () {
  const resultado = await this.updateMany(
    {
      estado: 'pendiente',
      validoHasta: { $lt: new Date() }
    },
    {
      $set: { estado: 'expirada' }
    }
  );

  return resultado.modifiedCount;
};

// Método estático para obtener cotizaciones de un servicio ordenadas
esquemaCotizacion.statics.obtenerPorServicio = function (idServicio) {
  return this.find({ idServicio, estado: 'pendiente' })
    .populate('idTecnico', 'perfil datosTecnico')
    .sort({ precio: 1 }); // Ordenar por precio ascendente
};

// Asegurar que los virtuals se incluyan en JSON
esquemaCotizacion.set('toJSON', { virtuals: true });
esquemaCotizacion.set('toObject', { virtuals: true });

// Usar nombre de colección en español
module.exports = mongoose.model('Cotizacion', esquemaCotizacion, 'cotizaciones');
