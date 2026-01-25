/**
 * Modelo de Reseña
 * TécnicoYa - Backend
 * Valoraciones bidireccionales entre clientes y técnicos
 */

const mongoose = require('mongoose');

const esquemaResena = new mongoose.Schema({
  idTrabajo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trabajo',
    required: [true, 'El trabajo es obligatorio']
  },
  idResenador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El reseñador es obligatorio']
  },
  idResenado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El reseñado es obligatorio']
  },
  tipoResena: {
    type: String,
    enum: ['cliente_a_tecnico', 'tecnico_a_cliente'],
    required: true
  },
  calificacion: {
    type: Number,
    required: [true, 'La calificación es obligatoria'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  comentario: {
    type: String,
    trim: true,
    maxlength: [500, 'El comentario no puede exceder 500 caracteres']
  },
  // Aspectos específicos a calificar
  aspectos: {
    puntualidad: {
      type: Number,
      min: 1,
      max: 5
    },
    calidad: {
      type: Number,
      min: 1,
      max: 5
    },
    comunicacion: {
      type: Number,
      min: 1,
      max: 5
    },
    precioJusto: {
      type: Number,
      min: 1,
      max: 5
    },
    limpieza: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  fotos: [{
    url: { type: String },
    publicId: { type: String },
    descripcion: { type: String }
  }],
  // Trabajo relacionado (snapshot de información)
  infoTrabajo: {
    tipoServicio: String,
    fechaCompletado: Date,
    monto: Number
  },
  // Respuesta a la reseña (el técnico puede responder)
  respuesta: {
    contenido: { type: String },
    fecha: { type: Date }
  },
  // Moderación
  visible: {
    type: Boolean,
    default: true
  },
  reportada: {
    type: Boolean,
    default: false
  },
  motivoReporte: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'fechaCreacion',
    updatedAt: 'fechaActualizacion'
  }
});

// Índices para búsquedas frecuentes
esquemaResena.index({ idResenado: 1, calificacion: -1 });
esquemaResena.index({ idTrabajo: 1 });
esquemaResena.index({ fechaCreacion: -1 });

// Prevenir reseñas duplicadas del mismo trabajo
esquemaResena.index({ idTrabajo: 1, idResenador: 1 }, { unique: true });

// Middleware para actualizar calificación promedio del técnico
esquemaResena.post('save', async function () {
  if (this.tipoResena === 'cliente_a_tecnico') {
    await actualizarCalificacionTecnico(this.idResenado);
  }
});

// Función para actualizar la calificación promedio de un técnico
async function actualizarCalificacionTecnico(idTecnico) {
  const Usuario = require('./Usuario');

  const resultado = await mongoose.model('Resena').aggregate([
    {
      $match: {
        idResenado: idTecnico,
        tipoResena: 'cliente_a_tecnico',
        visible: true
      }
    },
    {
      $group: {
        _id: null,
        promedioCalificacion: { $avg: '$calificacion' },
        totalResenas: { $sum: 1 }
      }
    }
  ]);

  if (resultado.length > 0) {
    await Usuario.findByIdAndUpdate(idTecnico, {
      'datosTecnico.calificacion': Math.round(resultado[0].promedioCalificacion * 10) / 10,
      'datosTecnico.totalResenas': resultado[0].totalResenas
    });
  }
}

// Virtual para verificar si puede responder
esquemaResena.virtual('puedeResponder').get(function () {
  return !this.respuesta?.contenido;
});

// Método estático para obtener reseñas de un técnico con estadísticas
esquemaResena.statics.obtenerResenasConEstadisticas = async function (idTecnico, pagina = 1, limite = 10) {
  const saltar = (pagina - 1) * limite;

  const [resenas, estadisticas] = await Promise.all([
    this.find({
      idResenado: idTecnico,
      tipoResena: 'cliente_a_tecnico',
      visible: true
    })
      .populate('idResenador', 'perfil.nombre perfil.apellido perfil.fotoUrl')
      .sort({ fechaCreacion: -1 })
      .skip(saltar)
      .limit(limite),

    this.aggregate([
      {
        $match: {
          idResenado: new mongoose.Types.ObjectId(idTecnico),
          tipoResena: 'cliente_a_tecnico',
          visible: true
        }
      },
      {
        $group: {
          _id: null,
          promedio: { $avg: '$calificacion' },
          total: { $sum: 1 },
          cinco: { $sum: { $cond: [{ $eq: ['$calificacion', 5] }, 1, 0] } },
          cuatro: { $sum: { $cond: [{ $eq: ['$calificacion', 4] }, 1, 0] } },
          tres: { $sum: { $cond: [{ $eq: ['$calificacion', 3] }, 1, 0] } },
          dos: { $sum: { $cond: [{ $eq: ['$calificacion', 2] }, 1, 0] } },
          uno: { $sum: { $cond: [{ $eq: ['$calificacion', 1] }, 1, 0] } },
          promedioPuntualidad: { $avg: '$aspectos.puntualidad' },
          promedioCalidad: { $avg: '$aspectos.calidad' },
          promedioComunicacion: { $avg: '$aspectos.comunicacion' },
          promedioPrecio: { $avg: '$aspectos.precioJusto' },
          promedioLimpieza: { $avg: '$aspectos.limpieza' }
        }
      }
    ])
  ]);

  return {
    resenas,
    estadisticas: estadisticas[0] || {
      promedio: 0,
      total: 0,
      cinco: 0,
      cuatro: 0,
      tres: 0,
      dos: 0,
      uno: 0
    }
  };
};

// Asegurar que los virtuals se incluyan en JSON
esquemaResena.set('toJSON', { virtuals: true });
esquemaResena.set('toObject', { virtuals: true });

module.exports = mongoose.model('Resena', esquemaResena);
