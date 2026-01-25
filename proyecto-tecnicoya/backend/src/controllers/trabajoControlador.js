/**
 * Controlador de Trabajos
 * TécnicoYa - Backend
 * Gestión de trabajos aceptados
 */

const { validationResult } = require('express-validator');
const Trabajo = require('../models/Trabajo');
const Servicio = require('../models/Servicio');
const Usuario = require('../models/Usuario');
const Mensaje = require('../models/Mensaje');
const { notificarCambioEstado } = require('../utils/notificaciones');
const { crearPuntoGeoJSON } = require('../utils/geolocalizacion');
const { subirImagen, CARPETAS } = require('../config/cloudinary');

/**
 * Obtener mis trabajos
 * GET /api/trabajos
 */
const obtenerMisTrabajos = async (req, res) => {
  try {
    const { estado, activos, pagina = 1, limite = 10 } = req.query;
    const saltar = (parseInt(pagina) - 1) * parseInt(limite);

    const filtro = {};

    // Filtrar por rol
    if (req.usuario.rol === 'tecnico') {
      filtro.idTecnico = req.usuario._id;
    } else {
      filtro.idCliente = req.usuario._id;
    }

    // Filtrar por estado específico
    if (estado) {
      filtro.estado = estado;
    }

    // Filtrar solo trabajos activos
    if (activos === 'true') {
      filtro.estado = { $in: ['programado', 'en_camino', 'en_progreso'] };
    }

    const [trabajos, total] = await Promise.all([
      Trabajo.find(filtro)
        .populate('idServicio', 'tipo titulo descripcion ubicacion urgencia')
        .populate('idCliente', 'perfil.nombre perfil.apellido perfil.fotoUrl perfil.telefono')
        .populate('idTecnico', 'perfil.nombre perfil.apellido perfil.fotoUrl perfil.telefono datosTecnico')
        .sort({ fechaProgramada: -1 })
        .skip(saltar)
        .limit(parseInt(limite)),
      Trabajo.countDocuments(filtro)
    ]);

    res.json({
      exito: true,
      datos: {
        trabajos,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener trabajos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener trabajos',
      error: error.message
    });
  }
};

/**
 * Obtener trabajo por ID
 * GET /api/trabajos/:id
 */
const obtenerTrabajoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const trabajo = await Trabajo.findById(id)
      .populate('idServicio')
      .populate('idCotizacion')
      .populate('idCliente', 'perfil puntosLealtad')
      .populate('idTecnico', 'perfil datosTecnico')
      .populate('resenaCliente')
      .populate('resenaTecnico');

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar permisos
    const esCliente = trabajo.idCliente._id.toString() === req.usuario._id.toString();
    const esTecnico = trabajo.idTecnico._id.toString() === req.usuario._id.toString();

    if (!esCliente && !esTecnico) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para ver este trabajo'
      });
    }

    // Obtener mensajes del chat
    const mensajes = await Mensaje.obtenerMensajesTrabajo(id);
    const mensajesNoLeidos = await Mensaje.contarNoLeidos(id, req.usuario._id);

    res.json({
      exito: true,
      datos: {
        trabajo,
        chat: {
          mensajes,
          noLeidos: mensajesNoLeidos
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener trabajo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener trabajo',
      error: error.message
    });
  }
};

/**
 * Actualizar estado del trabajo (técnico)
 * PUT /api/trabajos/:id/estado
 */
const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado, ubicacion, nota } = req.body;

    const trabajo = await Trabajo.findById(id);

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar que es el técnico asignado
    if (trabajo.idTecnico.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo el técnico asignado puede actualizar el estado'
      });
    }

    // Validar transiciones de estado permitidas
    const transicionesValidas = {
      'programado': ['en_camino', 'cancelado'],
      'en_camino': ['en_progreso', 'cancelado'],
      'en_progreso': ['completado'],
      'completado': [],
      'cancelado': [],
      'disputa': []
    };

    if (!transicionesValidas[trabajo.estado]?.includes(nuevoEstado)) {
      return res.status(400).json({
        exito: false,
        mensaje: `No se puede cambiar de "${trabajo.estado}" a "${nuevoEstado}"`
      });
    }

    const estadoAnterior = trabajo.estado;
    trabajo.estado = nuevoEstado;

    // Actualizar ubicación si se proporciona
    if (ubicacion && ubicacion.latitud && ubicacion.longitud) {
      trabajo.ubicacionTecnico = crearPuntoGeoJSON(
        parseFloat(ubicacion.latitud),
        parseFloat(ubicacion.longitud)
      );
      trabajo.ultimaActualizacionUbicacion = new Date();
    }

    // Agregar nota al historial si se proporciona
    if (nota) {
      trabajo.historialEstados[trabajo.historialEstados.length - 1].nota = nota;
    }

    await trabajo.save();

    // Si se completó, actualizar servicio (los trabajosCompletados se incrementan en aprobarTrabajo)
    if (nuevoEstado === 'completado') {
      // Actualizar servicio
      await Servicio.findByIdAndUpdate(trabajo.idServicio, {
        $set: { estado: 'completado' }
      });
    }

    // Notificar cambio de estado
    await trabajo.populate([
      { path: 'idCliente', select: 'perfil' },
      { path: 'idTecnico', select: 'perfil' },
      { path: 'idServicio', select: 'tipo titulo' }
    ]);

    notificarCambioEstado(trabajo, estadoAnterior);

    // Emitir cambio de estado en tiempo real al cliente via Socket
    const { emitirAUsuario } = require('../config/socket');
    emitirAUsuario(trabajo.idCliente._id.toString(), 'trabajo_estado_actualizado', {
      trabajoId: id,
      estadoAnterior,
      nuevoEstado,
      tecnico: {
        nombre: trabajo.idTecnico.perfil?.nombre,
        apellido: trabajo.idTecnico.perfil?.apellido
      },
      servicio: {
        titulo: trabajo.idServicio?.titulo
      },
      ubicacionTecnico: trabajo.ubicacionTecnico,
      fecha: new Date()
    });

    // Crear mensaje de sistema en el chat
    const mensajesSistema = {
      'en_camino': '🚗 El técnico está en camino',
      'en_progreso': '🔧 El trabajo ha comenzado',
      'completado': '✅ El trabajo ha sido completado'
    };

    if (mensajesSistema[nuevoEstado]) {
      await Mensaje.create({
        idTrabajo: id,
        idEmisor: req.usuario._id,
        contenido: mensajesSistema[nuevoEstado],
        tipoMensaje: 'sistema',
        esMensajeSistema: true
      });
    }

    res.json({
      exito: true,
      mensaje: `Estado actualizado a "${nuevoEstado}"`,
      datos: trabajo
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar estado',
      error: error.message
    });
  }
};

/**
 * Subir fotos antes del trabajo
 * POST /api/trabajos/:id/fotos/antes
 */
const subirFotosAntes = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;

    const trabajo = await Trabajo.findById(id);

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar que es el técnico asignado
    if (trabajo.idTecnico.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo el técnico puede subir fotos'
      });
    }

    if (!req.archivosSubidos || req.archivosSubidos.length === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se proporcionaron imágenes'
      });
    }

    const nuevasFotos = req.archivosSubidos.map(foto => ({
      url: foto.url,
      publicId: foto.publicId,
      descripcion: descripcion || '',
      fechaSubida: new Date()
    }));

    trabajo.fotosAntes.push(...nuevasFotos);
    await trabajo.save();

    res.json({
      exito: true,
      mensaje: `${nuevasFotos.length} foto(s) subidas`,
      datos: trabajo.fotosAntes
    });

  } catch (error) {
    console.error('Error al subir fotos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al subir fotos',
      error: error.message
    });
  }
};

/**
 * Subir fotos después del trabajo
 * POST /api/trabajos/:id/fotos/despues
 */
const subirFotosDespues = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;

    const trabajo = await Trabajo.findById(id);

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar que es el técnico asignado
    if (trabajo.idTecnico.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo el técnico puede subir fotos'
      });
    }

    if (!req.archivosSubidos || req.archivosSubidos.length === 0) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se proporcionaron imágenes'
      });
    }

    const nuevasFotos = req.archivosSubidos.map(foto => ({
      url: foto.url,
      publicId: foto.publicId,
      descripcion: descripcion || '',
      fechaSubida: new Date()
    }));

    trabajo.fotosDespues.push(...nuevasFotos);
    await trabajo.save();

    res.json({
      exito: true,
      mensaje: `${nuevasFotos.length} foto(s) subidas`,
      datos: trabajo.fotosDespues
    });

  } catch (error) {
    console.error('Error al subir fotos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al subir fotos',
      error: error.message
    });
  }
};

/**
 * Aprobar trabajo (Sistema de Garantía)
 * PUT /api/trabajos/:id/aprobar
 */
const aprobarTrabajo = async (req, res) => {
  try {
    const { id } = req.params;

    const trabajo = await Trabajo.findById(id)
      .populate('idCliente', 'perfil puntosLealtad historialPuntos')
      .populate('idTecnico', 'perfil datosTecnico')
      .populate('idServicio', 'tipo titulo');

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar que es el cliente
    if (trabajo.idCliente._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo el cliente puede aprobar el trabajo'
      });
    }

    // Verificar que el trabajo está completado
    if (trabajo.estado !== 'completado') {
      return res.status(400).json({
        exito: false,
        mensaje: 'El trabajo debe estar completado para aprobarlo'
      });
    }

    // Liberar pago (simulado)
    trabajo.pago.estado = 'liberado';
    trabajo.pago.fechaPago = new Date();

    if (trabajo.pago.tieneGarantia) {
      trabajo.pago.garantiaAprobada = true;
    }

    await trabajo.save();

    // Calcular y agregar puntos de fidelización al cliente
    const puntosGanados = Math.floor(trabajo.pago.monto / 10);

    if (puntosGanados > 0) {
      await Usuario.findByIdAndUpdate(trabajo.idCliente._id, {
        $inc: { puntosLealtad: puntosGanados },
        $push: {
          historialPuntos: {
            tipo: 'ganado',
            cantidad: puntosGanados,
            descripcion: `Servicio de ${trabajo.idServicio.tipo} completado`,
            fecha: new Date()
          }
        }
      });
    }

    // Actualizar estadísticas del técnico y agregar fondos
    await Usuario.findByIdAndUpdate(trabajo.idTecnico._id, {
      $inc: {
        'datosTecnico.trabajosCompletados': 1,
        'datosTecnico.fondos.disponible': trabajo.pago.montoNeto,
        'datosTecnico.fondos.totalGanado': trabajo.pago.montoNeto
      }
    });

    // Notificar al técnico sobre pago liberado
    const { emitirAUsuario } = require('../config/socket');
    emitirAUsuario(trabajo.idTecnico._id.toString(), 'pago_liberado', {
      tipo: 'pago_liberado',
      titulo: '💰 ¡Pago Liberado!',
      mensaje: `Se ha liberado el pago de $${trabajo.pago.montoNeto.toFixed(2)} por el trabajo completado`,
      datos: {
        trabajoId: trabajo._id,
        monto: trabajo.pago.montoNeto,
        comision: trabajo.pago.comision
      },
      fecha: new Date()
    });

    // Notificar al cliente sobre puntos ganados
    emitirAUsuario(trabajo.idCliente._id.toString(), 'puntos_ganados', {
      tipo: 'puntos_ganados',
      titulo: '🎁 ¡Puntos Ganados!',
      mensaje: `Has ganado ${puntosGanados} puntos de fidelidad`,
      datos: {
        puntosGanados,
        trabajoId: trabajo._id
      },
      fecha: new Date()
    });

    res.json({
      exito: true,
      mensaje: '¡Trabajo aprobado! El pago ha sido liberado al técnico.',
      datos: {
        pago: trabajo.pago,
        puntosGanados,
        trabajoId: trabajo._id
      }
    });

  } catch (error) {
    console.error('Error al aprobar trabajo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al aprobar trabajo',
      error: error.message
    });
  }
};

/**
 * Abrir disputa (Sistema de Garantía)
 * POST /api/trabajos/:id/disputa
 */
const abrirDisputa = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, descripcion } = req.body;

    if (!motivo || !descripcion) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes proporcionar un motivo y descripción de la disputa'
      });
    }

    const trabajo = await Trabajo.findById(id);

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar que es el cliente
    if (trabajo.idCliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo el cliente puede abrir una disputa'
      });
    }

    // Verificar que el trabajo está completado
    if (trabajo.estado !== 'completado') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Solo se puede abrir disputa para trabajos completados'
      });
    }

    // Obtener fotos de evidencia si se subieron
    const fotos = req.archivosSubidos?.map(f => f.url) || [];

    // Abrir disputa
    trabajo.abrirDisputa(motivo, descripcion, fotos);
    await trabajo.save();

    // Notificar cambio de estado
    await trabajo.populate([
      { path: 'idCliente', select: 'perfil' },
      { path: 'idTecnico', select: 'perfil' }
    ]);

    notificarCambioEstado(trabajo, 'completado');

    res.json({
      exito: true,
      mensaje: 'Disputa abierta. Se ha liberado el 50% del pago automáticamente.',
      datos: {
        disputa: trabajo.disputa,
        pago: trabajo.pago
      }
    });

  } catch (error) {
    console.error('Error al abrir disputa:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al abrir disputa',
      error: error.message
    });
  }
};

/**
 * Cancelar trabajo
 * PUT /api/trabajos/:id/cancelar
 */
const cancelarTrabajo = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const trabajo = await Trabajo.findById(id);

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    // Verificar permisos
    const esCliente = trabajo.idCliente.toString() === req.usuario._id.toString();
    const esTecnico = trabajo.idTecnico.toString() === req.usuario._id.toString();

    if (!esCliente && !esTecnico) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para cancelar este trabajo'
      });
    }

    // Verificar que se pueda cancelar
    if (!trabajo.puedeCancelarse) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Este trabajo ya no puede ser cancelado'
      });
    }

    trabajo.estado = 'cancelado';
    trabajo.notasCliente = motivo || 'Cancelado';

    // Si tenía garantía, reembolsar
    if (trabajo.pago.tieneGarantia && trabajo.pago.estado === 'retenido') {
      trabajo.pago.estado = 'reembolsado';
    }

    await trabajo.save();

    // Actualizar servicio
    await Servicio.findByIdAndUpdate(trabajo.idServicio, {
      $set: { estado: 'cancelado' }
    });

    // Notificar
    await trabajo.populate([
      { path: 'idCliente', select: 'perfil' },
      { path: 'idTecnico', select: 'perfil' }
    ]);

    notificarCambioEstado(trabajo, 'programado');

    res.json({
      exito: true,
      mensaje: 'Trabajo cancelado',
      datos: trabajo
    });

  } catch (error) {
    console.error('Error al cancelar trabajo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cancelar trabajo',
      error: error.message
    });
  }
};

/**
 * Actualizar ubicación del técnico
 * PUT /api/trabajos/:id/ubicacion
 */
const actualizarUbicacionTecnico = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitud, longitud } = req.body;

    const trabajo = await Trabajo.findById(id);

    if (!trabajo) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Trabajo no encontrado'
      });
    }

    if (trabajo.idTecnico.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para actualizar la ubicación'
      });
    }

    trabajo.ubicacionTecnico = crearPuntoGeoJSON(parseFloat(latitud), parseFloat(longitud));
    trabajo.ultimaActualizacionUbicacion = new Date();
    await trabajo.save();

    // Emitir ubicación via Socket.io
    const { emitirASala } = require('../config/socket');
    emitirASala(`trabajo_${id}`, 'ubicacion_tecnico', {
      idTecnico: req.usuario._id,
      ubicacion: { latitud, longitud },
      timestamp: new Date()
    });

    res.json({
      exito: true,
      mensaje: 'Ubicación actualizada'
    });

  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar ubicación',
      error: error.message
    });
  }
};

module.exports = {
  obtenerMisTrabajos,
  obtenerTrabajoPorId,
  actualizarEstado,
  subirFotosAntes,
  subirFotosDespues,
  aprobarTrabajo,
  abrirDisputa,
  cancelarTrabajo,
  actualizarUbicacionTecnico
};
