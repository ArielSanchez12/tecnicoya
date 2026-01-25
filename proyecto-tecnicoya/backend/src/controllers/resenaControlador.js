/**
 * Controlador de Reseñas
 * TécnicoYa - Backend
 * Gestión de valoraciones bidireccionales
 */

const { validationResult } = require('express-validator');
const Resena = require('../models/Resena');
const Trabajo = require('../models/Trabajo');
const Usuario = require('../models/Usuario');
const { notificarNuevaResena } = require('../utils/notificaciones');

/**
 * Crear nueva reseña
 * POST /api/resenas
 */
const crearResena = async (req, res) => {
  try {
    console.log('📝 Recibiendo solicitud de reseña');
    console.log('Body:', req.body);
    console.log('Usuario ID:', req.usuario?._id);
    console.log('Usuario ID string:', req.usuario?._id?.toString());

    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ Errores de validación:', errores.array());
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    // Aceptar tanto 'trabajo' como 'idTrabajo' para compatibilidad
    const {
      trabajo: trabajoId,
      idTrabajo,
      calificacion,
      comentario,
      aspectos
    } = req.body;

    const idTrabajoFinal = trabajoId || idTrabajo;
    console.log('🔍 ID del trabajo:', idTrabajoFinal);

    // Verificar que el trabajo existe
    const trabajo = await Trabajo.findById(idTrabajoFinal)
      .populate('idServicio', 'tipo');

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar que el trabajo está completado
    if (trabajo.estado !== 'completado' && trabajo.estado !== 'disputa') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Solo puedes reseñar trabajos completados'
      });
    }

    // Determinar tipo de reseña y usuario reseñado
    const usuarioIdStr = req.usuario._id.toString();
    const clienteIdStr = trabajo.idCliente.toString();
    const tecnicoIdStr = trabajo.idTecnico.toString();

    console.log('🔍 Comparación de IDs:');
    console.log('  - Usuario autenticado:', usuarioIdStr);
    console.log('  - Cliente del trabajo:', clienteIdStr);
    console.log('  - Técnico del trabajo:', tecnicoIdStr);

    const esCliente = clienteIdStr === usuarioIdStr;
    const esTecnico = tecnicoIdStr === usuarioIdStr;

    console.log('  - ¿Es cliente?:', esCliente);
    console.log('  - ¿Es técnico?:', esTecnico);

    if (!esCliente && !esTecnico) {
      console.log('❌ Usuario no es ni cliente ni técnico del trabajo');
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para reseñar este trabajo'
      });
    }

    const tipoResena = esCliente ? 'cliente_a_tecnico' : 'tecnico_a_cliente';
    const idResenado = esCliente ? trabajo.idTecnico : trabajo.idCliente;

    // Verificar que no haya reseñado ya
    const resenaExistente = await Resena.findOne({
      idTrabajo: idTrabajoFinal,
      idResenador: req.usuario._id
    });

    if (resenaExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya has reseñado este trabajo'
      });
    }

    // Crear datos de reseña
    const datosResena = {
      idTrabajo: idTrabajoFinal,
      idResenador: req.usuario._id,
      idResenado,
      tipoResena,
      calificacion: parseInt(calificacion),
      comentario: comentario || '',
      aspectos: aspectos || {},
      infoTrabajo: {
        tipoServicio: trabajo.idServicio.tipo,
        fechaCompletado: trabajo.fechaFinalizacion || trabajo.fechaActualizacion,
        monto: trabajo.pago.monto
      }
    };

    // Agregar fotos si se subieron
    if (req.archivosSubidos && req.archivosSubidos.length > 0) {
      datosResena.fotos = req.archivosSubidos.map(foto => ({
        url: foto.url,
        publicId: foto.publicId
      }));
    }

    const nuevaResena = await Resena.create(datosResena);

    // Actualizar referencia en el trabajo
    if (esCliente) {
      trabajo.resenaCliente = nuevaResena._id;

      // Agregar 5 puntos de fidelización al cliente por dejar reseña
      await Usuario.findByIdAndUpdate(req.usuario._id, {
        $inc: { puntosLealtad: 5 },
        $push: {
          historialPuntos: {
            tipo: 'ganado',
            cantidad: 5,
            descripcion: 'Bonus por dejar reseña',
            fecha: new Date()
          }
        }
      });
    } else {
      trabajo.resenaTecnico = nuevaResena._id;
    }
    await trabajo.save();

    // Notificar al usuario reseñado
    notificarNuevaResena(idResenado, nuevaResena);

    // Poblar datos para respuesta
    await nuevaResena.populate('idResenador', 'perfil.nombre perfil.apellido perfil.fotoUrl');

    res.status(201).json({
      exito: true,
      mensaje: '¡Gracias por tu reseña!',
      datos: nuevaResena
    });

  } catch (error) {
    console.error('Error al crear reseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear reseña',
      error: error.message
    });
  }
};

/**
 * Obtener reseñas de un técnico
 * GET /api/resenas/tecnico/:tecnicoId
 */
const obtenerResenasTecnico = async (req, res) => {
  try {
    // La ruta usa :tecnicoId, no :id
    const { tecnicoId } = req.params;
    const id = tecnicoId;
    const { pagina = 1, limite = 10 } = req.query;

    console.log('📝 Obteniendo reseñas del técnico:', id);

    // Verificar que el usuario existe y es técnico
    const tecnico = await Usuario.findById(id);
    if (!tecnico || tecnico.rol !== 'tecnico') {
      return res.status(404).json({
        exito: false,
        mensaje: 'Técnico no encontrado'
      });
    }

    const resultado = await Resena.obtenerResenasConEstadisticas(id, parseInt(pagina), parseInt(limite));

    res.json({
      exito: true,
      datos: {
        tecnico: {
          id: tecnico._id,
          nombre: `${tecnico.perfil.nombre} ${tecnico.perfil.apellido}`,
          foto: tecnico.perfil.fotoUrl,
          calificacion: tecnico.datosTecnico.calificacion,
          totalResenas: tecnico.datosTecnico.totalResenas
        },
        resenas: resultado.resenas,
        estadisticas: resultado.estadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener reseñas',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de reseñas de un usuario
 * GET /api/resenas/estadisticas/:id
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const { id } = req.params;

    const estadisticas = await Resena.aggregate([
      {
        $match: {
          idResenado: require('mongoose').Types.ObjectId.createFromHexString(id),
          visible: true
        }
      },
      {
        $group: {
          _id: null,
          promedioGeneral: { $avg: '$calificacion' },
          totalResenas: { $sum: 1 },
          distribucion: {
            $push: '$calificacion'
          },
          promedioPuntualidad: { $avg: '$aspectos.puntualidad' },
          promedioCalidad: { $avg: '$aspectos.calidad' },
          promedioComunicacion: { $avg: '$aspectos.comunicacion' },
          promedioPrecio: { $avg: '$aspectos.precioJusto' },
          promedioLimpieza: { $avg: '$aspectos.limpieza' }
        }
      },
      {
        $project: {
          _id: 0,
          promedioGeneral: { $round: ['$promedioGeneral', 1] },
          totalResenas: 1,
          promedios: {
            puntualidad: { $round: ['$promedioPuntualidad', 1] },
            calidad: { $round: ['$promedioCalidad', 1] },
            comunicacion: { $round: ['$promedioComunicacion', 1] },
            precioJusto: { $round: ['$promedioPrecio', 1] },
            limpieza: { $round: ['$promedioLimpieza', 1] }
          },
          distribucion: 1
        }
      }
    ]);

    // Calcular distribución de estrellas
    let distribucionEstrellas = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (estadisticas.length > 0 && estadisticas[0].distribucion) {
      estadisticas[0].distribucion.forEach(cal => {
        distribucionEstrellas[cal] = (distribucionEstrellas[cal] || 0) + 1;
      });
    }

    res.json({
      exito: true,
      datos: {
        ...(estadisticas[0] || {
          promedioGeneral: 0,
          totalResenas: 0,
          promedios: {}
        }),
        distribucionEstrellas
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Responder a una reseña (técnico)
 * PUT /api/resenas/:id/responder
 */
const responderResena = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La respuesta no puede estar vacía'
      });
    }

    const resena = await Resena.findById(id);

    if (!resena) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Reseña no encontrada'
      });
    }

    // Verificar que es el usuario reseñado
    if (resena.idResenado.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo el usuario reseñado puede responder'
      });
    }

    // Verificar que no haya respondido ya
    if (resena.respuesta?.contenido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya has respondido a esta reseña'
      });
    }

    resena.respuesta = {
      contenido: contenido.trim(),
      fecha: new Date()
    };

    await resena.save();

    res.json({
      exito: true,
      mensaje: 'Respuesta guardada',
      datos: resena
    });

  } catch (error) {
    console.error('Error al responder reseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al responder reseña',
      error: error.message
    });
  }
};

/**
 * Reportar reseña
 * POST /api/resenas/:id/reportar
 */
const reportarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes proporcionar un motivo para el reporte'
      });
    }

    const resena = await Resena.findById(id);

    if (!resena) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Reseña no encontrada'
      });
    }

    resena.reportada = true;
    resena.motivoReporte = motivo;
    await resena.save();

    res.json({
      exito: true,
      mensaje: 'Reseña reportada. Será revisada por nuestro equipo.'
    });

  } catch (error) {
    console.error('Error al reportar reseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al reportar reseña',
      error: error.message
    });
  }
};

/**
 * Obtener mis reseñas recibidas
 * GET /api/resenas/mis-resenas
 */
const obtenerMisResenas = async (req, res) => {
  try {
    const { tipo, pagina = 1, limite = 10 } = req.query;
    const saltar = (parseInt(pagina) - 1) * parseInt(limite);

    const filtro = { idResenado: req.usuario._id, visible: true };

    if (tipo === 'recibidas') {
      filtro.idResenado = req.usuario._id;
    } else if (tipo === 'enviadas') {
      delete filtro.idResenado;
      filtro.idResenador = req.usuario._id;
    }

    const [resenas, total] = await Promise.all([
      Resena.find(filtro)
        .populate('idResenador', 'perfil.nombre perfil.apellido perfil.fotoUrl')
        .populate('idResenado', 'perfil.nombre perfil.apellido perfil.fotoUrl')
        .sort({ fechaCreacion: -1 })
        .skip(saltar)
        .limit(parseInt(limite)),
      Resena.countDocuments(filtro)
    ]);

    res.json({
      exito: true,
      datos: {
        resenas,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener reseñas:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener reseñas',
      error: error.message
    });
  }
};

module.exports = {
  crearResena,
  obtenerResenasTecnico,
  obtenerEstadisticas,
  responderResena,
  reportarResena,
  obtenerMisResenas
};
