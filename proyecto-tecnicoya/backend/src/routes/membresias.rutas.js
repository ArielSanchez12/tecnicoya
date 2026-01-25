/**
 * Rutas de Membresías
 * TécnicoYa - Backend
 * Sistema de membresías para técnicos
 */

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/autenticacion');
const {
  obtenerPlanes,
  obtenerMiMembresia,
  suscribirPlan,
  cancelarMembresia
} = require('../controllers/membresiaControlador');

// Rutas públicas
router.get('/planes', obtenerPlanes);

// Rutas protegidas (requieren autenticación)
router.get('/mi-membresia', verificarToken, obtenerMiMembresia);
router.post('/suscribir', verificarToken, suscribirPlan);
router.post('/cancelar', verificarToken, cancelarMembresia);

module.exports = router;
