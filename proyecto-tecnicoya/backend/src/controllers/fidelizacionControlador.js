/**
 * Controlador de Fidelización
 * TécnicoYa - Backend
 * Programa de puntos y recompensas
 */

const Usuario = require('../models/Usuario');
const { calcularDescuentoPorPuntos } = require('../utils/precios');

/**
 * Calcular nivel del usuario según puntos
 */
const calcularNivel = (puntos) => {
  if (puntos >= 3000) return { nivel: 'platino', nombre: 'Platino 💎', beneficio: 15, prioridad: true, minPuntos: 3000, siguienteNivel: null };
  if (puntos >= 1500) return { nivel: 'oro', nombre: 'Oro 🥇', beneficio: 10, prioridad: false, minPuntos: 1500, siguienteNivel: 3000 };
  if (puntos >= 500) return { nivel: 'plata', nombre: 'Plata 🥈', beneficio: 5, prioridad: false, minPuntos: 500, siguienteNivel: 1500 };
  return { nivel: 'bronce', nombre: 'Bronce 🥉', beneficio: 0, prioridad: false, minPuntos: 0, siguienteNivel: 500 };
};

/**
 * Obtener puntos actuales del usuario
 * GET /api/fidelizacion/puntos
 */
const obtenerPuntos = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id)
      .select('puntosLealtad historialPuntos');

    // Calcular nivel
    const infoNivel = calcularNivel(usuario.puntosLealtad);

    // Calcular valor de puntos en dinero
    const valorPuntos = Math.floor(usuario.puntosLealtad / 100) * 10;

    // Calcular puntos para próxima recompensa (múltiplo de 100)
    const puntosParaRecompensa = 100 - (usuario.puntosLealtad % 100);

    // Puntos para siguiente nivel
    const puntosParaSiguienteNivel = infoNivel.siguienteNivel
      ? infoNivel.siguienteNivel - usuario.puntosLealtad
      : 0;

    // Obtener últimos movimientos
    const ultimosMovimientos = usuario.historialPuntos
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10);

    // Calcular estadísticas
    const estadisticas = {
      totalGanado: usuario.historialPuntos
        .filter(h => h.tipo === 'ganado')
        .reduce((sum, h) => sum + h.cantidad, 0),
      totalCanjeado: usuario.historialPuntos
        .filter(h => h.tipo === 'canjeado')
        .reduce((sum, h) => sum + h.cantidad, 0)
    };

    res.json({
      exito: true,
      datos: {
        puntosActuales: usuario.puntosLealtad,
        nivel: infoNivel.nivel,
        nombreNivel: infoNivel.nombre,
        beneficioPorcentaje: infoNivel.beneficio,
        tienePrioridad: infoNivel.prioridad,
        valorEnDinero: valorPuntos,
        puntosParaProximaRecompensa: puntosParaRecompensa,
        puntosParaSiguienteNivel,
        ultimosMovimientos,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener puntos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener puntos',
      error: error.message
    });
  }
};

/**
 * Canjear puntos por descuento
 * POST /api/fidelizacion/canjear
 */
const canjearPuntos = async (req, res) => {
  try {
    const { puntos } = req.body;

    if (!puntos || puntos < 100) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes canjear al menos 100 puntos'
      });
    }

    const usuario = await Usuario.findById(req.usuario._id);

    if (usuario.puntosLealtad < puntos) {
      return res.status(400).json({
        exito: false,
        mensaje: `No tienes suficientes puntos. Tienes ${usuario.puntosLealtad} puntos.`
      });
    }

    // Calcular descuento
    const resultado = calcularDescuentoPorPuntos(usuario.puntosLealtad, puntos);

    // Actualizar puntos del usuario
    usuario.puntosLealtad = resultado.puntosRestantes;
    usuario.historialPuntos.push({
      tipo: 'canjeado',
      cantidad: resultado.puntosConsumidos,
      descripcion: `Canje por $${resultado.descuento} de descuento`,
      fecha: new Date()
    });

    await usuario.save();

    res.json({
      exito: true,
      mensaje: `¡Has canjeado ${resultado.puntosConsumidos} puntos por $${resultado.descuento} de descuento!`,
      datos: {
        puntosCanjeados: resultado.puntosConsumidos,
        descuentoObtenido: resultado.descuento,
        puntosRestantes: resultado.puntosRestantes
      }
    });

  } catch (error) {
    console.error('Error al canjear puntos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al canjear puntos',
      error: error.message
    });
  }
};

/**
 * Obtener historial de puntos
 * GET /api/fidelizacion/historial
 */
const obtenerHistorial = async (req, res) => {
  try {
    const { tipo, pagina = 1, limite = 20 } = req.query;

    const usuario = await Usuario.findById(req.usuario._id)
      .select('historialPuntos');

    let historial = usuario.historialPuntos;

    // Filtrar por tipo si se especifica
    if (tipo === 'ganado' || tipo === 'canjeado') {
      historial = historial.filter(h => h.tipo === tipo);
    }

    // Ordenar por fecha descendente
    historial.sort((a, b) => b.fecha - a.fecha);

    // Paginar
    const inicio = (parseInt(pagina) - 1) * parseInt(limite);
    const historialPaginado = historial.slice(inicio, inicio + parseInt(limite));

    // Agrupar por mes para estadísticas
    const porMes = {};
    historial.forEach(h => {
      const mes = new Date(h.fecha).toISOString().slice(0, 7);
      if (!porMes[mes]) {
        porMes[mes] = { ganado: 0, canjeado: 0 };
      }
      porMes[mes][h.tipo] += h.cantidad;
    });

    res.json({
      exito: true,
      datos: {
        historial: historialPaginado,
        paginacion: {
          total: historial.length,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(historial.length / parseInt(limite))
        },
        resumenPorMes: porMes
      }
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener historial',
      error: error.message
    });
  }
};

/**
 * Calcular puntos potenciales por un monto
 * GET /api/fidelizacion/calcular
 */
const calcularPuntosPotenciales = async (req, res) => {
  try {
    const { monto } = req.query;

    if (!monto || isNaN(parseFloat(monto))) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes proporcionar un monto válido'
      });
    }

    const montoNumerico = parseFloat(monto);
    const puntosGanados = Math.floor(montoNumerico / 10);

    // Obtener puntos actuales del usuario
    const usuario = await Usuario.findById(req.usuario._id).select('puntosLealtad');
    const puntosTotales = usuario.puntosLealtad + puntosGanados;
    const descuentoDisponible = Math.floor(puntosTotales / 100) * 10;

    res.json({
      exito: true,
      datos: {
        monto: montoNumerico,
        puntosActuales: usuario.puntosLealtad,
        puntosAGanar: puntosGanados,
        puntosTotales,
        descuentoDisponibleDespues: descuentoDisponible
      }
    });

  } catch (error) {
    console.error('Error al calcular puntos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al calcular puntos',
      error: error.message
    });
  }
};

/**
 * Obtener información del programa de fidelización
 * GET /api/fidelizacion/info
 */
const obtenerInfoPrograma = async (req, res) => {
  try {
    res.json({
      exito: true,
      datos: {
        nombre: 'TécnicoYa Rewards',
        reglas: {
          ganancia: {
            descripcion: 'Gana 1 punto por cada $10 gastados',
            ratio: '1 punto = $10 gastados'
          },
          canje: {
            descripcion: 'Canjea 100 puntos por $10 de descuento',
            minimoParaCanjear: 100,
            valorPor100Puntos: 10
          }
        },
        beneficios: [
          'Acumula puntos con cada servicio',
          'Canjea por descuentos en futuros servicios',
          'Sin fecha de vencimiento de puntos',
          'Programa exclusivo para clientes TécnicoYa'
        ],
        niveles: [
          { nombre: 'Bronce', minPuntos: 0, beneficio: 'Acumula puntos básicos' },
          { nombre: 'Plata', minPuntos: 500, beneficio: '+5% puntos extra' },
          { nombre: 'Oro', minPuntos: 1000, beneficio: '+10% puntos extra' },
          { nombre: 'Platino', minPuntos: 2500, beneficio: '+15% puntos extra y soporte prioritario' }
        ]
      }
    });

  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener información del programa',
      error: error.message
    });
  }
};

/**
 * Obtener toda la información de fidelización del usuario
 * GET /api/fidelizacion/mi-fidelizacion
 */
const obtenerMiFidelizacion = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id)
      .select('puntosLealtad historialPuntos');

    const puntos = usuario.puntosLealtad || 0;
    const infoNivel = calcularNivel(puntos);

    // Calcular valor de puntos en dinero
    const valorPuntos = Math.floor(puntos / 100) * 10;

    // Calcular puntos para próxima recompensa (múltiplo de 100)
    const puntosParaRecompensa = 100 - (puntos % 100);

    // Puntos para siguiente nivel
    const puntosParaSiguienteNivel = infoNivel.siguienteNivel
      ? infoNivel.siguienteNivel - puntos
      : 0;

    // Obtener últimos movimientos del historial
    const historialPuntos = (usuario.historialPuntos || [])
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10);

    // Calcular estadísticas
    const estadisticas = {
      totalGanado: (usuario.historialPuntos || [])
        .filter(h => h.tipo === 'ganado')
        .reduce((sum, h) => sum + h.cantidad, 0),
      totalCanjeado: (usuario.historialPuntos || [])
        .filter(h => h.tipo === 'canjeado')
        .reduce((sum, h) => sum + h.cantidad, 0)
    };

    res.json({
      exito: true,
      datos: {
        puntos,
        nivel: infoNivel.nivel,
        nombreNivel: infoNivel.nombre,
        beneficioPorcentaje: infoNivel.beneficio,
        tienePrioridad: infoNivel.prioridad,
        valorEnDinero: valorPuntos,
        puntosParaProximaRecompensa: puntosParaRecompensa,
        puntosParaSiguienteNivel,
        historialPuntos,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener fidelización:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener información de fidelización',
      error: error.message
    });
  }
};

module.exports = {
  obtenerPuntos,
  canjearPuntos,
  obtenerHistorial,
  calcularPuntosPotenciales,
  obtenerInfoPrograma,
  obtenerMiFidelizacion
};
