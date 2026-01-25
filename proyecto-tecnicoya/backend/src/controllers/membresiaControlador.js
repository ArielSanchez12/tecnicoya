/**
 * Controlador de Membresías
 * TécnicoYa - Backend
 * Sistema de membresías para técnicos
 */

const Usuario = require('../models/Usuario');

// Planes de membresía disponibles
const PLANES_MEMBRESIA = {
  basico: {
    nombre: 'Básico',
    precio: 0,
    duracionDias: 0, // Gratis, sin vencimiento
    radioExtendido: 0, // Radio base 15 km
    radioBusqueda: 15, // Total: 15 km
    comision: 12, // 12% de comisión
    posicionDestacada: false,
    badgeVerificado: false,
    beneficios: [
      'Radio de búsqueda: 15 km',
      'Comisión: 12%',
      'Cotizaciones ilimitadas',
      'Perfil básico'
    ]
  },
  profesional: {
    nombre: 'Profesional',
    precio: 9.99,
    duracionDias: 30,
    radioExtendido: 10, // 15 base + 10 = 25 km total
    radioBusqueda: 25, // Total: 25 km
    comision: 8, // 8% de comisión
    posicionDestacada: true,
    badgeVerificado: false,
    beneficios: [
      'Radio de búsqueda: 25 km',
      'Comisión reducida: 8%',
      'Cotizaciones ilimitadas',
      'Posición destacada en búsquedas',
      'Estadísticas avanzadas',
      'Soporte prioritario'
    ]
  },
  premium: {
    nombre: 'Premium',
    precio: 19.99,
    duracionDias: 30,
    radioExtendido: 35, // 15 base + 35 = 50 km total
    radioBusqueda: 50, // Total: 50 km
    comision: 5, // 5% de comisión
    posicionDestacada: true,
    badgeVerificado: true,
    beneficios: [
      'Radio de búsqueda: 50 km',
      'Comisión mínima: 5%',
      'Cotizaciones ilimitadas',
      'Máxima prioridad en búsquedas',
      'Badge de técnico verificado',
      'Estadísticas avanzadas',
      'Soporte VIP 24/7',
      'Promoción en redes sociales'
    ]
  }
};

/**
 * Obtener planes de membresía disponibles
 * GET /api/membresias/planes
 */
const obtenerPlanes = async (req, res) => {
  try {
    res.json({
      exito: true,
      datos: PLANES_MEMBRESIA
    });
  } catch (error) {
    console.error('Error al obtener planes:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener planes de membresía'
    });
  }
};

/**
 * Obtener membresía actual del técnico
 * GET /api/membresias/mi-membresia
 */
const obtenerMiMembresia = async (req, res) => {
  try {
    if (req.usuario.rol !== 'tecnico') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los técnicos pueden tener membresías'
      });
    }

    const membresia = req.usuario.datosTecnico?.membresia || {
      tipo: 'basico',
      fechaInicio: null,
      fechaVencimiento: null,
      radioExtendido: 0,
      posicionDestacada: false,
      badgeVerificado: false
    };

    // Verificar si la membresía ha vencido
    const estaActiva = membresia.tipo === 'basico' ||
      (membresia.fechaVencimiento && new Date(membresia.fechaVencimiento) > new Date());

    // Si venció, degradar a básico
    if (!estaActiva && membresia.tipo !== 'basico') {
      await Usuario.findByIdAndUpdate(req.usuario._id, {
        'datosTecnico.membresia.tipo': 'basico',
        'datosTecnico.membresia.radioExtendido': 0,
        'datosTecnico.membresia.posicionDestacada': false,
        'datosTecnico.membresia.badgeVerificado': false,
        'datosTecnico.esPremium': false
      });

      membresia.tipo = 'basico';
      membresia.radioExtendido = 0;
      membresia.posicionDestacada = false;
      membresia.badgeVerificado = false;
    }

    const planInfo = PLANES_MEMBRESIA[membresia.tipo];

    res.json({
      exito: true,
      datos: {
        ...membresia,
        estaActiva,
        planInfo,
        diasRestantes: estaActiva && membresia.fechaVencimiento
          ? Math.ceil((new Date(membresia.fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24))
          : null
      }
    });
  } catch (error) {
    console.error('Error al obtener membresía:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener membresía'
    });
  }
};

/**
 * Suscribirse a un plan de membresía
 * POST /api/membresias/suscribir
 */
const suscribirPlan = async (req, res) => {
  try {
    if (req.usuario.rol !== 'tecnico') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los técnicos pueden suscribirse a membresías'
      });
    }

    const { tipoPlan, metodoPago, referenciaPago } = req.body;

    if (!tipoPlan || !PLANES_MEMBRESIA[tipoPlan]) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Plan de membresía inválido'
      });
    }

    const plan = PLANES_MEMBRESIA[tipoPlan];

    // El plan básico no requiere pago
    if (tipoPlan === 'basico') {
      return res.status(400).json({
        exito: false,
        mensaje: 'El plan básico es gratuito y está activo por defecto'
      });
    }

    // Aquí iría la integración con pasarela de pago
    // Por ahora, simulamos el pago exitoso
    if (!metodoPago) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Se requiere método de pago'
      });
    }

    const fechaInicio = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + plan.duracionDias);

    const actualizacion = {
      'datosTecnico.membresia.tipo': tipoPlan,
      'datosTecnico.membresia.fechaInicio': fechaInicio,
      'datosTecnico.membresia.fechaVencimiento': fechaVencimiento,
      'datosTecnico.membresia.radioExtendido': plan.radioExtendido,
      'datosTecnico.membresia.posicionDestacada': plan.posicionDestacada,
      'datosTecnico.membresia.badgeVerificado': plan.badgeVerificado,
      'datosTecnico.esPremium': tipoPlan === 'premium'
    };

    // Agregar al historial de pagos
    const nuevoPago = {
      monto: plan.precio,
      fecha: new Date(),
      tipoPlan,
      metodoPago,
      referencia: referenciaPago || `PAY-${Date.now()}`
    };

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      {
        $set: actualizacion,
        $push: { 'datosTecnico.membresia.historialPagos': nuevoPago }
      },
      { new: true }
    ).select('-contrasena');

    res.json({
      exito: true,
      mensaje: `¡Felicidades! Ahora eres miembro ${plan.nombre}`,
      datos: {
        membresia: usuarioActualizado.datosTecnico.membresia,
        planInfo: plan,
        fechaVencimiento
      }
    });
  } catch (error) {
    console.error('Error al suscribir plan:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al procesar la suscripción'
    });
  }
};

/**
 * Cancelar membresía (volver a básico)
 * POST /api/membresias/cancelar
 */
const cancelarMembresia = async (req, res) => {
  try {
    if (req.usuario.rol !== 'tecnico') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los técnicos pueden cancelar membresías'
      });
    }

    const membresiaActual = req.usuario.datosTecnico?.membresia?.tipo;

    if (membresiaActual === 'basico') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya tienes el plan básico'
      });
    }

    // Mantener la membresía hasta que venza, pero marcar como no renovar
    // Por simplicidad, degradamos inmediatamente
    await Usuario.findByIdAndUpdate(req.usuario._id, {
      'datosTecnico.membresia.tipo': 'basico',
      'datosTecnico.membresia.radioExtendido': 0,
      'datosTecnico.membresia.posicionDestacada': false,
      'datosTecnico.membresia.badgeVerificado': false,
      'datosTecnico.esPremium': false
    });

    res.json({
      exito: true,
      mensaje: 'Membresía cancelada. Ahora tienes el plan básico.'
    });
  } catch (error) {
    console.error('Error al cancelar membresía:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cancelar membresía'
    });
  }
};

/**
 * Obtener radio efectivo del técnico (base + membresía)
 */
const obtenerRadioEfectivo = (usuario) => {
  const radioBase = usuario.datosTecnico?.radioTrabajo || 10;
  const radioExtendido = usuario.datosTecnico?.membresia?.radioExtendido || 0;
  return radioBase + radioExtendido;
};

module.exports = {
  obtenerPlanes,
  obtenerMiMembresia,
  suscribirPlan,
  cancelarMembresia,
  obtenerRadioEfectivo,
  PLANES_MEMBRESIA
};
