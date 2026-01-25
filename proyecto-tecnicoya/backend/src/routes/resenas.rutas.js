/**
 * Rutas de Reseñas
 * TécnicoYa - Backend
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  crearResena,
  obtenerResenasTecnico,
  obtenerEstadisticas,
  responderResena,
  reportarResena,
  obtenerMisResenas
} = require('../controllers/resenaControlador');

const { verificarToken, soloCliente, soloTecnico } = require('../middleware/autenticacion');
const { subirImagenesACloudinary, CARPETAS } = require('../middleware/subidaArchivos');

// ===== VALIDACIONES =====

const validacionesCrearResena = [
  body('trabajo')
    .notEmpty()
    .withMessage('El ID del trabajo es obligatorio')
    .isMongoId()
    .withMessage('ID de trabajo inválido'),
  body('calificacion')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe estar entre 1 y 5'),
  body('comentario')
    .trim()
    .notEmpty()
    .withMessage('El comentario es obligatorio')
    .isLength({ min: 10, max: 1000 })
    .withMessage('El comentario debe tener entre 10 y 1000 caracteres'),
  body('aspectos.puntualidad')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación de puntualidad debe estar entre 1 y 5'),
  body('aspectos.calidad')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación de calidad debe estar entre 1 y 5'),
  body('aspectos.comunicacion')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación de comunicación debe estar entre 1 y 5'),
  body('aspectos.limpieza')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación de limpieza debe estar entre 1 y 5'),
  body('aspectos.profesionalismo')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación de profesionalismo debe estar entre 1 y 5'),
  body('recomendaria')
    .optional()
    .isBoolean()
    .withMessage('El campo recomendaria debe ser booleano')
];

const validacionIdTecnico = [
  param('tecnicoId')
    .isMongoId()
    .withMessage('ID de técnico inválido')
];

const validacionIdResena = [
  param('id')
    .isMongoId()
    .withMessage('ID de reseña inválido')
];

const validacionRespuesta = [
  body('respuesta')
    .trim()
    .notEmpty()
    .withMessage('La respuesta es obligatoria')
    .isLength({ max: 500 })
    .withMessage('La respuesta no puede exceder 500 caracteres')
];

const validacionReporte = [
  body('motivo')
    .trim()
    .notEmpty()
    .withMessage('El motivo del reporte es obligatorio')
    .isIn(['spam', 'ofensivo', 'falso', 'otro'])
    .withMessage('Motivo de reporte inválido'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripción no puede exceder 500 caracteres')
];

// ===== RUTAS PÚBLICAS =====

/**
 * @route   GET /api/resenas/tecnico/:tecnicoId
 * @desc    Obtener reseñas de un técnico
 * @access  Público
 */
router.get(
  '/tecnico/:tecnicoId',
  validacionIdTecnico,
  [
    query('pagina')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número positivo'),
    query('limite')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('El límite debe estar entre 1 y 50'),
    query('ordenar')
      .optional()
      .isIn(['reciente', 'calificacion_alta', 'calificacion_baja'])
      .withMessage('Ordenamiento inválido')
  ],
  obtenerResenasTecnico
);

/**
 * @route   GET /api/resenas/tecnico/:tecnicoId/estadisticas
 * @desc    Obtener estadísticas de reseñas de un técnico
 * @access  Público
 */
router.get(
  '/tecnico/:tecnicoId/estadisticas',
  validacionIdTecnico,
  obtenerEstadisticas
);

// ===== RUTAS DE USUARIOS AUTENTICADOS =====

/**
 * @route   POST /api/resenas
 * @desc    Crear nueva reseña para un trabajo completado
 * @access  Privado - Clientes y Técnicos (cada uno puede reseñar al otro)
 */
router.post(
  '/',
  verificarToken,
  // Removido soloCliente - tanto clientes como técnicos pueden crear reseñas
  ...subirImagenesACloudinary('fotos', 5, CARPETAS.RESENAS),
  validacionesCrearResena,
  crearResena
);

/**
 * @route   GET /api/resenas/mis-resenas
 * @desc    Obtener reseñas escritas por el usuario (cliente o técnico)
 * @access  Privado
 */
router.get(
  '/mis-resenas',
  verificarToken,
  obtenerMisResenas
);

// ===== RUTAS DE TÉCNICO =====

/**
 * @route   PUT /api/resenas/:id/responder
 * @desc    Técnico responde a una reseña
 * @access  Privado - Solo el técnico de la reseña
 */
router.put(
  '/:id/responder',
  verificarToken,
  soloTecnico,
  validacionIdResena,
  validacionRespuesta,
  responderResena
);

// ===== RUTAS COMPARTIDAS =====

/**
 * @route   POST /api/resenas/:id/reportar
 * @desc    Reportar una reseña inapropiada
 * @access  Privado
 */
router.post(
  '/:id/reportar',
  verificarToken,
  validacionIdResena,
  validacionReporte,
  reportarResena
);

module.exports = router;
