/**
 * Modelo de Servicio (Solicitudes)
 * TécnicoYa - Backend
 * Solicitudes de servicio creadas por clientes
 */

const mongoose = require('mongoose');

const esquemaServicio = new mongoose.Schema({
  idCliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El cliente es obligatorio']
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de servicio es obligatorio'],
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
  },
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  fotos: [{
    url: { type: String },
    publicId: { type: String }
  }],
  ubicacion: {
    direccion: {
      type: String,
      required: [true, 'La dirección es obligatoria']
    },
    referencia: {
      type: String,
      default: ''
    },
    coordenadas: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitud, latitud]
        required: true
      }
    }
  },
  urgencia: {
    type: String,
    enum: ['normal', 'emergencia'],
    default: 'normal'
  },
  estado: {
    type: String,
    enum: [
      'pendiente',      // Esperando cotizaciones
      'cotizado',       // Tiene cotizaciones
      'aceptado',       // Cotización aceptada
      'en_progreso',    // Trabajo en curso
      'completado',     // Trabajo terminado
      'cancelado'       // Cancelado
    ],
    default: 'pendiente'
  },
  // Para servicio inmediato (estilo Uber)
  esInmediato: {
    type: Boolean,
    default: false
  },
  precioAutomatico: {
    type: Number,
    default: null
  },
  tecnicosNotificados: [{
    idTecnico: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    notificadoEn: {
      type: Date,
      default: Date.now
    },
    respondio: {
      type: Boolean,
      default: false
    }
  }],
  // Fechas preferidas por el cliente
  fechaPreferida: {
    type: Date,
    default: null
  },
  horaPreferida: {
    type: String,
    default: null
  },
  // Historial de estados
  historialEstados: [{
    estado: String,
    fecha: {
      type: Date,
      default: Date.now
    },
    nota: String
  }],
  // Razón de cancelación si aplica
  motivoCancelacion: {
    type: String,
    default: null
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índice geoespacial para búsqueda por ubicación
esquemaServicio.index({ 'ubicacion.coordenadas': '2dsphere' });

// Índices para búsquedas frecuentes
esquemaServicio.index({ idCliente: 1, estado: 1 });
esquemaServicio.index({ estado: 1, tipo: 1 });
esquemaServicio.index({ fechaCreacion: -1 });

// Middleware para agregar al historial cuando cambia el estado
esquemaServicio.pre('save', function (siguiente) {
  if (this.isModified('estado')) {
    this.historialEstados.push({
      estado: this.estado,
      fecha: new Date()
    });
  }
  siguiente();
});

// Virtual para obtener el tiempo transcurrido
esquemaServicio.virtual('tiempoTranscurrido').get(function () {
  const ahora = new Date();
  const diferencia = ahora - this.fechaCreacion;

  const minutos = Math.floor(diferencia / (1000 * 60));
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

  if (dias > 0) return `${dias} día(s)`;
  if (horas > 0) return `${horas} hora(s)`;
  return `${minutos} minuto(s)`;
});

// Método estático para buscar servicios cercanos para técnicos
esquemaServicio.statics.buscarCercanos = function (coordenadas, radio = 10, tipo = null) {
  const consulta = {
    estado: 'pendiente',
    'ubicacion.coordenadas': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordenadas
        },
        $maxDistance: radio * 1000 // Convertir km a metros
      }
    }
  };

  if (tipo) {
    consulta.tipo = tipo;
  }

  return this.find(consulta)
    .populate('idCliente', 'perfil.nombre perfil.apellido perfil.fotoUrl')
    .sort({ fechaCreacion: -1 })
    .limit(20);
};

// Asegurar que los virtuals se incluyan en JSON
esquemaServicio.set('toJSON', { virtuals: true });
esquemaServicio.set('toObject', { virtuals: true });

module.exports = mongoose.model('Servicio', esquemaServicio);
