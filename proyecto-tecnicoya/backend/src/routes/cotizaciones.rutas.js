/**
 * Rutas de Cotizaciones
 * TécnicoYa - Backend
 */

const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const {
  crearCotizacion,
  obtenerCotizacionesPorServicio,
  obtenerMisCotizaciones,
  aceptarCotizacion,
  rechazarCotizacion,
  cancelarCotizacion,
  editarCotizacion,
  obtenerMiCotizacionPorServicio
} = require('../controllers/cotizacionControlador');

const { verificarToken, soloCliente, soloTecnico, tecnicoVerificado } = require('../middleware/autenticacion');

// ===== VALIDACIONES =====

const validacionesCrearCotizacion = [
  body('servicio')
    .notEmpty()
    .withMessage('El ID del servicio es obligatorio')
    .isMongoId()
    .withMessage('ID de servicio inválido'),
  body('montoTotal')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto debe ser un número positivo'),
  body('precio')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('descripcion')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria')
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('tiempoEstimado')
    .notEmpty()
    .withMessage('El tiempo estimado es obligatorio'),
  body('materiales')
    .optional()
    .isArray()
    .withMessage('Los materiales deben ser un array'),
  body('materiales.*.nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre del material es obligatorio'),
  body('materiales.*.cantidad')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser mayor a 0'),
  body('materiales.*.precioUnitario')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser positivo'),
  body('garantia')
    .optional()
    .isString()
    .withMessage('La garantía debe ser texto')
    .isLength({ max: 500 })
    .withMessage('La garantía no puede exceder 500 caracteres'),
  body('notasAdicionales')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las notas no pueden exceder 500 caracteres')
];

const validacionIdServicio = [
  param('servicioId')
    .isMongoId()
    .withMessage('ID de servicio inválido')
];

const validacionIdCotizacion = [
  param('id')
    .isMongoId()
    .withMessage('ID de cotización inválido')
];

// ===== RUTAS DE TÉCNICO =====

/**
 * @route   POST /api/cotizaciones
 * @desc    Crear nueva cotización para un servicio
 * @access  Privado - Solo técnicos
 */
router.post(
  '/',
  verificarToken,
  soloTecnico,
  validacionesCrearCotizacion,
  crearCotizacion
);

/**
 * @route   GET /api/cotizaciones/mis-cotizaciones
 * @desc    Obtener cotizaciones enviadas por el técnico
 * @access  Privado - Solo técnicos
 */
router.get(
  '/mis-cotizaciones',
  verificarToken,
  soloTecnico,
  obtenerMisCotizaciones
);

/**
 * @route   PUT /api/cotizaciones/:id/cancelar
 * @desc    Cancelar cotización (técnico)
 * @access  Privado - Solo el técnico propietario
 */
router.put(
  '/:id/cancelar',
  verificarToken,
  soloTecnico,
  validacionIdCotizacion,
  cancelarCotizacion
);

/**
 * @route   PUT /api/cotizaciones/:id
 * @desc    Editar cotización existente (técnico)
 * @access  Privado - Solo el técnico propietario
 */
router.put(
  '/:id',
  verificarToken,
  soloTecnico,
  validacionIdCotizacion,
  editarCotizacion
);

/**
 * @route   GET /api/cotizaciones/mi-cotizacion/:servicioId
 * @desc    Obtener mi cotización para un servicio específico (técnico)
 * @access  Privado - Solo técnicos
 */
router.get(
  '/mi-cotizacion/:servicioId',
  verificarToken,
  soloTecnico,
  validacionIdServicio,
  obtenerMiCotizacionPorServicio
);

// ===== RUTAS DE CLIENTE =====

/**
 * @route   GET /api/cotizaciones/servicio/:servicioId
 * @desc    Obtener cotizaciones de un servicio
 * @access  Privado - Solo el cliente propietario del servicio
 */
router.get(
  '/servicio/:servicioId',
  verificarToken,
  validacionIdServicio,
  obtenerCotizacionesPorServicio
);

/**
 * @route   PUT /api/cotizaciones/:id/aceptar
 * @desc    Aceptar cotización
 * @access  Privado - Solo el cliente propietario del servicio
 */
router.put(
  '/:id/aceptar',
  verificarToken,
  soloCliente,
  validacionIdCotizacion,
  aceptarCotizacion
);

/**
 * @route   PUT /api/cotizaciones/:id/rechazar
 * @desc    Rechazar cotización
 * @access  Privado - Solo el cliente propietario del servicio
 */
router.put(
  '/:id/rechazar',
  verificarToken,
  soloCliente,
  validacionIdCotizacion,
  rechazarCotizacion
);

module.exports = router;
