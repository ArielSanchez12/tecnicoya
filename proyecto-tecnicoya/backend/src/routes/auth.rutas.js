/**
 * Rutas de Autenticación
 * TécnicoYa - Backend
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  registrar,
  login,
  obtenerPerfil,
  cambiarContrasena,
  verificarToken: verificarTokenControlador,
  solicitarRecuperacion,
  restablecerContrasena,
  verificarTokenRecuperacion,
  verificarCuenta,
  reenviarVerificacion
} = require('../controllers/authControlador');

const { verificarToken } = require('../middleware/autenticacion');
const { subirCamposMixtos, procesarYSubirACloudinary, CARPETAS } = require('../middleware/subidaArchivos');

// ===== VALIDACIONES =====

const validacionesRegistro = [
  body('email')
    .isEmail()
    .withMessage('Ingresa un email válido')
    .normalizeEmail(),
  body('contrasena')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol')
    .isIn(['cliente', 'tecnico'])
    .withMessage('El rol debe ser "cliente" o "tecnico"'),
  body('perfil.nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio'),
  body('perfil.apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es obligatorio'),
  body('perfil.telefono')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es obligatorio')
];

const validacionesLogin = [
  body('email')
    .isEmail()
    .withMessage('Ingresa un email válido')
    .normalizeEmail(),
  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
];

const validacionesCambioContrasena = [
  body('contrasenaActual')
    .notEmpty()
    .withMessage('La contraseña actual es obligatoria'),
  body('nuevaContrasena')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
];

// ===== RUTAS =====

/**
 * @route   POST /api/auth/registro
 * @desc    Registrar nuevo usuario (cliente o técnico)
 * @access  Público
 */
router.post(
  '/registro',
  subirCamposMixtos([
    { name: 'fotoPerfil', maxCount: 1 },
    { name: 'certificaciones', maxCount: 5 }
  ]),
  procesarYSubirACloudinary(CARPETAS.PERFILES),
  validacionesRegistro,
  registrar
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Público
 */
router.post('/login', validacionesLogin, login);

/**
 * @route   GET /api/auth/verificar-cuenta/:token
 * @desc    Verificar cuenta con token enviado por email
 * @access  Público
 */
router.get('/verificar-cuenta/:token', verificarCuenta);

/**
 * @route   POST /api/auth/reenviar-verificacion
 * @desc    Reenviar correo de verificación
 * @access  Público
 */
router.post('/reenviar-verificacion', reenviarVerificacion);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/perfil', verificarToken, obtenerPerfil);

/**
 * @route   PUT /api/auth/cambiar-contrasena
 * @desc    Cambiar contraseña
 * @access  Privado
 */
router.put(
  '/cambiar-contrasena',
  verificarToken,
  validacionesCambioContrasena,
  cambiarContrasena
);

/**
 * @route   GET /api/auth/verificar
 * @desc    Verificar si el token es válido
 * @access  Privado
 */
router.get('/verificar', verificarToken, verificarTokenControlador);

/**
 * @route   POST /api/auth/recuperar-contrasena
 * @desc    Solicitar recuperación de contraseña (envía email)
 * @access  Público
 */
router.post('/recuperar-contrasena', solicitarRecuperacion);

/**
 * @route   GET /api/auth/verificar-token-recuperacion/:token
 * @desc    Verificar si el token de recuperación es válido
 * @access  Público
 */
router.get('/verificar-token-recuperacion/:token', verificarTokenRecuperacion);

/**
 * @route   POST /api/auth/restablecer-contrasena/:token
 * @desc    Restablecer contraseña con token
 * @access  Público
 */
router.post('/restablecer-contrasena/:token', restablecerContrasena);

module.exports = router;
