/**
 * Controlador de Cotizaciones
 * TécnicoYa - Backend
 * Gestión de cotizaciones de técnicos
 */

const { validationResult } = require('express-validator');
const Cotizacion = require('../models/Cotizacion');
const Servicio = require('../models/Servicio');
const Trabajo = require('../models/Trabajo');
const Usuario = require('../models/Usuario');
const { notificarNuevaCotizacion, notificarCotizacionAceptada, notificarCotizacionEditada, notificarCotizacionCancelada } = require('../utils/notificaciones');
const { calcularDesglosePrecio } = require('../utils/precios');

/**
 * Crear nueva cotización (técnico)
 * POST /api/cotizaciones
 */
const crearCotizacion = async (req, res) => {
  try {
    // Log para depuración
    console.log('📝 Datos recibidos para cotización:', JSON.stringify(req.body, null, 2));

    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ Errores de validación:', errores.array());
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const {
      idServicio,
      servicio: servicioId, // Frontend puede enviar 'servicio' o 'idServicio'
      precio,
      montoTotal, // Frontend puede enviar 'montoTotal' o 'precio'
      tiempoEstimado,
      descripcionTrabajo,
      descripcion, // Frontend puede enviar 'descripcion' o 'descripcionTrabajo'
      materiales,
      desglose, // Frontend envía desglose de costos
      notasAdicionales,
      garantia,
      validezHoras = 48
    } = req.body;

    const idTecnico = req.usuario._id;

    // Usar el ID de servicio de cualquiera de los campos
    const idServicioFinal = idServicio || servicioId;

    // Verificar que el servicio existe y está pendiente
    const servicio = await Servicio.findById(idServicioFinal);
    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado'
      });
    }

    if (!['pendiente', 'cotizado'].includes(servicio.estado)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Este servicio ya no acepta cotizaciones'
      });
    }

    // Verificar que no haya cotizado ya
    const cotizacionExistente = await Cotizacion.findOne({
      idServicio: idServicioFinal,
      idTecnico,
      estado: { $in: ['pendiente', 'aceptada'] }
    });

    if (cotizacionExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya enviaste una cotización para este servicio'
      });
    }

    // Verificar que el técnico tenga la especialidad
    if (!req.usuario.datosTecnico?.especialidades?.includes(servicio.tipo)) {
      return res.status(400).json({
        exito: false,
        mensaje: `No tienes la especialidad ${servicio.tipo} para cotizar este servicio`
      });
    }

    // Obtener datos del técnico para snapshot
    const tecnico = await Usuario.findById(idTecnico);

    // Normalizar precio (puede venir como 'precio' o 'montoTotal')
    const precioFinal = precio || montoTotal;

    // Normalizar descripción (puede venir como 'descripcionTrabajo' o 'descripcion')
    const descripcionFinal = descripcionTrabajo || descripcion;

    // Normalizar tiempo estimado (puede ser string "2 horas" o objeto {valor, unidad})
    let tiempoEstimadoFinal;
    if (typeof tiempoEstimado === 'string') {
      // Parsear string como "2 horas", "1 día", etc.
      const match = tiempoEstimado.match(/(\d+)\s*(hora|horas|día|dias|dia|días)?/i);
      tiempoEstimadoFinal = {
        valor: match ? parseInt(match[1]) : 1,
        unidad: tiempoEstimado.toLowerCase().includes('día') || tiempoEstimado.toLowerCase().includes('dia') ? 'dias' : 'horas'
      };
    } else if (tiempoEstimado && typeof tiempoEstimado === 'object') {
      tiempoEstimadoFinal = {
        valor: tiempoEstimado.valor || 1,
        unidad: tiempoEstimado.unidad || 'horas'
      };
    } else {
      tiempoEstimadoFinal = { valor: 1, unidad: 'horas' };
    }

    // Convertir desglose a materiales si viene del frontend
    let materialesFinal = materiales || [];
    if (desglose && desglose.length > 0) {
      materialesFinal = desglose.map(item => ({
        nombre: item.concepto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        incluidoEnPrecio: true
      }));
    }

    // Crear cotización
    const datosCotizacion = {
      idServicio: idServicioFinal,
      idTecnico,
      precio: parseFloat(precioFinal),
      tiempoEstimado: tiempoEstimadoFinal,
      descripcionTrabajo: descripcionFinal,
      materiales: materialesFinal,
      notasAdicionales: notasAdicionales || garantia || '',
      validoHasta: new Date(Date.now() + validezHoras * 60 * 60 * 1000),
      datosTecnicoSnapshot: {
        nombre: `${tecnico.perfil.nombre} ${tecnico.perfil.apellido}`,
        calificacion: tecnico.datosTecnico?.calificacion || 0,
        trabajosCompletados: tecnico.datosTecnico?.trabajosCompletados || 0,
        fotoUrl: tecnico.perfil?.fotoUrl || ''
      }
    };

    // Calcular costos si se proporcionaron materiales
    if (materialesFinal && materialesFinal.length > 0) {
      datosCotizacion.costoMateriales = materialesFinal.reduce((sum, m) => {
        return sum + (m.precioUnitario * m.cantidad);
      }, 0);
      datosCotizacion.costoManoObra = parseFloat(precioFinal) - datosCotizacion.costoMateriales;
    }

    const nuevaCotizacion = await Cotizacion.create(datosCotizacion);

    // Actualizar estado del servicio si es la primera cotización
    if (servicio.estado === 'pendiente') {
      servicio.estado = 'cotizado';
      await servicio.save();
    }

    // Marcar al técnico como que respondió
    await Servicio.updateOne(
      { _id: idServicioFinal, 'tecnicosNotificados.idTecnico': idTecnico },
      { $set: { 'tecnicosNotificados.$.respondio': true } }
    );

    // Notificar al cliente
    notificarNuevaCotizacion(servicio.idCliente, nuevaCotizacion, tecnico);

    // Poblar datos para respuesta
    await nuevaCotizacion.populate('idTecnico', 'perfil datosTecnico');

    res.status(201).json({
      exito: true,
      mensaje: 'Cotización enviada correctamente',
      datos: nuevaCotizacion
    });

  } catch (error) {
    console.error('Error al crear cotización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear cotización',
      error: error.message
    });
  }
};

/**
 * Obtener cotizaciones de un servicio
 * GET /api/cotizaciones/servicio/:id
 */
const obtenerCotizacionesPorServicio = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el servicio existe
    const servicio = await Servicio.findById(id);
    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado'
      });
    }

    // Verificar que el usuario es el dueño del servicio
    if (servicio.idCliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para ver estas cotizaciones'
      });
    }

    // Actualizar cotizaciones expiradas
    await Cotizacion.actualizarExpiradas();

    // Obtener cotizaciones
    const cotizaciones = await Cotizacion.find({
      idServicio: id,
      estado: { $in: ['pendiente', 'aceptada'] }
    })
      .populate('idTecnico', 'perfil datosTecnico')
      .sort({ precio: 1 }); // Ordenar por precio ascendente

    // Agregar información de desglose de precio
    const cotizacionesConDesglose = cotizaciones.map(cotizacion => {
      const desglose = calcularDesglosePrecio(cotizacion.precio, {
        esEmergencia: servicio.urgencia === 'emergencia',
        conGarantia: false
      });

      return {
        ...cotizacion.toObject(),
        desglosePrecio: desglose
      };
    });

    res.json({
      exito: true,
      datos: {
        cotizaciones: cotizacionesConDesglose,
        totalCotizaciones: cotizaciones.length,
        servicio: {
          id: servicio._id,
          tipo: servicio.tipo,
          urgencia: servicio.urgencia,
          estado: servicio.estado
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener cotizaciones',
      error: error.message
    });
  }
};

/**
 * Obtener mis cotizaciones enviadas (técnico)
 * GET /api/cotizaciones/mis-cotizaciones
 */
const obtenerMisCotizaciones = async (req, res) => {
  try {
    const { estado, pagina = 1, limite = 10 } = req.query;
    const saltar = (parseInt(pagina) - 1) * parseInt(limite);

    const filtro = { idTecnico: req.usuario._id };
    if (estado) {
      filtro.estado = estado;
    }

    const [cotizaciones, total] = await Promise.all([
      Cotizacion.find(filtro)
        .populate({
          path: 'idServicio',
          select: 'tipo titulo descripcion urgencia estado ubicacion',
          populate: {
            path: 'idCliente',
            select: 'perfil.nombre perfil.apellido perfil.fotoUrl'
          }
        })
        .sort({ fechaCreacion: -1 })
        .skip(saltar)
        .limit(parseInt(limite)),
      Cotizacion.countDocuments(filtro)
    ]);

    res.json({
      exito: true,
      datos: {
        cotizaciones,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener cotizaciones',
      error: error.message
    });
  }
};

/**
 * Aceptar cotización (cliente)
 * PUT /api/cotizaciones/:id/aceptar
 */
const aceptarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { conGarantia = false, fechaProgramada, horaProgramada, metodoPago } = req.body;

    const cotizacion = await Cotizacion.findById(id).populate('idServicio');

    if (!cotizacion) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cotización no encontrada'
      });
    }

    // Verificar que el usuario es el dueño del servicio
    if (cotizacion.idServicio.idCliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para aceptar esta cotización'
      });
    }

    // Verificar que la cotización está vigente
    if (!cotizacion.estaVigente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Esta cotización ya no está vigente'
      });
    }

    // Obtener membresía del técnico para calcular comisión
    const tecnicoInfo = await Usuario.findById(cotizacion.idTecnico).select('membresia');
    const membresiaTecnico = tecnicoInfo?.membresia?.tipo || 'basico';

    // Calcular desglose de pago con membresía del técnico
    const esEmergencia = cotizacion.idServicio.urgencia === 'emergencia';
    const desglosePago = calcularDesglosePrecio(cotizacion.precio, {
      esEmergencia,
      conGarantia,
      membresiaTecnico
    });

    // Actualizar cotización
    cotizacion.estado = 'aceptada';
    cotizacion.fechaRespuesta = new Date();
    await cotizacion.save();

    // Actualizar servicio
    await Servicio.findByIdAndUpdate(cotizacion.idServicio._id, {
      $set: { estado: 'aceptado' }
    });

    // Marcar otras cotizaciones como no seleccionadas (mensaje amigable)
    const cotizacionesNoSeleccionadas = await Cotizacion.find({
      idServicio: cotizacion.idServicio._id,
      _id: { $ne: cotizacion._id },
      estado: 'pendiente'
    });

    await Cotizacion.updateMany(
      {
        idServicio: cotizacion.idServicio._id,
        _id: { $ne: cotizacion._id },
        estado: 'pendiente'
      },
      {
        $set: {
          estado: 'no_seleccionada',
          motivoNoSeleccion: 'El cliente eligió otra cotización para este servicio'
        }
      }
    );

    // Notificar a técnicos cuyas cotizaciones no fueron seleccionadas
    const { notificarCotizacionNoSeleccionada } = require('../utils/notificaciones');
    for (const cotNoSel of cotizacionesNoSeleccionadas) {
      notificarCotizacionNoSeleccionada(cotNoSel.idTecnico, cotNoSel, cotizacion.idServicio);
    }

    // Crear trabajo
    const trabajo = await Trabajo.create({
      idServicio: cotizacion.idServicio._id,
      idCotizacion: cotizacion._id,
      idCliente: req.usuario._id,
      idTecnico: cotizacion.idTecnico,
      fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : new Date(),
      horaProgramada,
      estado: 'programado',
      pago: {
        monto: cotizacion.precio,
        metodo: metodoPago || 'efectivo',
        estado: conGarantia ? 'retenido' : 'pendiente',
        comision: desglosePago.comision.monto,
        porcentajeComision: desglosePago.comision.porcentaje,
        tarifaGarantia: desglosePago.garantia.monto,
        tieneGarantia: conGarantia,
        montoNeto: desglosePago.montoNeto
      }
    });

    // NOTA: Los puntos de fidelización se agregan cuando el cliente APRUEBA el trabajo completado
    // (ver trabajoControlador.aprobarTrabajo), no al aceptar la cotización

    // Notificar al técnico
    const tecnico = await Usuario.findById(cotizacion.idTecnico);
    notificarCotizacionAceptada(cotizacion.idTecnico, cotizacion, trabajo);

    // Poblar trabajo para respuesta
    await trabajo.populate([
      { path: 'idTecnico', select: 'perfil datosTecnico' },
      { path: 'idServicio', select: 'tipo titulo descripcion ubicacion' }
    ]);

    res.json({
      exito: true,
      mensaje: '¡Cotización aceptada! El trabajo ha sido programado.',
      datos: {
        trabajo,
        cotizacion,
        desglosePago
      }
    });

  } catch (error) {
    console.error('Error al aceptar cotización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al aceptar cotización',
      error: error.message
    });
  }
};

/**
 * Rechazar cotización (cliente)
 * PUT /api/cotizaciones/:id/rechazar
 */
const rechazarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const cotizacion = await Cotizacion.findById(id).populate('idServicio');

    if (!cotizacion) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cotización no encontrada'
      });
    }

    // Verificar que el usuario es el dueño del servicio
    if (cotizacion.idServicio.idCliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para rechazar esta cotización'
      });
    }

    if (cotizacion.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Esta cotización ya no puede ser rechazada'
      });
    }

    cotizacion.estado = 'rechazada';
    cotizacion.fechaRespuesta = new Date();
    await cotizacion.save();

    res.json({
      exito: true,
      mensaje: 'Cotización rechazada',
      datos: cotizacion
    });

  } catch (error) {
    console.error('Error al rechazar cotización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al rechazar cotización',
      error: error.message
    });
  }
};

/**
 * Obtener cotización por ID
 * GET /api/cotizaciones/:id
 */
const obtenerCotizacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const cotizacion = await Cotizacion.findById(id)
      .populate('idTecnico', 'perfil datosTecnico')
      .populate({
        path: 'idServicio',
        select: 'tipo titulo descripcion urgencia ubicacion',
        populate: {
          path: 'idCliente',
          select: 'perfil.nombre perfil.apellido perfil.fotoUrl'
        }
      });

    if (!cotizacion) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cotización no encontrada'
      });
    }

    // Verificar permisos
    const esCliente = cotizacion.idServicio.idCliente._id.toString() === req.usuario._id.toString();
    const esTecnico = cotizacion.idTecnico._id.toString() === req.usuario._id.toString();

    if (!esCliente && !esTecnico) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para ver esta cotización'
      });
    }

    // Agregar desglose de precio
    const desglose = calcularDesglosePrecio(cotizacion.precio, {
      esEmergencia: cotizacion.idServicio.urgencia === 'emergencia'
    });

    res.json({
      exito: true,
      datos: {
        cotizacion,
        desglosePrecio: desglose
      }
    });

  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener cotización',
      error: error.message
    });
  }
};

/**
 * Cancelar cotización (técnico)
 * PUT /api/cotizaciones/:id/cancelar
 */
const cancelarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;

    const cotizacion = await Cotizacion.findById(id);

    if (!cotizacion) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cotización no encontrada'
      });
    }

    // Verificar que sea el técnico propietario
    if (cotizacion.idTecnico.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo puedes cancelar tus propias cotizaciones'
      });
    }

    // Verificar que esté en estado pendiente
    if (cotizacion.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Solo se pueden cancelar cotizaciones pendientes'
      });
    }

    cotizacion.estado = 'cancelada';
    cotizacion.fechaCancelacion = new Date();
    await cotizacion.save();

    // Notificar al cliente sobre la cancelación
    const servicio = await Servicio.findById(cotizacion.idServicio);
    if (servicio) {
      notificarCotizacionCancelada(servicio.idCliente, cotizacion, req.usuario);
    }

    res.json({
      exito: true,
      mensaje: 'Cotización cancelada exitosamente',
      datos: cotizacion
    });

  } catch (error) {
    console.error('Error al cancelar cotización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cancelar cotización',
      error: error.message
    });
  }
};

/**
 * Editar cotización existente (técnico)
 * PUT /api/cotizaciones/:id
 */
const editarCotizacion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      precio,
      montoTotal,
      tiempoEstimado,
      descripcionTrabajo,
      descripcion,
      materiales,
      desglose,
      notasAdicionales,
      garantia
    } = req.body;

    // Buscar la cotización
    const cotizacion = await Cotizacion.findById(id);
    if (!cotizacion) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Cotización no encontrada'
      });
    }

    // Verificar que sea el técnico propietario
    if (cotizacion.idTecnico.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo puedes editar tus propias cotizaciones'
      });
    }

    // Verificar que esté en estado pendiente (no aceptada aún)
    if (cotizacion.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Solo se pueden editar cotizaciones pendientes. Esta cotización ya fue ' + cotizacion.estado
      });
    }

    // Obtener servicio para notificar al cliente
    const servicio = await Servicio.findById(cotizacion.idServicio);
    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado'
      });
    }

    // Obtener datos del técnico
    const tecnico = await Usuario.findById(req.usuario._id);

    // Normalizar precio
    const precioFinal = precio || montoTotal;
    if (precioFinal) {
      cotizacion.precio = parseFloat(precioFinal);
    }

    // Normalizar descripción
    const descripcionFinal = descripcionTrabajo || descripcion;
    if (descripcionFinal) {
      cotizacion.descripcionTrabajo = descripcionFinal;
    }

    // Normalizar tiempo estimado
    if (tiempoEstimado) {
      if (typeof tiempoEstimado === 'string') {
        const match = tiempoEstimado.match(/(\d+)\s*(hora|horas|día|dias|dia|días)?/i);
        cotizacion.tiempoEstimado = {
          valor: match ? parseInt(match[1]) : 1,
          unidad: tiempoEstimado.toLowerCase().includes('día') || tiempoEstimado.toLowerCase().includes('dia') ? 'dias' : 'horas'
        };
      } else if (typeof tiempoEstimado === 'object') {
        cotizacion.tiempoEstimado = {
          valor: tiempoEstimado.valor || 1,
          unidad: tiempoEstimado.unidad || 'horas'
        };
      }
    }

    // Actualizar materiales
    if (desglose && desglose.length > 0) {
      cotizacion.materiales = desglose.map(item => ({
        nombre: item.concepto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        incluidoEnPrecio: true
      }));
    } else if (materiales) {
      cotizacion.materiales = materiales;
    }

    // Actualizar notas/garantía
    if (notasAdicionales !== undefined || garantia !== undefined) {
      cotizacion.notasAdicionales = notasAdicionales || garantia || '';
    }

    // Actualizar timestamp de edición
    cotizacion.fechaEdicion = new Date();

    // Guardar cambios
    await cotizacion.save();

    // Notificar al cliente sobre la edición
    notificarCotizacionEditada(servicio.idCliente, cotizacion, tecnico);

    // Poblar datos para respuesta
    await cotizacion.populate('idTecnico', 'perfil datosTecnico');

    res.json({
      exito: true,
      mensaje: 'Cotización actualizada correctamente. El cliente ha sido notificado.',
      datos: cotizacion
    });

  } catch (error) {
    console.error('Error al editar cotización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al editar cotización',
      error: error.message
    });
  }
};

/**
 * Obtener cotización del técnico para un servicio específico
 * GET /api/cotizaciones/mi-cotizacion/:servicioId
 */
const obtenerMiCotizacionPorServicio = async (req, res) => {
  try {
    const { servicioId } = req.params;
    const idTecnico = req.usuario._id;

    const cotizacion = await Cotizacion.findOne({
      idServicio: servicioId,
      idTecnico,
      estado: { $in: ['pendiente', 'aceptada'] }
    }).populate({
      path: 'idServicio',
      select: 'tipo titulo descripcion urgencia estado ubicacion'
    });

    if (!cotizacion) {
      return res.json({
        exito: true,
        datos: null,
        mensaje: 'No tienes cotización para este servicio'
      });
    }

    res.json({
      exito: true,
      datos: cotizacion
    });

  } catch (error) {
    console.error('Error al obtener cotización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener cotización',
      error: error.message
    });
  }
};

module.exports = {
  crearCotizacion,
  obtenerCotizacionesPorServicio,
  obtenerMisCotizaciones,
  aceptarCotizacion,
  rechazarCotizacion,
  cancelarCotizacion,
  obtenerCotizacionPorId,
  editarCotizacion,
  obtenerMiCotizacionPorServicio
};
