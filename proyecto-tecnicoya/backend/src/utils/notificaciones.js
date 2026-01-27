/**
 * Utilidades de Notificaciones
 * TécnicoYa - Backend
 * Manejo de notificaciones via Socket.io
 */

const { obtenerIO, emitirAUsuario, emitirASala, usuarioConectado } = require('../config/socket');

// Tipos de notificación
const TIPOS_NOTIFICACION = {
  NUEVA_COTIZACION: 'nueva_cotizacion',
  COTIZACION_ACEPTADA: 'cotizacion_aceptada',
  COTIZACION_RECHAZADA: 'cotizacion_rechazada',
  COTIZACION_NO_SELECCIONADA: 'cotizacion_no_seleccionada',
  NUEVO_SERVICIO: 'nuevo_servicio',
  ESTADO_ACTUALIZADO: 'estado_actualizado',
  NUEVO_MENSAJE: 'nuevo_mensaje',
  TECNICO_EN_CAMINO: 'tecnico_en_camino',
  TRABAJO_COMPLETADO: 'trabajo_completado',
  NUEVA_RESENA: 'nueva_resena',
  DISPUTA_ABIERTA: 'disputa_abierta',
  PAGO_LIBERADO: 'pago_liberado',
  PAGO_PROCESADO: 'pago_procesado',
  PUNTOS_GANADOS: 'puntos_ganados',
  TECNICO_INMEDIATO: 'tecnico_inmediato',
  TECNICO_ACEPTO_INMEDIATO: 'tecnico_acepto_inmediato'
};

/**
 * Notifica a un usuario sobre una nueva cotización
 * @param {String} idCliente - ID del cliente
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Object} tecnico - Datos del técnico
 */
const notificarNuevaCotizacion = (idCliente, cotizacion, tecnico) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.NUEVA_COTIZACION,
    titulo: '¡Nueva cotización recibida!',
    mensaje: `${tecnico.perfil.nombre} te ha enviado una cotización de $${cotizacion.precio}`,
    datos: {
      idCotizacion: cotizacion._id,
      idServicio: cotizacion.idServicio,
      precio: cotizacion.precio,
      tecnico: {
        id: tecnico._id,
        nombre: tecnico.perfil.nombre,
        foto: tecnico.perfil.fotoUrl,
        calificacion: tecnico.datosTecnico?.calificacion
      }
    },
    fecha: new Date()
  };

  emitirAUsuario(idCliente.toString(), TIPOS_NOTIFICACION.NUEVA_COTIZACION, notificacion);
  return notificacion;
};

/**
 * Notifica a un técnico que su cotización fue aceptada
 * @param {String} idTecnico - ID del técnico
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Object} trabajo - Datos del trabajo creado
 */
const notificarCotizacionAceptada = (idTecnico, cotizacion, trabajo) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.COTIZACION_ACEPTADA,
    titulo: '¡Tu cotización fue aceptada!',
    mensaje: `Tu cotización por $${cotizacion.precio} ha sido aceptada`,
    datos: {
      idCotizacion: cotizacion._id,
      idTrabajo: trabajo._id,
      fechaProgramada: trabajo.fechaProgramada
    },
    fecha: new Date()
  };

  emitirAUsuario(idTecnico.toString(), TIPOS_NOTIFICACION.COTIZACION_ACEPTADA, notificacion);
  return notificacion;
};

/**
 * Notifica a un cliente que un técnico editó su cotización
 * @param {String} idCliente - ID del cliente
 * @param {Object} cotizacion - Datos de la cotización actualizada
 * @param {Object} tecnico - Datos del técnico
 */
const notificarCotizacionEditada = (idCliente, cotizacion, tecnico) => {
  const notificacion = {
    tipo: 'cotizacion_editada',
    titulo: '📝 Cotización actualizada',
    mensaje: `${tecnico.perfil.nombre} ha modificado su cotización a $${cotizacion.precio}`,
    datos: {
      idCotizacion: cotizacion._id,
      idServicio: cotizacion.idServicio,
      precio: cotizacion.precio,
      tecnico: {
        id: tecnico._id,
        nombre: tecnico.perfil.nombre,
        foto: tecnico.perfil.fotoUrl,
        calificacion: tecnico.datosTecnico?.calificacion
      }
    },
    fecha: new Date()
  };

  emitirAUsuario(idCliente.toString(), 'cotizacion_editada', notificacion);
  return notificacion;
};

/**
 * Notifica al cliente que un técnico canceló su cotización
 * @param {String} idCliente - ID del cliente
 * @param {Object} cotizacion - Datos de la cotización cancelada
 * @param {Object} tecnico - Datos del técnico
 */
const notificarCotizacionCancelada = (idCliente, cotizacion, tecnico) => {
  const notificacion = {
    tipo: 'cotizacion_cancelada',
    titulo: '❌ Cotización cancelada',
    mensaje: `${tecnico.perfil.nombre} ha cancelado su cotización de $${cotizacion.precio}`,
    datos: {
      idCotizacion: cotizacion._id,
      idServicio: cotizacion.idServicio,
      tecnico: {
        id: tecnico._id,
        nombre: tecnico.perfil.nombre
      }
    },
    fecha: new Date()
  };

  emitirAUsuario(idCliente.toString(), 'cotizacion_cancelada', notificacion);
  return notificacion;
};

/**
 * Notifica a técnicos que un servicio fue editado por el cliente
 * @param {Array} tecnicos - Array de IDs de técnicos con cotizaciones
 * @param {Object} servicio - Datos del servicio actualizado
 */
const notificarServicioEditado = (tecnicos, servicio) => {
  const notificacion = {
    tipo: 'servicio_editado',
    titulo: '📝 Servicio actualizado',
    mensaje: `El cliente ha modificado la solicitud: ${servicio.titulo}`,
    datos: {
      idServicio: servicio._id,
      titulo: servicio.titulo,
      descripcion: servicio.descripcion?.substring(0, 100)
    },
    fecha: new Date()
  };

  tecnicos.forEach(idTecnico => {
    emitirAUsuario(idTecnico.toString(), 'servicio_editado', notificacion);
  });

  return notificacion;
};

/**
 * Notifica a técnicos que un servicio fue cancelado/eliminado por el cliente
 * @param {Array} tecnicos - Array de IDs de técnicos con cotizaciones
 * @param {Object} servicio - Datos del servicio cancelado
 */
const notificarServicioCancelado = (tecnicos, servicio) => {
  const notificacion = {
    tipo: 'servicio_cancelado',
    titulo: '❌ Servicio cancelado',
    mensaje: `El cliente ha cancelado la solicitud: ${servicio.titulo}`,
    datos: {
      idServicio: servicio._id,
      titulo: servicio.titulo,
      tipoServicio: servicio.tipo
    },
    fecha: new Date()
  };

  tecnicos.forEach(idTecnico => {
    emitirAUsuario(idTecnico.toString(), 'servicio_cancelado', notificacion);
  });

  return notificacion;
};

/**
 * Notifica a técnicos cercanos sobre un nuevo servicio
 * @param {Array} tecnicos - Array de IDs de técnicos
 * @param {Object} servicio - Datos del servicio
 * @param {Boolean} esEmergencia - Si es servicio de emergencia
 */
const notificarNuevoServicio = (tecnicos, servicio, esEmergencia = false) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.NUEVO_SERVICIO,
    titulo: esEmergencia ? '🚨 ¡EMERGENCIA! Nueva solicitud' : '📋 Nueva solicitud de servicio',
    mensaje: `Nuevo servicio de ${traducirTipoServicio(servicio.tipo)} cerca de ti`,
    datos: {
      idServicio: servicio._id,
      tipo: servicio.tipo,
      titulo: servicio.titulo,
      urgencia: servicio.urgencia,
      ubicacion: servicio.ubicacion
    },
    esEmergencia,
    fecha: new Date()
  };

  tecnicos.forEach(idTecnico => {
    emitirAUsuario(idTecnico.toString(), TIPOS_NOTIFICACION.NUEVO_SERVICIO, notificacion);
  });

  return notificacion;
};

/**
 * Notifica cambio de estado de un trabajo
 * @param {Object} trabajo - Datos del trabajo
 * @param {String} estadoAnterior - Estado anterior
 */
const notificarCambioEstado = (trabajo, estadoAnterior) => {
  const estadosTexto = {
    'programado': 'Trabajo programado',
    'en_camino': 'Técnico en camino',
    'en_progreso': 'Trabajo en progreso',
    'completado': 'Trabajo completado',
    'cancelado': 'Trabajo cancelado',
    'disputa': 'Disputa abierta'
  };

  const notificacion = {
    tipo: TIPOS_NOTIFICACION.ESTADO_ACTUALIZADO,
    titulo: '📍 Actualización de estado',
    mensaje: estadosTexto[trabajo.estado] || trabajo.estado,
    datos: {
      idTrabajo: trabajo._id,
      estadoAnterior,
      estadoNuevo: trabajo.estado
    },
    fecha: new Date()
  };

  // Notificar a ambas partes
  emitirAUsuario(trabajo.idCliente.toString(), TIPOS_NOTIFICACION.ESTADO_ACTUALIZADO, notificacion);
  emitirAUsuario(trabajo.idTecnico.toString(), TIPOS_NOTIFICACION.ESTADO_ACTUALIZADO, notificacion);

  // También emitir a la sala del trabajo
  emitirASala(`trabajo_${trabajo._id}`, TIPOS_NOTIFICACION.ESTADO_ACTUALIZADO, notificacion);

  return notificacion;
};

/**
 * Notifica para servicio inmediato (estilo Uber)
 * @param {Array} tecnicos - Array de técnicos cercanos (máx 3)
 * @param {Object} servicio - Datos del servicio
 * @param {Number} precioAutomatico - Precio calculado automáticamente
 */
const notificarTecnicoInmediato = (tecnicos, servicio, precioAutomatico) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.TECNICO_INMEDIATO,
    titulo: '⚡ ¡Trabajo inmediato disponible!',
    mensaje: `Servicio de ${traducirTipoServicio(servicio.tipo)} - $${precioAutomatico}`,
    datos: {
      idServicio: servicio._id,
      tipo: servicio.tipo,
      descripcion: servicio.descripcion.substring(0, 100),
      ubicacion: servicio.ubicacion,
      precio: precioAutomatico
    },
    expira: new Date(Date.now() + 60000), // Expira en 1 minuto
    fecha: new Date()
  };

  // Notificar solo a los 3 técnicos más cercanos
  tecnicos.slice(0, 3).forEach(tecnico => {
    emitirAUsuario(tecnico._id.toString(), TIPOS_NOTIFICACION.TECNICO_INMEDIATO, notificacion);
  });

  return { notificacion, tecnicosNotificados: tecnicos.slice(0, 3).map(t => t._id) };
};

/**
 * Notifica al cliente que un técnico aceptó el trabajo inmediato
 * @param {String} idCliente - ID del cliente
 * @param {Object} tecnico - Datos del técnico
 * @param {Object} trabajo - Datos del trabajo
 */
const notificarTecnicoAceptoInmediato = (idCliente, tecnico, trabajo) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.TECNICO_ACEPTO_INMEDIATO,
    titulo: 'Técnico encontrado',
    mensaje: `${tecnico.perfil.nombre} aceptó tu solicitud y va en camino`,
    datos: {
      idTrabajo: trabajo._id,
      tecnico: {
        id: tecnico._id,
        nombre: `${tecnico.perfil.nombre} ${tecnico.perfil.apellido}`,
        foto: tecnico.perfil.fotoUrl,
        telefono: tecnico.perfil.telefono,
        calificacion: tecnico.datosTecnico?.calificacion
      }
    },
    fecha: new Date()
  };

  emitirAUsuario(idCliente.toString(), TIPOS_NOTIFICACION.TECNICO_ACEPTO_INMEDIATO, notificacion);
  return notificacion;
};

/**
 * Notifica sobre nueva reseña
 * @param {String} idUsuario - ID del usuario reseñado
 * @param {Object} resena - Datos de la reseña
 */
const notificarNuevaResena = (idUsuario, resena) => {
  const estrellas = '⭐'.repeat(resena.calificacion);

  const notificacion = {
    tipo: TIPOS_NOTIFICACION.NUEVA_RESENA,
    titulo: '📝 Nueva reseña recibida',
    mensaje: `Has recibido una calificación de ${resena.calificacion}/5 ${estrellas}`,
    datos: {
      idResena: resena._id,
      calificacion: resena.calificacion,
      comentario: resena.comentario?.substring(0, 100)
    },
    fecha: new Date()
  };

  emitirAUsuario(idUsuario.toString(), TIPOS_NOTIFICACION.NUEVA_RESENA, notificacion);
  return notificacion;
};

/**
 * Traduce el tipo de servicio a texto legible
 * @param {String} tipo - Tipo de servicio en el sistema
 * @returns {String} - Tipo traducido
 */
const traducirTipoServicio = (tipo) => {
  const traducciones = {
    'plomeria': 'Plomería',
    'electricidad': 'Electricidad',
    'cerrajeria': 'Cerrajería',
    'carpinteria': 'Carpintería',
    'pintura': 'Pintura',
    'aire_acondicionado': 'Aire Acondicionado',
    'refrigeracion': 'Refrigeración',
    'albanileria': 'Albañilería',
    'herreria': 'Herrería',
    'jardineria': 'Jardinería',
    'limpieza': 'Limpieza',
    'mudanzas': 'Mudanzas',
    'electrodomesticos': 'Electrodomésticos',
    'computadoras': 'Computadoras',
    'otro': 'Otro'
  };

  return traducciones[tipo] || tipo;
};

/**
 * Verifica si un usuario está conectado
 * @param {String} idUsuario - ID del usuario
 * @returns {Boolean}
 */
const verificarUsuarioConectado = (idUsuario) => {
  return usuarioConectado(idUsuario.toString());
};

/**
 * Notifica al técnico que su cotización no fue seleccionada (mensaje amigable)
 * @param {String} idTecnico - ID del técnico
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Object} servicio - Datos del servicio
 */
const notificarCotizacionNoSeleccionada = (idTecnico, cotizacion, servicio) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.COTIZACION_NO_SELECCIONADA,
    titulo: 'Cotización no seleccionada',
    mensaje: `El cliente eligió otra cotización para el servicio de ${traducirTipoServicio(servicio.tipo)}`,
    datos: {
      idCotizacion: cotizacion._id,
      idServicio: servicio._id,
      tipoServicio: servicio.tipo
    },
    fecha: new Date()
  };

  emitirAUsuario(idTecnico.toString(), TIPOS_NOTIFICACION.COTIZACION_NO_SELECCIONADA, notificacion);
  return notificacion;
};

/**
 * Notifica al cliente que su pago fue procesado
 * @param {String} idCliente - ID del cliente
 * @param {Object} trabajo - Datos del trabajo
 */
const notificarPagoProcesado = (idCliente, trabajo) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.PAGO_PROCESADO,
    titulo: 'Pago procesado',
    mensaje: `Tu pago de $${trabajo.pago.monto.toFixed(2)} ha sido procesado${trabajo.pago.tieneGarantia ? ' y está protegido' : ''}`,
    datos: {
      idTrabajo: trabajo._id,
      monto: trabajo.pago.monto,
      tieneGarantia: trabajo.pago.tieneGarantia
    },
    fecha: new Date()
  };

  emitirAUsuario(idCliente.toString(), TIPOS_NOTIFICACION.PAGO_PROCESADO, notificacion);
  return notificacion;
};

/**
 * Notifica al técnico que el pago fue liberado
 * @param {String} idTecnico - ID del técnico
 * @param {Object} trabajo - Datos del trabajo
 */
const notificarPagoLiberado = (idTecnico, trabajo) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.PAGO_LIBERADO,
    titulo: '💰 ¡Pago recibido!',
    mensaje: `Has recibido $${trabajo.pago.montoNeto.toFixed(2)} por tu trabajo`,
    datos: {
      idTrabajo: trabajo._id,
      montoNeto: trabajo.pago.montoNeto,
      comision: trabajo.pago.comision
    },
    fecha: new Date()
  };

  emitirAUsuario(idTecnico.toString(), TIPOS_NOTIFICACION.PAGO_LIBERADO, notificacion);
  return notificacion;
};

/**
 * Notifica al cliente sobre puntos ganados
 * @param {String} idCliente - ID del cliente
 * @param {Number} puntos - Puntos ganados
 * @param {Number} totalPuntos - Total de puntos acumulados
 */
const notificarPuntosGanados = (idCliente, puntos, totalPuntos) => {
  const notificacion = {
    tipo: TIPOS_NOTIFICACION.PUNTOS_GANADOS,
    titulo: '🎁 ¡Puntos ganados!',
    mensaje: `Has ganado ${puntos} puntos. Total acumulado: ${totalPuntos} pts`,
    datos: {
      puntosGanados: puntos,
      totalPuntos,
      descuentoDisponible: Math.floor(totalPuntos / 100) * 10
    },
    fecha: new Date()
  };

  emitirAUsuario(idCliente.toString(), TIPOS_NOTIFICACION.PUNTOS_GANADOS, notificacion);
  return notificacion;
};

module.exports = {
  TIPOS_NOTIFICACION,
  notificarNuevaCotizacion,
  notificarCotizacionAceptada,
  notificarCotizacionEditada,
  notificarCotizacionCancelada,
  notificarCotizacionNoSeleccionada,
  notificarNuevoServicio,
  notificarServicioEditado,
  notificarServicioCancelado,
  notificarCambioEstado,
  notificarTecnicoInmediato,
  notificarTecnicoAceptoInmediato,
  notificarNuevaResena,
  notificarPagoProcesado,
  notificarPagoLiberado,
  notificarPuntosGanados,
  traducirTipoServicio,
  verificarUsuarioConectado
};
