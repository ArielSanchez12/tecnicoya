/**
 * Controlador de Autenticación
 * TécnicoYa - Backend
 * Manejo de registro, login y perfil
 */

const { validationResult } = require('express-validator');
const crypto = require('crypto');
const Usuario = require('../models/Usuario');
const { generarToken } = require('../middleware/autenticacion');
const { subirImagen, CARPETAS } = require('../config/cloudinary');
const { enviarCorreoRegistro, enviarCorreoRecuperacion, enviarCorreoCambioContrasena } = require('../utils/correos');

/**
 * Registrar nuevo usuario
 * POST /api/auth/registro
 */
const registrar = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const {
      email,
      contrasena,
      rol,
      perfil,
      datosTecnico
    } = req.body;

    // Verificar si el email ya existe
    const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
    if (usuarioExistente) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Ya existe una cuenta con este email'
      });
    }

    // Preparar datos del usuario
    const datosUsuario = {
      email: email.toLowerCase(),
      contrasena,
      rol,
      perfil: {
        nombre: perfil.nombre,
        apellido: perfil.apellido,
        telefono: perfil.telefono,
        direccion: perfil.direccion || {}
      }
    };

    // Si es técnico, añadir datos específicos
    if (rol === 'tecnico' && datosTecnico) {
      datosUsuario.datosTecnico = {
        especialidades: datosTecnico.especialidades || [],
        tarifaPorHora: datosTecnico.tarifaPorHora || 0,
        descripcion: datosTecnico.descripcion || '',
        disponibleEmergencias: datosTecnico.disponibleEmergencias || false,
        certificaciones: []
      };
    }

    // Subir foto de perfil si se envió
    if (req.archivoSubido) {
      datosUsuario.perfil.fotoUrl = req.archivoSubido.url;
    }

    // Subir certificaciones si es técnico
    if (rol === 'tecnico' && req.archivosSubidos?.certificaciones) {
      datosUsuario.datosTecnico.certificaciones = req.archivosSubidos.certificaciones.map((cert, index) => ({
        nombre: `Certificación ${index + 1}`,
        url: cert.url,
        fechaEmision: new Date()
      }));
    }

    // Crear usuario
    const nuevoUsuario = await Usuario.create(datosUsuario);

    // Generar token
    const token = generarToken(nuevoUsuario);

    // Responder sin la contraseña
    const usuarioRespuesta = nuevoUsuario.toObject();
    delete usuarioRespuesta.contrasena;

    res.status(201).json({
      exito: true,
      mensaje: `¡Bienvenido a TécnicoYa, ${nuevoUsuario.perfil.nombre}!`,
      datos: {
        usuario: usuarioRespuesta,
        token
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const { email, contrasena } = req.body;

    // Buscar usuario incluyendo contraseña
    const usuario = await Usuario.findOne({ email: email.toLowerCase() }).select('+contrasena');

    if (!usuario) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas'
      });
    }

    // Verificar si la cuenta está activa
    if (!usuario.activo) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Tu cuenta ha sido desactivada. Contacta a soporte.'
      });
    }

    // Verificar contraseña
    const contrasenaValida = await usuario.compararContrasena(contrasena);
    if (!contrasenaValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Credenciales inválidas'
      });
    }

    // Actualizar última conexión
    usuario.ultimaConexion = new Date();
    await usuario.save();

    // Generar token
    const token = generarToken(usuario);

    // Responder sin la contraseña
    const usuarioRespuesta = usuario.toObject();
    delete usuarioRespuesta.contrasena;

    res.json({
      exito: true,
      mensaje: `¡Hola de nuevo, ${usuario.perfil.nombre}!`,
      datos: {
        usuario: usuarioRespuesta,
        token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * GET /api/auth/perfil
 */
const obtenerPerfil = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);

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
};

/**
 * Actualizar contraseña
 * PUT /api/auth/cambiar-contrasena
 */
const cambiarContrasena = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const { contrasenaActual, nuevaContrasena } = req.body;

    // Obtener usuario con contraseña
    const usuario = await Usuario.findById(req.usuario._id).select('+contrasena');

    // Verificar contraseña actual
    const contrasenaValida = await usuario.compararContrasena(contrasenaActual);
    if (!contrasenaValida) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La contraseña actual es incorrecta'
      });
    }

    // Actualizar contraseña
    usuario.contrasena = nuevaContrasena;
    await usuario.save();

    res.json({
      exito: true,
      mensaje: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

/**
 * Verificar token válido
 * GET /api/auth/verificar
 */
const verificarToken = async (req, res) => {
  try {
    // Si llega aquí, el token es válido (ya pasó el middleware)
    res.json({
      exito: true,
      mensaje: 'Token válido',
      datos: {
        usuario: req.usuario
      }
    });
  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar token'
    });
  }
};

/**
 * Solicitar recuperación de contraseña
 * POST /api/auth/recuperar-contrasena
 */
const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El email es obligatorio'
      });
    }

    // Buscar usuario por email
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    // Por seguridad, siempre respondemos lo mismo aunque el email no exista
    if (!usuario) {
      return res.json({
        exito: true,
        mensaje: 'Si el email existe, recibirás un correo con instrucciones'
      });
    }

    // Generar token de recuperación
    const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
    const hashToken = crypto.createHash('sha256').update(tokenRecuperacion).digest('hex');

    // Guardar token hasheado y fecha de expiración (1 hora)
    usuario.tokenRecuperacion = hashToken;
    usuario.expiracionTokenRecuperacion = Date.now() + 3600000; // 1 hora
    await usuario.save();

    // Enviar correo de recuperación
    try {
      await enviarCorreoRecuperacion(
        usuario.email,
        usuario.perfil.nombre,
        tokenRecuperacion
      );
    } catch (emailError) {
      console.error('Error al enviar correo:', emailError);
      // No revelamos el error al usuario
    }

    res.json({
      exito: true,
      mensaje: 'Si el email existe, recibirás un correo con instrucciones'
    });

  } catch (error) {
    console.error('Error en recuperación:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al procesar la solicitud'
    });
  }
};

/**
 * Restablecer contraseña con token
 * POST /api/auth/restablecer-contrasena/:token
 */
const restablecerContrasena = async (req, res) => {
  try {
    const { token } = req.params;
    const { nuevaContrasena } = req.body;

    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Hashear el token recibido para comparar
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token válido y no expirado
    const usuario = await Usuario.findOne({
      tokenRecuperacion: hashToken,
      expiracionTokenRecuperacion: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El enlace ha expirado o es inválido'
      });
    }

    // Actualizar contraseña
    usuario.contrasena = nuevaContrasena;
    usuario.tokenRecuperacion = undefined;
    usuario.expiracionTokenRecuperacion = undefined;
    await usuario.save();

    // Enviar correo de confirmación de cambio
    try {
      await enviarCorreoCambioContrasena(usuario.email, usuario.perfil.nombre);
    } catch (emailError) {
      console.error('Error al enviar correo de confirmación:', emailError);
    }

    res.json({
      exito: true,
      mensaje: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al restablecer contraseña'
    });
  }
};

/**
 * Verificar token de recuperación
 * GET /api/auth/verificar-token-recuperacion/:token
 */
const verificarTokenRecuperacion = async (req, res) => {
  try {
    const { token } = req.params;

    // Hashear el token para comparar
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token válido
    const usuario = await Usuario.findOne({
      tokenRecuperacion: hashToken,
      expiracionTokenRecuperacion: { $gt: Date.now() }
    });

    if (!usuario) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El enlace ha expirado o es inválido'
      });
    }

    res.json({
      exito: true,
      mensaje: 'Token válido'
    });

  } catch (error) {
    res.status(500).json({
      exito: false,
      mensaje: 'Error al verificar token'
    });
  }
};

module.exports = {
  registrar,
  login,
  obtenerPerfil,
  cambiarContrasena,
  verificarToken,
  solicitarRecuperacion,
  restablecerContrasena,
  verificarTokenRecuperacion
};
