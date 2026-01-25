/**
 * Rutas de Fidelización
 * TécnicoYa - Backend
 * Sistema de Puntos de Lealtad
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const {
  obtenerPuntos,
  obtenerHistorial,
  obtenerInfoPrograma,
  canjearPuntos,
  calcularPuntosPotenciales,
  obtenerMiFidelizacion
} = require('../controllers/fidelizacionControlador');

const { verificarToken } = require('../middleware/autenticacion');

// ===== VALIDACIONES =====

const validacionCanjeo = [
  body('tipo')
    .notEmpty()
    .withMessage('El tipo de canjeo es obligatorio')
    .isIn(['descuento', 'servicio_gratis', 'prioridad', 'beneficio_especial'])
    .withMessage('Tipo de canjeo inválido'),
  body('puntos')
    .isInt({ min: 1 })
    .withMessage('Los puntos deben ser mayor a 0'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede exceder 200 caracteres')
];

const validacionHistorial = [
  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número positivo'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  query('tipo')
    .optional()
    .isIn(['ganados', 'canjeados', 'todos'])
    .withMessage('Tipo de filtro inválido')
];

// ===== RUTAS DE CONSULTA =====

/**
 * @route   GET /api/fidelizacion/puntos
 * @desc    Obtener mis puntos actuales y nivel
 * @access  Privado
 */
router.get('/puntos', verificarToken, obtenerPuntos);

/**
 * @route   GET /api/fidelizacion/mi-fidelizacion
 * @desc    Obtener toda la información de fidelización del usuario
 * @access  Privado
 */
router.get('/mi-fidelizacion', verificarToken, obtenerMiFidelizacion);

/**
 * @route   GET /api/fidelizacion/programa
 * @desc    Obtener información del programa de fidelización
 * @access  Privado
 */
router.get('/programa', verificarToken, obtenerInfoPrograma);

/**
 * @route   GET /api/fidelizacion/historial
 * @desc    Obtener historial de puntos (ganados y canjeados)
 * @access  Privado
 */
router.get(
  '/historial',
  verificarToken,
  validacionHistorial,
  obtenerHistorial
);

/**
 * @route   GET /api/fidelizacion/calcular
 * @desc    Calcular puntos potenciales para un monto
 * @access  Privado
 */
router.get('/calcular', verificarToken, calcularPuntosPotenciales);

// ===== RUTAS DE CANJEO =====

/**
 * @route   POST /api/fidelizacion/canjear
 * @desc    Canjear puntos por beneficios
 * @access  Privado
 */
router.post(
  '/canjear',
  verificarToken,
  validacionCanjeo,
  canjearPuntos
);

module.exports = router;
