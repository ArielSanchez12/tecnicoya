/**
 * Controlador de Servicios
 * TécnicoYa - Backend
 * Gestión de solicitudes de servicio
 */

const { validationResult } = require('express-validator');
const Servicio = require('../models/Servicio');
const Usuario = require('../models/Usuario');
const Cotizacion = require('../models/Cotizacion');
const Trabajo = require('../models/Trabajo');
const { crearPuntoGeoJSON, calcularDistancia } = require('../utils/geolocalizacion');
const { notificarNuevoServicio, notificarTecnicoInmediato, notificarTecnicoAceptoInmediato, notificarServicioEditado, notificarServicioCancelado } = require('../utils/notificaciones');
const { calcularPrecioInmediato, MULTIPLICADOR_EMERGENCIA } = require('../utils/precios');

/**
 * Crear nueva solicitud de servicio
 * POST /api/servicios
 */
const crearServicio = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const {
      tipo,
      titulo,
      descripcion,
      ubicacion,
      urgencia,
      fechaPreferida,
      horaPreferida
    } = req.body;

    // Crear objeto de servicio
    const datosServicio = {
      idCliente: req.usuario._id,
      tipo,
      titulo,
      descripcion,
      urgencia: urgencia || 'normal',
      fechaPreferida: fechaPreferida ? new Date(fechaPreferida) : null,
      horaPreferida,
      ubicacion: {
        direccion: ubicacion.direccion,
        referencia: ubicacion.referencia || '',
        coordenadas: crearPuntoGeoJSON(
          parseFloat(ubicacion.latitud),
          parseFloat(ubicacion.longitud)
        )
      }
    };

    // Agregar fotos si se subieron
    if (req.archivosSubidos && req.archivosSubidos.length > 0) {
      datosServicio.fotos = req.archivosSubidos.map(foto => ({
        url: foto.url,
        publicId: foto.publicId
      }));
    }

    // Crear servicio
    const nuevoServicio = await Servicio.create(datosServicio);

    // Buscar técnicos cercanos para notificar
    const coordenadas = [parseFloat(ubicacion.longitud), parseFloat(ubicacion.latitud)];
    const radioKm = urgencia === 'emergencia' ? 15 : 10;

    const filtroTecnicos = {
      rol: 'tecnico',
      activo: true,
      'datosTecnico.especialidades': tipo,
      'datosTecnico.ubicacionBase.coordenadas': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordenadas
          },
          $maxDistance: radioKm * 1000
        }
      }
    };

    // Si es emergencia, solo técnicos con disponibleEmergencias
    if (urgencia === 'emergencia') {
      filtroTecnicos['datosTecnico.disponibleEmergencias'] = true;
    }

    const tecnicosCercanos = await Usuario.find(filtroTecnicos).limit(20);

    // Registrar técnicos notificados
    if (tecnicosCercanos.length > 0) {
      nuevoServicio.tecnicosNotificados = tecnicosCercanos.map(t => ({
        idTecnico: t._id,
        notificadoEn: new Date(),
        respondio: false
      }));
      await nuevoServicio.save();

      // Notificar via Socket.io
      notificarNuevoServicio(
        tecnicosCercanos.map(t => t._id),
        nuevoServicio,
        urgencia === 'emergencia'
      );
    }

    // Poblar datos del cliente para la respuesta
    await nuevoServicio.populate('idCliente', 'perfil.nombre perfil.apellido perfil.fotoUrl');

    res.status(201).json({
      exito: true,
      mensaje: `Solicitud creada. ${tecnicosCercanos.length} técnicos cercanos notificados.`,
      datos: {
        servicio: nuevoServicio,
        tecnicosNotificados: tecnicosCercanos.length
      }
    });

  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear solicitud de servicio',
      error: error.message
    });
  }
};

/**
 * Solicitar técnico inmediato (estilo Uber)
 * POST /api/servicios/instantaneo
 */
const solicitarTecnicoInmediato = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const { tipo, descripcion, ubicacion, esEmergencia } = req.body;

    // Coordenadas del cliente
    const coordenadas = [parseFloat(ubicacion.longitud), parseFloat(ubicacion.latitud)];

    // Buscar técnicos disponibles ahora en un radio de 5km
    const filtroTecnicos = {
      rol: 'tecnico',
      activo: true,
      'datosTecnico.especialidades': tipo,
      'datosTecnico.disponibleAhora': true,
      'datosTecnico.ubicacionBase.coordenadas': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: coordenadas
          },
          $maxDistance: 5000 // 5km
        }
      }
    };

    if (esEmergencia) {
      filtroTecnicos['datosTecnico.disponibleEmergencias'] = true;
    }

    const tecnicosDisponibles = await Usuario.find(filtroTecnicos).limit(3);

    if (tecnicosDisponibles.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'No hay técnicos disponibles cerca en este momento. Intenta con una solicitud normal.'
      });
    }

    // Calcular precio automático basado en el primer técnico
    const tecnicoPrincipal = tecnicosDisponibles[0];
    const tarifaBase = tecnicoPrincipal.datosTecnico.tarifaPorHora || 100;
    const desglosePrecio = calcularPrecioInmediato(tarifaBase, 1, esEmergencia);

    // Crear servicio marcado como inmediato
    const datosServicio = {
      idCliente: req.usuario._id,
      tipo,
      titulo: `Servicio inmediato de ${tipo}`,
      descripcion,
      urgencia: esEmergencia ? 'emergencia' : 'normal',
      esInmediato: true,
      precioAutomatico: desglosePrecio.total,
      ubicacion: {
        direccion: ubicacion.direccion,
        referencia: ubicacion.referencia || '',
        coordenadas: crearPuntoGeoJSON(
          parseFloat(ubicacion.latitud),
          parseFloat(ubicacion.longitud)
        )
      },
      tecnicosNotificados: tecnicosDisponibles.map(t => ({
        idTecnico: t._id,
        notificadoEn: new Date(),
        respondio: false
      }))
    };

    // Agregar fotos si se subieron
    if (req.archivosSubidos && req.archivosSubidos.length > 0) {
      datosServicio.fotos = req.archivosSubidos.map(foto => ({
        url: foto.url,
        publicId: foto.publicId
      }));
    }

    const nuevoServicio = await Servicio.create(datosServicio);

    // Notificar a los técnicos cercanos
    notificarTecnicoInmediato(tecnicosDisponibles, nuevoServicio, desglosePrecio.total);

    res.status(201).json({
      exito: true,
      mensaje: 'Buscando técnico disponible...',
      datos: {
        servicio: nuevoServicio,
        precioEstimado: desglosePrecio,
        tecnicosNotificados: tecnicosDisponibles.length,
        tiempoEspera: 60 // segundos
      }
    });

  } catch (error) {
    console.error('Error en servicio inmediato:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al solicitar técnico inmediato',
      error: error.message
    });
  }
};

/**
 * Técnico acepta servicio inmediato
 * POST /api/servicios/:id/aceptar-inmediato
 */
const aceptarServicioInmediato = async (req, res) => {
  try {
    const { id } = req.params;
    const idTecnico = req.usuario._id;

    const servicio = await Servicio.findById(id);

    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado'
      });
    }

    if (!servicio.esInmediato) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Este no es un servicio inmediato'
      });
    }

    if (servicio.estado !== 'pendiente') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Este servicio ya fue tomado por otro técnico'
      });
    }

    // Verificar que el técnico fue notificado
    const fueNotificado = servicio.tecnicosNotificados.some(
      t => t.idTecnico.toString() === idTecnico.toString()
    );

    if (!fueNotificado) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No fuiste notificado para este servicio'
      });
    }

    // Actualizar servicio
    servicio.estado = 'aceptado';
    servicio.tecnicosNotificados = servicio.tecnicosNotificados.map(t => {
      if (t.idTecnico.toString() === idTecnico.toString()) {
        t.respondio = true;
      }
      return t;
    });
    await servicio.save();

    // Crear cotización automática
    const tecnico = await Usuario.findById(idTecnico);
    const cotizacion = await Cotizacion.create({
      idServicio: servicio._id,
      idTecnico,
      precio: servicio.precioAutomatico,
      tiempoEstimado: { valor: 1, unidad: 'horas' },
      descripcionTrabajo: 'Servicio inmediato aceptado',
      estado: 'aceptada',
      fechaRespuesta: new Date(),
      datosTecnicoSnapshot: {
        nombre: `${tecnico.perfil.nombre} ${tecnico.perfil.apellido}`,
        calificacion: tecnico.datosTecnico.calificacion,
        trabajosCompletados: tecnico.datosTecnico.trabajosCompletados,
        fotoUrl: tecnico.perfil.fotoUrl
      }
    });

    // Crear trabajo
    const trabajo = await Trabajo.create({
      idServicio: servicio._id,
      idCotizacion: cotizacion._id,
      idCliente: servicio.idCliente,
      idTecnico,
      fechaProgramada: new Date(),
      estado: 'en_camino',
      pago: {
        monto: servicio.precioAutomatico,
        estado: 'pendiente',
        porcentajeComision: servicio.urgencia === 'emergencia' ? 20 : 12
      }
    });

    // Calcular pago
    trabajo.calcularPago(false, servicio.urgencia === 'emergencia');
    await trabajo.save();

    // Notificar al cliente
    notificarTecnicoAceptoInmediato(servicio.idCliente, tecnico, trabajo);

    await trabajo.populate('idTecnico', 'perfil datosTecnico');

    res.json({
      exito: true,
      mensaje: '¡Trabajo aceptado! Ve en camino al cliente.',
      datos: {
        trabajo,
        cotizacion
      }
    });

  } catch (error) {
    console.error('Error al aceptar servicio inmediato:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al aceptar servicio',
      error: error.message
    });
  }
};

/**
 * Obtener mis servicios (cliente)
 * GET /api/servicios
 */
const obtenerMisServicios = async (req, res) => {
  try {
    const { estado, pagina = 1, limite = 10 } = req.query;
    const saltar = (parseInt(pagina) - 1) * parseInt(limite);

    const filtro = { idCliente: req.usuario._id };
    if (estado) {
      filtro.estado = estado;
    }

    const [servicios, total] = await Promise.all([
      Servicio.find(filtro)
        .sort({ fechaCreacion: -1 })
        .skip(saltar)
        .limit(parseInt(limite)),
      Servicio.countDocuments(filtro)
    ]);

    res.json({
      exito: true,
      datos: {
        servicios,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener servicios',
      error: error.message
    });
  }
};

/**
 * Obtener servicios disponibles para técnicos
 * GET /api/servicios/disponibles
 * La búsqueda usa el radio del técnico + bonus de membresía
 */
const obtenerServiciosDisponibles = async (req, res) => {
  try {
    const { latitud, longitud, radio, tipo, limite } = req.query;

    if (!latitud || !longitud) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Se requieren coordenadas (latitud, longitud)'
      });
    }

    // Calcular radio efectivo: base (del request o 10km) + bonus de membresía
    const radioBase = parseInt(radio) || 10;
    const radioExtendido = req.usuario?.datosTecnico?.membresia?.radioExtendido || 0;
    const radioEfectivo = radioBase + radioExtendido;
    const limiteResultados = parseInt(limite) || 20;

    console.log(`📍 Búsqueda de servicios - Radio base: ${radioBase}km, Membresía bonus: ${radioExtendido}km, Total: ${radioEfectivo}km`);

    const lat = parseFloat(latitud);
    const lon = parseFloat(longitud);
    const coordenadas = [lon, lat];

    // Construir filtro base
    const filtroBase = {
      estado: { $in: ['pendiente', 'cotizado'] }
    };

    // Filtrar por especialidades del técnico si las tiene
    if (req.usuario?.datosTecnico?.especialidades?.length > 0) {
      filtroBase.tipo = { $in: req.usuario.datosTecnico.especialidades };
    }

    // Filtrar por tipo específico si se proporciona
    if (tipo) {
      filtroBase.tipo = tipo;
    }

    let servicios = [];

    // Intentar usar búsqueda geoespacial con $near
    try {
      const filtroGeo = {
        ...filtroBase,
        'ubicacion.coordenadas': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordenadas
            },
            $maxDistance: radioEfectivo * 1000
          }
        }
      };

      servicios = await Servicio.find(filtroGeo)
        .populate('idCliente', 'perfil.nombre perfil.apellido perfil.fotoUrl')
        .sort({ fechaCreacion: -1 })
        .limit(limiteResultados);

    } catch (geoError) {
      // Si falla la búsqueda geoespacial, usar $geoWithin como fallback
      console.warn('⚠️ Búsqueda $near falló, usando fallback $geoWithin:', geoError.message);
      
      try {
        const filtroGeoWithin = {
          ...filtroBase,
          'ubicacion.coordenadas': {
            $geoWithin: {
              $centerSphere: [coordenadas, radioEfectivo / 6378.1] // radio en radianes
            }
          }
        };

        servicios = await Servicio.find(filtroGeoWithin)
          .populate('idCliente', 'perfil.nombre perfil.apellido perfil.fotoUrl')
          .sort({ fechaCreacion: -1 })
          .limit(limiteResultados);

      } catch (geoWithinError) {
        // Si también falla, buscar sin filtro geoespacial
        console.warn('⚠️ Búsqueda $geoWithin también falló, buscando sin filtro geo:', geoWithinError.message);
        
        servicios = await Servicio.find(filtroBase)
          .populate('idCliente', 'perfil.nombre perfil.apellido perfil.fotoUrl')
          .sort({ fechaCreacion: -1 })
          .limit(limiteResultados);
      }
    }

    // Obtener IDs de servicios para buscar cotizaciones del técnico actual
    const servicioIds = servicios.map(s => s._id);

    // Buscar cotizaciones del técnico actual para estos servicios
    const misCotizaciones = await Cotizacion.find({
      idServicio: { $in: servicioIds },
      idTecnico: req.usuario._id,
      estado: { $in: ['pendiente', 'aceptada'] }
    }).select('idServicio _id');

    // Crear un mapa de servicio -> cotización del técnico
    const cotizacionesMap = {};
    misCotizaciones.forEach(cot => {
      cotizacionesMap[cot.idServicio.toString()] = cot._id.toString();
    });

    // Calcular distancia para cada servicio
    const serviciosConDistancia = servicios.map(servicio => {
      const coords = servicio.ubicacion?.coordenadas?.coordinates;
      if (!coords || coords.length < 2) {
        return {
          ...servicio.toObject(),
          distancia: null,
          miCotizacionId: cotizacionesMap[servicio._id.toString()] || null,
          yaCotizado: !!cotizacionesMap[servicio._id.toString()]
        };
      }
      const [lonServicio, latServicio] = coords;
      const distancia = calcularDistancia(lat, lon, latServicio, lonServicio);
      return {
        ...servicio.toObject(),
        distancia,
        miCotizacionId: cotizacionesMap[servicio._id.toString()] || null,
        yaCotizado: !!cotizacionesMap[servicio._id.toString()]
      };
    });

    // Filtrar por distancia si no se pudo hacer búsqueda geoespacial
    const serviciosFiltrados = serviciosConDistancia.filter(s => 
      s.distancia === null || s.distancia <= radioEfectivo
    );

    res.json({
      exito: true,
      datos: serviciosFiltrados,
      meta: {
        radioEfectivo,
        radioBase,
        bonusMembresia: radioExtendido,
        total: serviciosFiltrados.length
      }
    });

  } catch (error) {
    console.error('Error al obtener servicios disponibles:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener servicios disponibles',
      error: error.message
    });
  }
};

/**
 * Obtener servicio por ID
 * GET /api/servicios/:id
 */
const obtenerServicioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findById(id)
      .populate('idCliente', 'perfil.nombre perfil.apellido perfil.fotoUrl perfil.telefono');

    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado'
      });
    }

    // Obtener cotizaciones del servicio (excluir canceladas)
    const cotizaciones = await Cotizacion.find({ 
      idServicio: id,
      estado: { $ne: 'cancelada' } // Excluir cotizaciones canceladas
    }).populate('idTecnico', 'perfil datosTecnico');

    // Buscar trabajo asociado si existe
    const Trabajo = require('../models/Trabajo');
    const trabajo = await Trabajo.findOne({ idServicio: id })
      .select('_id estado pago fechaProgramada resenaCliente resenaTecnico');

    res.json({
      exito: true,
      datos: {
        servicio,
        cotizaciones,
        trabajo: trabajo || null
      }
    });

  } catch (error) {
    console.error('Error al obtener servicio:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener servicio',
      error: error.message
    });
  }
};

/**
 * Cancelar servicio
 * PUT /api/servicios/:id/cancelar
 */
const cancelarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const servicio = await Servicio.findById(id);

    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado'
      });
    }

    // Verificar que sea el propietario
    if (servicio.idCliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para cancelar este servicio'
      });
    }

    // Verificar que se pueda cancelar
    if (!['pendiente', 'cotizado'].includes(servicio.estado)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se puede cancelar un servicio en este estado'
      });
    }

    servicio.estado = 'cancelado';
    servicio.motivoCancelacion = motivo || 'Cancelado por el cliente';
    await servicio.save();

    // Buscar técnicos que hayan enviado cotizaciones para notificarles
    const cotizaciones = await Cotizacion.find({
      idServicio: id,
      estado: 'pendiente'
    }).select('idTecnico');

    if (cotizaciones.length > 0) {
      const tecnicosIds = cotizaciones.map(c => c.idTecnico.toString());
      notificarServicioCancelado(tecnicosIds, servicio);
    }

    // Rechazar cotizaciones pendientes
    await Cotizacion.updateMany(
      { idServicio: id, estado: 'pendiente' },
      { $set: { estado: 'rechazada' } }
    );

    res.json({
      exito: true,
      mensaje: 'Servicio cancelado',
      datos: servicio
    });

  } catch (error) {
    console.error('Error al cancelar servicio:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cancelar servicio',
      error: error.message
    });
  }
};

/**
 * Editar servicio
 * PUT /api/servicios/:id
 */
const editarServicio = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const { id } = req.params;
    const {
      titulo,
      descripcion,
      ubicacion,
      urgencia,
      fechaPreferida,
      horaPreferida
    } = req.body;

    const servicio = await Servicio.findById(id);

    if (!servicio) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Servicio no encontrado'
      });
    }

    // Verificar que sea el propietario
    if (servicio.idCliente.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({
        exito: false,
        mensaje: 'No tienes permiso para editar este servicio'
      });
    }

    // Solo permitir editar si está en estado pendiente o cotizado
    if (!['pendiente', 'cotizado'].includes(servicio.estado)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se puede editar un servicio en este estado'
      });
    }

    // Actualizar campos permitidos
    if (titulo) servicio.titulo = titulo;
    if (descripcion) servicio.descripcion = descripcion;
    if (urgencia) servicio.urgencia = urgencia;
    if (fechaPreferida) servicio.fechaPreferida = new Date(fechaPreferida);
    if (horaPreferida) servicio.horaPreferida = horaPreferida;

    if (ubicacion) {
      servicio.ubicacion = {
        direccion: ubicacion.direccion || servicio.ubicacion.direccion,
        referencia: ubicacion.referencia || servicio.ubicacion.referencia,
        coordenadas: ubicacion.latitud && ubicacion.longitud
          ? crearPuntoGeoJSON(parseFloat(ubicacion.latitud), parseFloat(ubicacion.longitud))
          : servicio.ubicacion.coordenadas
      };
    }

    // Agregar nuevas fotos si se subieron
    if (req.archivosSubidos && req.archivosSubidos.length > 0) {
      const nuevasFotos = req.archivosSubidos.map(foto => ({
        url: foto.url,
        publicId: foto.publicId
      }));
      servicio.fotos = [...(servicio.fotos || []), ...nuevasFotos];
    }

    await servicio.save();

    // Buscar técnicos que hayan enviado cotizaciones para notificarles
    const cotizaciones = await Cotizacion.find({
      idServicio: id,
      estado: 'pendiente'
    }).select('idTecnico');

    if (cotizaciones.length > 0) {
      const tecnicosIds = cotizaciones.map(c => c.idTecnico.toString());
      notificarServicioEditado(tecnicosIds, servicio);
    }

    res.json({
      exito: true,
      mensaje: 'Servicio actualizado correctamente',
      datos: servicio
    });

  } catch (error) {
    console.error('Error al editar servicio:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al editar servicio',
      error: error.message
    });
  }
};

module.exports = {
  crearServicio,
  solicitarTecnicoInmediato,
  aceptarServicioInmediato,
  obtenerMisServicios,
  obtenerServiciosDisponibles,
  obtenerServicioPorId,
  editarServicio,
  cancelarServicio,
  buscarTecnicoInstantaneo
};

/**
 * Buscar técnico instantáneo disponible (sin crear servicio)
 * POST /api/servicios/buscar-tecnico-instantaneo
 */
async function buscarTecnicoInstantaneo(req, res) {
  try {
    const { tipoServicio, latitud, longitud } = req.body;

    if (!tipoServicio || latitud === undefined || longitud === undefined) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Tipo de servicio y ubicación son requeridos'
      });
    }

    const coordenadas = [parseFloat(longitud), parseFloat(latitud)];
    const radioKm = 50; // Radio amplio para buscar técnicos 24/7

    // Buscar técnicos disponibles con servicio 24/7 y la especialidad
    const filtroTecnicos = {
      rol: 'tecnico',
      activo: true,
      'datosTecnico.especialidades': tipoServicio,
      'datosTecnico.emergencia24h': true,
      'datosTecnico.disponibleAhora': true
    };

    // Buscar técnicos que tengan ubicación configurada
    const tecnicos = await Usuario.find({
      ...filtroTecnicos,
      'datosTecnico.ubicacionBase.coordenadas.coordinates': { $ne: [0, 0] }
    });

    if (tecnicos.length === 0) {
      // Si no hay con ubicación, buscar cualquier técnico con 24/7
      const tecnicosSinUbicacion = await Usuario.find(filtroTecnicos).limit(1);

      if (tecnicosSinUbicacion.length > 0) {
        const tecnico = tecnicosSinUbicacion[0];
        return res.json({
          exito: true,
          mensaje: 'Técnico encontrado',
          datos: {
            tecnico: {
              _id: tecnico._id,
              nombre: tecnico.perfil.nombre,
              apellido: tecnico.perfil.apellido,
              perfil: tecnico.perfil,
              datosTecnico: tecnico.datosTecnico
            },
            distancia: null // Sin distancia porque no tiene ubicación
          }
        });
      }

      return res.json({
        exito: false,
        mensaje: 'No hay técnicos disponibles con servicio 24/7 para este tipo de servicio',
        datos: null
      });
    }

    // Calcular distancia para cada técnico y ordenar por cercanía
    const tecnicosConDistancia = tecnicos.map(tecnico => {
      const coordsTecnico = tecnico.datosTecnico?.ubicacionBase?.coordenadas?.coordinates || [0, 0];
      const distancia = calcularDistancia(
        latitud,
        longitud,
        coordsTecnico[1], // latitud
        coordsTecnico[0]  // longitud
      );
      return { tecnico, distancia };
    }).sort((a, b) => a.distancia - b.distancia);

    // Tomar el más cercano
    const masProximo = tecnicosConDistancia[0];

    res.json({
      exito: true,
      mensaje: 'Técnico encontrado',
      datos: {
        tecnico: {
          _id: masProximo.tecnico._id,
          nombre: masProximo.tecnico.perfil.nombre,
          apellido: masProximo.tecnico.perfil.apellido,
          perfil: masProximo.tecnico.perfil,
          datosTecnico: masProximo.tecnico.datosTecnico
        },
        distancia: masProximo.distancia
      }
    });

  } catch (error) {
    console.error('Error al buscar técnico instantáneo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al buscar técnico',
      error: error.message
    });
  }
}
