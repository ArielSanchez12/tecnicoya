/**
 * Modelo de Mensaje
 * TécnicoYa - Backend
 * Chat en tiempo real entre cliente y técnico
 */

const mongoose = require('mongoose');

const esquemaMensaje = new mongoose.Schema({
  idTrabajo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trabajo',
    required: false // Opcional para permitir chat directo
  },
  idEmisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El emisor es obligatorio']
  },
  idReceptor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false // Para chat directo sin trabajo
  },
  contenido: {
    type: String,
    required: [true, 'El contenido del mensaje es obligatorio'],
    trim: true,
    maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres']
  },
  tipoMensaje: {
    type: String,
    enum: ['texto', 'imagen', 'ubicacion', 'sistema'],
    default: 'texto'
  },
  // Para mensajes de imagen
  imagen: {
    url: { type: String },
    publicId: { type: String }
  },
  // Para mensajes de ubicación
  ubicacion: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  fechaEnvio: {
    type: Date,
    default: Date.now
  },
  leido: {
    type: Boolean,
    default: false
  },
  fechaLectura: {
    type: Date,
    default: null
  },
  // Para mensajes del sistema (notificaciones automáticas)
  esMensajeSistema: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índices para búsquedas frecuentes
esquemaMensaje.index({ idTrabajo: 1, fechaEnvio: 1 });
esquemaMensaje.index({ idEmisor: 1 });

// Virtual para formatear la hora
esquemaMensaje.virtual('horaFormateada').get(function () {
  return this.fechaEnvio.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Virtual para formatear la fecha
esquemaMensaje.virtual('fechaFormateada').get(function () {
  const hoy = new Date();
  const fechaMensaje = new Date(this.fechaEnvio);

  // Si es hoy
  if (fechaMensaje.toDateString() === hoy.toDateString()) {
    return 'Hoy';
  }

  // Si es ayer
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  if (fechaMensaje.toDateString() === ayer.toDateString()) {
    return 'Ayer';
  }

  // Otra fecha
  return fechaMensaje.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short'
  });
});

// Método estático para obtener mensajes de un trabajo
esquemaMensaje.statics.obtenerMensajesTrabajo = function (idTrabajo, pagina = 1, limite = 50) {
  const saltar = (pagina - 1) * limite;

  return this.find({ idTrabajo })
    .populate('idEmisor', 'perfil.nombre perfil.apellido perfil.fotoUrl rol')
    .sort({ fechaEnvio: -1 })
    .skip(saltar)
    .limit(limite)
    .then(mensajes => mensajes.reverse()); // Invertir para orden cronológico
};

// Método estático para marcar mensajes como leídos
esquemaMensaje.statics.marcarComoLeidos = function (idTrabajo, idLector) {
  return this.updateMany(
    {
      idTrabajo,
      idEmisor: { $ne: idLector },
      leido: false
    },
    {
      $set: {
        leido: true,
        fechaLectura: new Date()
      }
    }
  );
};

// Método estático para contar mensajes no leídos
esquemaMensaje.statics.contarNoLeidos = function (idTrabajo, idUsuario) {
  return this.countDocuments({
    idTrabajo,
    idEmisor: { $ne: idUsuario },
    leido: false
  });
};

// Método estático para crear mensaje del sistema
esquemaMensaje.statics.crearMensajeSistema = function (idTrabajo, contenido) {
  return this.create({
    idTrabajo,
    idEmisor: null,
    contenido,
    tipoMensaje: 'sistema',
    esMensajeSistema: true
  });
};

// Asegurar que los virtuals se incluyan en JSON
esquemaMensaje.set('toJSON', { virtuals: true });
esquemaMensaje.set('toObject', { virtuals: true });

module.exports = mongoose.model('Mensaje', esquemaMensaje);
