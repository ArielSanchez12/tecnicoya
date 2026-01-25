/**
 * Rutas de Servicios
 * TécnicoYa - Backend
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  crearServicio,
  solicitarTecnicoInmediato,
  aceptarServicioInmediato,
  obtenerMisServicios,
  obtenerServiciosDisponibles,
  obtenerServicioPorId,
  editarServicio,
  cancelarServicio,
  buscarTecnicoInstantaneo
} = require('../controllers/servicioControlador');

const { verificarToken, soloCliente, soloTecnico } = require('../middleware/autenticacion');
const { subirImagenesACloudinary, CARPETAS } = require('../middleware/subidaArchivos');

// ===== VALIDACIONES =====

const validacionesCrearServicio = [
  body('tipo')
    .notEmpty()
    .withMessage('El tipo de servicio es obligatorio')
    .isIn([
      'plomeria', 'electricidad', 'cerrajeria', 'carpinteria',
      'pintura', 'aire_acondicionado', 'refrigeracion', 'albanileria',
      'herreria', 'jardineria', 'limpieza', 'mudanzas',
      'electrodomesticos', 'computadoras', 'otro'
    ])
    .withMessage('Tipo de servicio inválido'),
  body('titulo')
    .trim()
    .notEmpty()
    .withMessage('El título es obligatorio')
    .isLength({ max: 100 })
    .withMessage('El título no puede exceder 100 caracteres'),
  body('descripcion')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria')
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('ubicacion.direccion')
    .trim()
    .notEmpty()
    .withMessage('La dirección es obligatoria'),
  body('ubicacion.latitud')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  body('ubicacion.longitud')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida'),
  body('urgencia')
    .optional()
    .isIn(['normal', 'emergencia'])
    .withMessage('Urgencia debe ser "normal" o "emergencia"')
];

const validacionesServicioInmediato = [
  body('tipo')
    .notEmpty()
    .withMessage('El tipo de servicio es obligatorio'),
  body('descripcion')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria'),
  body('ubicacion.direccion')
    .trim()
    .notEmpty()
    .withMessage('La dirección es obligatoria'),
  body('ubicacion.latitud')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  body('ubicacion.longitud')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida')
];

const validacionesEditarServicio = [
  body('titulo')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('El título no puede exceder 100 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  body('ubicacion.latitud')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  body('ubicacion.longitud')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida'),
  body('urgencia')
    .optional()
    .isIn(['normal', 'emergencia'])
    .withMessage('Urgencia debe ser "normal" o "emergencia"')
];

// ===== RUTAS DE CLIENTE =====

/**
 * @route   POST /api/servicios/buscar-tecnico-instantaneo
 * @desc    Buscar técnico disponible 24/7 por tipo de servicio
 * @access  Privado - Solo clientes
 */
router.post(
  '/buscar-tecnico-instantaneo',
  verificarToken,
  soloCliente,
  buscarTecnicoInstantaneo
);

/**
 * @route   POST /api/servicios
 * @desc    Crear nueva solicitud de servicio
 * @access  Privado - Solo clientes
 */
router.post(
  '/',
  verificarToken,
  soloCliente,
  ...subirImagenesACloudinary('fotos', 5, CARPETAS.SERVICIOS),
  validacionesCrearServicio,
  crearServicio
);

/**
 * @route   POST /api/servicios/instantaneo
 * @desc    Solicitar técnico inmediato (estilo Uber)
 * @access  Privado - Solo clientes
 */
router.post(
  '/instantaneo',
  verificarToken,
  soloCliente,
  ...subirImagenesACloudinary('fotos', 3, CARPETAS.SERVICIOS),
  validacionesServicioInmediato,
  solicitarTecnicoInmediato
);

/**
 * @route   GET /api/servicios
 * @desc    Obtener mis servicios (cliente)
 * @access  Privado
 */
router.get('/', verificarToken, obtenerMisServicios);

/**
 * @route   PUT /api/servicios/:id/cancelar
 * @desc    Cancelar servicio
 * @access  Privado - Solo el cliente propietario
 */
router.put('/:id/cancelar', verificarToken, cancelarServicio);

/**
 * @route   PUT /api/servicios/:id
 * @desc    Editar servicio existente
 * @access  Privado - Solo el cliente propietario
 */
router.put(
  '/:id',
  verificarToken,
  soloCliente,
  ...subirImagenesACloudinary('fotos', 5, CARPETAS.SERVICIOS),
  validacionesEditarServicio,
  editarServicio
);

// ===== RUTAS DE TÉCNICO =====

/**
 * @route   GET /api/servicios/disponibles
 * @desc    Obtener servicios disponibles para técnicos
 * @access  Privado - Solo técnicos
 */
router.get(
  '/disponibles',
  verificarToken,
  soloTecnico,
  obtenerServiciosDisponibles
);

/**
 * @route   POST /api/servicios/:id/aceptar-inmediato
 * @desc    Técnico acepta servicio inmediato
 * @access  Privado - Solo técnicos
 */
router.post(
  '/:id/aceptar-inmediato',
  verificarToken,
  soloTecnico,
  aceptarServicioInmediato
);

// ===== RUTAS COMPARTIDAS =====

/**
 * @route   GET /api/servicios/:id
 * @desc    Obtener servicio por ID
 * @access  Privado
 */
router.get('/:id', verificarToken, obtenerServicioPorId);

module.exports = router;
