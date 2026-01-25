/**
 * Rutas de Trabajos
 * TécnicoYa - Backend
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  obtenerTrabajoPorId,
  obtenerMisTrabajos,
  actualizarEstado,
  subirFotosAntes,
  subirFotosDespues,
  aprobarTrabajo,
  abrirDisputa,
  cancelarTrabajo,
  actualizarUbicacionTecnico
} = require('../controllers/trabajoControlador');

const { verificarToken, soloCliente, soloTecnico } = require('../middleware/autenticacion');
const { subirImagenesACloudinary, CARPETAS } = require('../middleware/subidaArchivos');

// ===== VALIDACIONES =====

const validacionIdTrabajo = [
  param('id')
    .isMongoId()
    .withMessage('ID de trabajo inválido')
];

const validacionEstado = [
  body('estado')
    .notEmpty()
    .withMessage('El estado es obligatorio')
    .isIn(['programado', 'en_camino', 'en_progreso', 'completado', 'cancelado'])
    .withMessage('Estado inválido')
];

const validacionCompletarTrabajo = [
  body('descripcionFinal')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres')
];

const validacionConfirmarPago = [
  body('metodoPago')
    .notEmpty()
    .withMessage('El método de pago es obligatorio')
    .isIn(['efectivo', 'transferencia', 'tarjeta', 'otro'])
    .withMessage('Método de pago inválido'),
  body('referenciaPago')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La referencia no puede exceder 100 caracteres')
];

const validacionDisputa = [
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo de la disputa es obligatorio')
    .isLength({ max: 500 })
    .withMessage('El motivo no puede exceder 500 caracteres'),
  body('tipo')
    .notEmpty()
    .withMessage('El tipo de disputa es obligatorio')
    .isIn(['calidad', 'tiempo', 'precio', 'comportamiento', 'otro'])
    .withMessage('Tipo de disputa inválido')
];

const validacionResolverDisputa = [
  body('resolucion')
    .trim()
    .notEmpty()
    .withMessage('La resolución es obligatoria')
    .isLength({ max: 1000 })
    .withMessage('La resolución no puede exceder 1000 caracteres'),
  body('accion')
    .notEmpty()
    .withMessage('La acción es obligatoria')
    .isIn(['reembolso_total', 'reembolso_parcial', 'repetir_trabajo', 'sin_accion'])
    .withMessage('Acción inválida'),
  body('montoReembolso')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto de reembolso debe ser positivo')
];

const validacionGarantia = [
  body('descripcionProblema')
    .trim()
    .notEmpty()
    .withMessage('La descripción del problema es obligatoria')
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
];

// ===== RUTAS GENERALES =====

/**
 * @route   GET /api/trabajos
 * @desc    Obtener mis trabajos (cliente o técnico)
 * @access  Privado
 */
router.get('/', verificarToken, obtenerMisTrabajos);

/**
 * @route   GET /api/trabajos/:id
 * @desc    Obtener detalle de un trabajo
 * @access  Privado - Participantes del trabajo
 */
router.get(
  '/:id',
  verificarToken,
  validacionIdTrabajo,
  obtenerTrabajoPorId
);

// ===== RUTAS DE TÉCNICO =====

/**
 * @route   PUT /api/trabajos/:id/en-camino
 * @desc    Técnico confirma que va en camino
 * @access  Privado - Solo técnico asignado
 */
router.put(
  '/:id/en-camino',
  verificarToken,
  soloTecnico,
  validacionIdTrabajo,
  actualizarEstado
);

/**
 * @route   PUT /api/trabajos/:id/iniciar
 * @desc    Técnico inicia el trabajo
 * @access  Privado - Solo técnico asignado
 */
router.put(
  '/:id/iniciar',
  verificarToken,
  soloTecnico,
  validacionIdTrabajo,
  actualizarEstado
);

/**
 * @route   PUT /api/trabajos/:id/completar
 * @desc    Técnico marca el trabajo como completado
 * @access  Privado - Solo técnico asignado
 */
router.put(
  '/:id/completar',
  verificarToken,
  soloTecnico,
  validacionIdTrabajo,
  validacionCompletarTrabajo,
  actualizarEstado
);

/**
 * @route   POST /api/trabajos/:id/fotos-antes
 * @desc    Agregar fotos antes del trabajo
 * @access  Privado - Solo técnico asignado
 */
router.post(
  '/:id/fotos-antes',
  verificarToken,
  soloTecnico,
  validacionIdTrabajo,
  ...subirImagenesACloudinary('fotos', 10, CARPETAS.TRABAJOS),
  subirFotosAntes
);

/**
 * @route   POST /api/trabajos/:id/fotos-despues
 * @desc    Agregar fotos después del trabajo
 * @access  Privado - Solo técnico asignado
 */
router.post(
  '/:id/fotos-despues',
  verificarToken,
  soloTecnico,
  validacionIdTrabajo,
  ...subirImagenesACloudinary('fotos', 10, CARPETAS.TRABAJOS),
  subirFotosDespues
);

/**
 * @route   PUT /api/trabajos/:id/estado
 * @desc    Actualizar estado del trabajo (genérico)
 * @access  Privado - Solo técnico asignado
 */
router.put(
  '/:id/estado',
  verificarToken,
  soloTecnico,
  validacionIdTrabajo,
  validacionEstado,
  actualizarEstado
);

/**
 * @route   PUT /api/trabajos/:id/ubicacion
 * @desc    Actualizar ubicación del técnico en tiempo real
 * @access  Privado - Solo técnico asignado
 */
router.put(
  '/:id/ubicacion',
  verificarToken,
  soloTecnico,
  validacionIdTrabajo,
  actualizarUbicacionTecnico
);

// ===== RUTAS DE CLIENTE =====

/**
 * @route   PUT /api/trabajos/:id/aprobar
 * @desc    Cliente aprueba el trabajo completado
 * @access  Privado - Solo cliente propietario
 */
router.put(
  '/:id/aprobar',
  verificarToken,
  soloCliente,
  validacionIdTrabajo,
  aprobarTrabajo
);

/**
 * @route   PUT /api/trabajos/:id/cancelar
 * @desc    Cancelar trabajo
 * @access  Privado - Cliente o técnico del trabajo
 */
router.put(
  '/:id/cancelar',
  verificarToken,
  validacionIdTrabajo,
  cancelarTrabajo
);

// ===== RUTAS DE DISPUTAS =====

/**
 * @route   POST /api/trabajos/:id/disputa
 * @desc    Crear disputa sobre un trabajo
 * @access  Privado - Participantes del trabajo
 */
router.post(
  '/:id/disputa',
  verificarToken,
  validacionIdTrabajo,
  validacionDisputa,
  abrirDisputa
);

module.exports = router;
