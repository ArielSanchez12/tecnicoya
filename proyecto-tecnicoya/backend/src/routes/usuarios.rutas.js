/**
 * Rutas de Usuarios
 * TécnicoYa - Backend
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  obtenerTecnicosCercanos,
  obtenerUsuarioPorId,
  actualizarPerfil,
  subirFotoPerfil,
  agregarPortafolio,
  agregarCertificacion,
  actualizarDisponibilidad,
  retirarFondos
} = require('../controllers/usuarioControlador');

const { verificarToken, soloTecnico } = require('../middleware/autenticacion');
const {
  subirImagenACloudinary,
  subirImagenesACloudinary,
  CARPETAS
} = require('../middleware/subidaArchivos');

// ===== VALIDACIONES =====

const validacionesActualizarPerfil = [
  body('perfil.nombre')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres'),
  body('perfil.apellido')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('El apellido debe tener al menos 2 caracteres'),
  body('perfil.telefono')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Teléfono inválido'),
  body('datosTecnico.tarifaPorHora')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La tarifa debe ser un número positivo')
];

// ===== RUTAS PÚBLICAS =====

/**
 * @route   GET /api/usuarios/tecnicos
 * @desc    Obtener técnicos cercanos (con filtros)
 * @access  Público
 */
router.get('/tecnicos', obtenerTecnicosCercanos);

// ===== RUTAS PROTEGIDAS (deben ir ANTES de /:id) =====

/**
 * @route   GET /api/usuarios/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Privado
 */
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const Usuario = require('../models/Usuario');
    const usuario = await Usuario.findById(req.usuario._id).select('-contrasena');

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    res.json({
      exito: true,
      datos: usuario
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener perfil',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener usuario por ID
 * @access  Público
 */
router.get('/:id', obtenerUsuarioPorId);

// ===== RUTAS PROTEGIDAS =====

/**
 * @route   PUT /api/usuarios/perfil
 * @desc    Actualizar perfil propio
 * @access  Privado
 */
router.put(
  '/perfil',
  verificarToken,
  validacionesActualizarPerfil,
  actualizarPerfil
);

/**
 * @route   POST /api/usuarios/foto
 * @desc    Subir foto de perfil
 * @access  Privado
 */
router.post(
  '/foto',
  verificarToken,
  ...subirImagenACloudinary('foto', CARPETAS.PERFILES),
  subirFotoPerfil
);

/**
 * @route   POST /api/usuarios/portafolio
 * @desc    Agregar elemento al portafolio (técnicos)
 * @access  Privado - Solo técnicos
 */
router.post(
  '/portafolio',
  verificarToken,
  soloTecnico,
  ...subirImagenesACloudinary('imagenes', 5, CARPETAS.PORTAFOLIO),
  agregarPortafolio
);

/**
 * @route   POST /api/usuarios/certificacion
 * @desc    Agregar certificación (técnicos)
 * @access  Privado - Solo técnicos
 */
router.post(
  '/certificacion',
  verificarToken,
  soloTecnico,
  ...subirImagenACloudinary('certificacion', CARPETAS.CERTIFICACIONES),
  agregarCertificacion
);

/**
 * @route   PUT /api/usuarios/disponibilidad
 * @desc    Actualizar disponibilidad (técnicos)
 * @access  Privado - Solo técnicos
 */
router.put(
  '/disponibilidad',
  verificarToken,
  soloTecnico,
  actualizarDisponibilidad
);

/**
 * @route   POST /api/usuarios/retirar-fondos
 * @desc    Retirar fondos a cuenta bancaria (técnicos)
 * @access  Privado - Solo técnicos
 */
router.post(
  '/retirar-fondos',
  verificarToken,
  soloTecnico,
  retirarFondos
);

/**
 * @route   POST /api/usuarios/recalcular-fondos
 * @desc    Recalcular fondos basándose en trabajos completados (técnicos)
 * @access  Privado - Solo técnicos
 */
router.post(
  '/recalcular-fondos',
  verificarToken,
  soloTecnico,
  async (req, res) => {
    try {
      const Trabajo = require('../models/Trabajo');
      const Usuario = require('../models/Usuario');

      // Buscar todos los trabajos del técnico con pago liberado
      const trabajos = await Trabajo.find({
        idTecnico: req.usuario._id,
        estado: 'completado',
        'pago.estado': 'liberado'
      });

      // Calcular total ganado
      let totalGanado = 0;
      for (const trabajo of trabajos) {
        totalGanado += trabajo.pago.montoNeto || 0;
      }

      // Obtener usuario actual para calcular diferencia
      const usuario = await Usuario.findById(req.usuario._id);
      const fondosActuales = usuario?.datosTecnico?.fondos?.disponible || 0;
      const totalRetirado = usuario?.datosTecnico?.fondos?.totalRetirado || 0;

      // Calcular fondos disponibles (total ganado - total retirado)
      const fondosDisponibles = totalGanado - totalRetirado;

      // Actualizar fondos del técnico
      await Usuario.findByIdAndUpdate(req.usuario._id, {
        $set: {
          'datosTecnico.fondos.disponible': fondosDisponibles,
          'datosTecnico.fondos.totalGanado': totalGanado
        }
      });

      console.log(`✅ Fondos recalculados para técnico ${req.usuario._id}: $${totalGanado} total, $${fondosDisponibles} disponible`);

      res.json({
        exito: true,
        mensaje: 'Fondos recalculados correctamente',
        datos: {
          totalTrabajos: trabajos.length,
          totalGanado,
          totalRetirado,
          fondosDisponibles
        }
      });

    } catch (error) {
      console.error('Error al recalcular fondos:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error al recalcular fondos',
        error: error.message
      });
    }
  }
);

module.exports = router;
