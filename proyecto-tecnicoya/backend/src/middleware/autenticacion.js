/**
 * Middleware de Autenticación JWT
 * TécnicoYa - Backend
 * Verifica tokens y protege rutas
 */

const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

/**
 * Middleware que verifica el token JWT
 * Añade req.usuario con los datos del usuario autenticado
 */
const verificarToken = async (req, res, siguiente) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso denegado. Token no proporcionado.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decodificado = jwt.verify(token, process.env.JWT_SECRETO);

    // Buscar usuario en base de datos
    const usuario = await Usuario.findById(decodificado.id).select('-contrasena');

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido. Usuario no encontrado.'
      });
    }

    // Añadir usuario al request
    req.usuario = usuario;
    siguiente();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token expirado. Por favor, inicia sesión nuevamente.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Token inválido.'
      });
    }

    console.error('❌ Error en verificación de token:', error.message);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error en la autenticación.'
    });
  }
};

/**
 * Middleware que verifica si el usuario es técnico
 */
const soloTecnico = (req, res, siguiente) => {
  if (req.usuario.rol !== 'tecnico') {
    return res.status(403).json({
      exito: false,
      mensaje: 'Acceso denegado. Solo técnicos pueden realizar esta acción.'
    });
  }
  siguiente();
};

/**
 * Middleware que verifica si el usuario es cliente
 */
const soloCliente = (req, res, siguiente) => {
  if (req.usuario.rol !== 'cliente') {
    return res.status(403).json({
      exito: false,
      mensaje: 'Acceso denegado. Solo clientes pueden realizar esta acción.'
    });
  }
  siguiente();
};

/**
 * Middleware que verifica si el técnico está verificado
 */
const tecnicoVerificado = (req, res, siguiente) => {
  if (req.usuario.rol !== 'tecnico') {
    return res.status(403).json({
      exito: false,
      mensaje: 'Acceso denegado. Solo técnicos pueden realizar esta acción.'
    });
  }

  if (!req.usuario.datosTecnico?.verificado) {
    return res.status(403).json({
      exito: false,
      mensaje: 'Tu cuenta de técnico aún no ha sido verificada.'
    });
  }

  siguiente();
};

/**
 * Genera un token JWT para un usuario
 * @param {Object} usuario - Usuario de la base de datos
 * @returns {String} - Token JWT
 */
const generarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario._id,
      email: usuario.email,
      rol: usuario.rol
    },
    process.env.JWT_SECRETO,
    { expiresIn: '7d' }
  );
};

/**
 * Middleware opcional de autenticación
 * No bloquea si no hay token, pero añade usuario si existe
 */
const autenticacionOpcional = async (req, res, siguiente) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decodificado = jwt.verify(token, process.env.JWT_SECRETO);
      const usuario = await Usuario.findById(decodificado.id).select('-contrasena');

      if (usuario) {
        req.usuario = usuario;
      }
    }

    siguiente();
  } catch (error) {
    // Continuar sin usuario autenticado
    siguiente();
  }
};

module.exports = {
  verificarToken,
  soloTecnico,
  soloCliente,
  tecnicoVerificado,
  generarToken,
  autenticacionOpcional
};
