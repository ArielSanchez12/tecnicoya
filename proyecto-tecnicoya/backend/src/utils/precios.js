/**
 * Utilidades de Precios y Comisiones
 * TécnicoYa - Backend
 * Cálculo de comisiones, garantías y programa de fidelización
 */

// Configuración de comisiones base (pueden venir de variables de entorno)
const COMISION_NORMAL = parseFloat(process.env.COMISION_NORMAL) || 12; // 12% para plan básico
const COMISION_EMERGENCIA = parseFloat(process.env.COMISION_EMERGENCIA) || 20; // 20%
const PORCENTAJE_GARANTIA = parseFloat(process.env.PORCENTAJE_GARANTIA) || 3; // 3%
const MULTIPLICADOR_EMERGENCIA = 2; // El precio se duplica en emergencias
const MULTIPLICADOR_INMEDIATO = 1.2; // 20% adicional para servicio inmediato

// Comisiones según membresía del técnico
const COMISIONES_MEMBRESIA = {
  basico: 12,      // 12% comisión para plan básico
  profesional: 8,  // 8% comisión para plan profesional
  premium: 5       // 5% comisión para plan premium
};

/**
 * Calcula el desglose completo de un precio
 * @param {Number} precioBase - Precio base del servicio
 * @param {Object} opciones - Opciones adicionales
 * @returns {Object} - Desglose completo del precio
 */
const calcularDesglosePrecio = (precioBase, opciones = {}) => {
  const {
    esEmergencia = false,
    esInmediato = false,
    conGarantia = false,
    descuentoPuntos = 0,
    membresiaTecnico = 'basico' // Plan de membresía del técnico
  } = opciones;

  let precioFinal = precioBase;

  // Aplicar multiplicadores
  if (esEmergencia) {
    precioFinal *= MULTIPLICADOR_EMERGENCIA;
  }

  if (esInmediato && !esEmergencia) {
    precioFinal *= MULTIPLICADOR_INMEDIATO;
  }

  // Calcular comisión según membresía del técnico
  // En emergencias siempre es 20%, de lo contrario según membresía
  const porcentajeComision = esEmergencia
    ? COMISION_EMERGENCIA
    : (COMISIONES_MEMBRESIA[membresiaTecnico] || COMISION_NORMAL);
  const comision = precioFinal * (porcentajeComision / 100);

  // Calcular tarifa de garantía
  const tarifaGarantia = conGarantia ? precioFinal * (PORCENTAJE_GARANTIA / 100) : 0;

  // Aplicar descuento de puntos
  const totalAntesDescuento = precioFinal + tarifaGarantia;
  const totalConDescuento = Math.max(0, totalAntesDescuento - descuentoPuntos);

  // Lo que recibe el técnico
  const montoNeto = precioFinal - comision;

  return {
    precioBase,
    precioConMultiplicadores: precioFinal,
    multiplicadores: {
      emergencia: esEmergencia ? MULTIPLICADOR_EMERGENCIA : 1,
      inmediato: esInmediato && !esEmergencia ? MULTIPLICADOR_INMEDIATO : 1
    },
    comision: {
      porcentaje: porcentajeComision,
      monto: Math.round(comision * 100) / 100
    },
    garantia: {
      aplicada: conGarantia,
      porcentaje: conGarantia ? PORCENTAJE_GARANTIA : 0,
      monto: Math.round(tarifaGarantia * 100) / 100
    },
    descuento: {
      puntos: descuentoPuntos,
      monto: Math.round(descuentoPuntos * 100) / 100
    },
    subtotal: Math.round(precioFinal * 100) / 100,
    total: Math.round(totalConDescuento * 100) / 100,
    montoNeto: Math.round(montoNeto * 100) / 100
  };
};

/**
 * Calcula el precio automático para servicio inmediato
 * @param {Number} tarifaHoraTecnico - Tarifa por hora del técnico
 * @param {Number} tiempoEstimadoHoras - Tiempo estimado en horas
 * @param {Boolean} esEmergencia - Si es emergencia
 * @returns {Object} - Precio calculado y desglose
 */
const calcularPrecioInmediato = (tarifaHoraTecnico, tiempoEstimadoHoras = 1, esEmergencia = false) => {
  // Mínimo 1 hora de trabajo
  const horasMinimas = Math.max(1, tiempoEstimadoHoras);
  let precioBase = tarifaHoraTecnico * horasMinimas;

  // Añadir cargo por servicio inmediato (20%)
  precioBase *= MULTIPLICADOR_INMEDIATO;

  return calcularDesglosePrecio(precioBase, { esEmergencia, esInmediato: true });
};

/**
 * Calcula puntos de lealtad ganados por una compra
 * @param {Number} montoGastado - Monto de la compra
 * @returns {Number} - Puntos ganados
 */
const calcularPuntosLealtad = (montoGastado) => {
  // 1 punto por cada $10 gastados
  return Math.floor(montoGastado / 10);
};

/**
 * Calcula el descuento por puntos de lealtad
 * @param {Number} puntosDisponibles - Puntos disponibles del usuario
 * @param {Number} puntosACanjear - Puntos que quiere canjear
 * @returns {Object} - Descuento y puntos restantes
 */
const calcularDescuentoPorPuntos = (puntosDisponibles, puntosACanjear) => {
  // Cada 100 puntos = $10 de descuento
  const puntosUsados = Math.min(puntosDisponibles, puntosACanjear);
  const bloquesCompletos = Math.floor(puntosUsados / 100);
  const descuento = bloquesCompletos * 10;
  const puntosConsumidos = bloquesCompletos * 100;

  return {
    descuento,
    puntosConsumidos,
    puntosRestantes: puntosDisponibles - puntosConsumidos
  };
};

/**
 * Calcula la distribución del pago en caso de disputa
 * @param {Number} montoTotal - Monto total del trabajo
 * @param {String} tipoResolucion - 'favor_cliente' | 'favor_tecnico' | 'dividir'
 * @returns {Object} - Distribución del pago
 */
const calcularResolucionDisputa = (montoTotal, tipoResolucion = 'dividir') => {
  switch (tipoResolucion) {
    case 'favor_cliente':
      return {
        reembolsoCliente: montoTotal,
        pagoTecnico: 0,
        descripcion: 'Reembolso total al cliente'
      };

    case 'favor_tecnico':
      return {
        reembolsoCliente: 0,
        pagoTecnico: montoTotal,
        descripcion: 'Pago total al técnico'
      };

    case 'dividir':
    default:
      const mitad = montoTotal / 2;
      return {
        reembolsoCliente: Math.round(mitad * 100) / 100,
        pagoTecnico: Math.round(mitad * 100) / 100,
        descripcion: 'Pago dividido 50/50'
      };
  }
};

/**
 * Valida si un precio está dentro de rangos aceptables
 * @param {Number} precio - Precio a validar
 * @param {String} tipoServicio - Tipo de servicio
 * @returns {Object} - Resultado de validación
 */
const validarPrecio = (precio, tipoServicio) => {
  // Rangos de precios por tipo de servicio (ejemplo)
  const rangos = {
    'plomeria': { min: 50, max: 5000 },
    'electricidad': { min: 50, max: 5000 },
    'cerrajeria': { min: 30, max: 1000 },
    'carpinteria': { min: 100, max: 10000 },
    'pintura': { min: 100, max: 10000 },
    'aire_acondicionado': { min: 100, max: 5000 },
    'refrigeracion': { min: 100, max: 3000 },
    'albanileria': { min: 200, max: 50000 },
    'herreria': { min: 100, max: 10000 },
    'jardineria': { min: 50, max: 5000 },
    'limpieza': { min: 30, max: 2000 },
    'mudanzas': { min: 100, max: 10000 },
    'electrodomesticos': { min: 50, max: 3000 },
    'computadoras': { min: 30, max: 2000 },
    'otro': { min: 30, max: 50000 }
  };

  const rango = rangos[tipoServicio] || rangos['otro'];

  return {
    esValido: precio >= rango.min && precio <= rango.max,
    rango,
    mensaje: precio < rango.min
      ? `El precio mínimo para ${tipoServicio} es $${rango.min}`
      : precio > rango.max
        ? `El precio máximo para ${tipoServicio} es $${rango.max}`
        : 'Precio válido'
  };
};

/**
 * Formatea un precio para mostrar al usuario
 * @param {Number} precio - Precio a formatear
 * @param {String} moneda - Código de moneda (default: MXN)
 * @returns {String} - Precio formateado
 */
const formatearPrecio = (precio, moneda = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 2
  }).format(precio);
};

/**
 * Calcula estadísticas de ingresos para un técnico
 * @param {Array} trabajos - Array de trabajos completados
 * @returns {Object} - Estadísticas de ingresos
 */
const calcularEstadisticasIngresos = (trabajos) => {
  const trabajosCompletados = trabajos.filter(t => t.estado === 'completado');

  const ingresosTotales = trabajosCompletados.reduce((sum, t) => sum + (t.pago?.montoNeto || 0), 0);
  const comisionesTotales = trabajosCompletados.reduce((sum, t) => sum + (t.pago?.comision || 0), 0);

  // Agrupar por mes
  const ingresosPorMes = {};
  trabajosCompletados.forEach(t => {
    const fecha = new Date(t.fechaFinalizacion || t.fechaCreacion);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + (t.pago?.montoNeto || 0);
  });

  return {
    totalTrabajos: trabajosCompletados.length,
    ingresosTotales: Math.round(ingresosTotales * 100) / 100,
    comisionesTotales: Math.round(comisionesTotales * 100) / 100,
    promedioIngreso: trabajosCompletados.length > 0
      ? Math.round((ingresosTotales / trabajosCompletados.length) * 100) / 100
      : 0,
    ingresosPorMes
  };
};

module.exports = {
  COMISION_NORMAL,
  COMISION_EMERGENCIA,
  PORCENTAJE_GARANTIA,
  MULTIPLICADOR_EMERGENCIA,
  MULTIPLICADOR_INMEDIATO,
  calcularDesglosePrecio,
  calcularPrecioInmediato,
  calcularPuntosLealtad,
  calcularDescuentoPorPuntos,
  calcularResolucionDisputa,
  validarPrecio,
  formatearPrecio,
  calcularEstadisticasIngresos
};
