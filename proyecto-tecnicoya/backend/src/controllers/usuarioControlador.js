/**
 * Controlador de Usuarios
 * TécnicoYa - Backend
 * Gestión de perfiles y búsqueda de técnicos
 */

const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const { subirImagen, CARPETAS } = require('../config/cloudinary');
const { calcularDistancia, crearPuntoGeoJSON } = require('../utils/geolocalizacion');

/**
 * Obtener técnicos cercanos
 * GET /api/usuarios/tecnicos
 */
const obtenerTecnicosCercanos = async (req, res) => {
  try {
    const {
      latitud,
      longitud,
      radio = 15, // km (radio base)
      especialidad,
      calificacionMinima,
      disponibleEmergencias,
      emergencia24h,
      disponibleAhora,
      pagina = 1,
      limite = 20
    } = req.query;

    // Construir filtro base
    const filtro = {
      rol: 'tecnico',
      activo: true
    };

    // Filtro por especialidad
    if (especialidad) {
      filtro['datosTecnico.especialidades'] = especialidad;
    }

    // Filtro por calificación mínima
    if (calificacionMinima) {
      filtro['datosTecnico.calificacion'] = { $gte: parseFloat(calificacionMinima) };
    }

    // Filtro por disponibilidad en emergencias 24/7
    if (disponibleEmergencias === 'true' || emergencia24h === 'true') {
      filtro['datosTecnico.emergencia24h'] = true;
    }

    // Filtro por disponible ahora
    if (disponibleAhora === 'true') {
      filtro['datosTecnico.disponibleAhora'] = true;
    }

    let tecnicos;
    const saltar = (parseInt(pagina) - 1) * parseInt(limite);

    // Si hay coordenadas, buscar por cercanía
    if (latitud && longitud) {
      const coordenadas = [parseFloat(longitud), parseFloat(latitud)];

      tecnicos = await Usuario.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: coordenadas
            },
            distanceField: 'distancia',
            maxDistance: parseInt(radio) * 1000,
            spherical: true,
            distanceMultiplier: 0.001, // Convertir a km
            key: 'datosTecnico.ubicacionBase.coordenadas' // Usar ubicación del técnico
          }
        },
        { $match: filtro },
        { $skip: saltar },
        { $limit: parseInt(limite) },
        {
          $project: {
            contrasena: 0,
            historialPuntos: 0,
            tokenRecuperacion: 0
          }
        }
      ]);

      // Formatear distancia
      tecnicos = tecnicos.map(t => ({
        ...t,
        distancia: Math.round(t.distancia * 100) / 100
      }));

    } else {
      // Sin coordenadas, ordenar por calificación
      tecnicos = await Usuario.find(filtro)
        .select('-contrasena -historialPuntos -tokenRecuperacion')
        .sort({ 'datosTecnico.calificacion': -1 })
        .skip(saltar)
        .limit(parseInt(limite));
    }

    // Contar total
    const total = await Usuario.countDocuments(filtro);

    res.json({
      exito: true,
      datos: {
        tecnicos,
        paginacion: {
          total,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(total / parseInt(limite))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener técnicos:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener técnicos',
      error: error.message
    });
  }
};

/**
 * Obtener usuario por ID
 * GET /api/usuarios/:id
 */
const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findById(id)
      .select('-contrasena -historialPuntos -tokenRecuperacion');

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
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener usuario',
      error: error.message
    });
  }
};

/**
 * Actualizar perfil propio
 * PUT /api/usuarios/perfil
 */
const actualizarPerfil = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Error de validación',
        errores: errores.array()
      });
    }

    const { perfil, datosTecnico } = req.body;
    const actualizacion = {};

    // Actualizar datos del perfil
    if (perfil) {
      if (perfil.nombre) actualizacion['perfil.nombre'] = perfil.nombre;
      if (perfil.apellido) actualizacion['perfil.apellido'] = perfil.apellido;
      if (perfil.telefono) actualizacion['perfil.telefono'] = perfil.telefono;

      if (perfil.direccion) {
        if (perfil.direccion.calle) actualizacion['perfil.direccion.calle'] = perfil.direccion.calle;
        if (perfil.direccion.ciudad) actualizacion['perfil.direccion.ciudad'] = perfil.direccion.ciudad;
        if (perfil.direccion.referencia) actualizacion['perfil.direccion.referencia'] = perfil.direccion.referencia;
        // NOTA: Las coordenadas NO se guardan en el perfil por privacidad
        // Los clientes proporcionan coordenadas solo en solicitudes de servicio
      }
    }

    // Actualizar datos de técnico si aplica
    if (datosTecnico && req.usuario.rol === 'tecnico') {
      if (datosTecnico.especialidades) actualizacion['datosTecnico.especialidades'] = datosTecnico.especialidades;
      if (datosTecnico.descripcion) actualizacion['datosTecnico.descripcion'] = datosTecnico.descripcion;
      if (datosTecnico.disponibleAhora !== undefined) actualizacion['datosTecnico.disponibleAhora'] = datosTecnico.disponibleAhora;
      if (datosTecnico.emergencia24h !== undefined) actualizacion['datosTecnico.emergencia24h'] = datosTecnico.emergencia24h;
      if (datosTecnico.zonasCobertura) actualizacion['datosTecnico.zonasCobertura'] = datosTecnico.zonasCobertura;
      if (datosTecnico.radioTrabajo !== undefined) actualizacion['datosTecnico.radioTrabajo'] = datosTecnico.radioTrabajo;

      // Ubicación base del técnico (para búsquedas por cercanía)
      if (datosTecnico.ubicacionBase) {
        if (datosTecnico.ubicacionBase.direccion) actualizacion['datosTecnico.ubicacionBase.direccion'] = datosTecnico.ubicacionBase.direccion;
        if (datosTecnico.ubicacionBase.ciudad) actualizacion['datosTecnico.ubicacionBase.ciudad'] = datosTecnico.ubicacionBase.ciudad;
        if (datosTecnico.ubicacionBase.latitud && datosTecnico.ubicacionBase.longitud) {
          actualizacion['datosTecnico.ubicacionBase.coordenadas'] = crearPuntoGeoJSON(
            parseFloat(datosTecnico.ubicacionBase.latitud),
            parseFloat(datosTecnico.ubicacionBase.longitud)
          );
        }
      }
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { $set: actualizacion },
      { new: true, runValidators: true }
    ).select('-contrasena');

    res.json({
      exito: true,
      mensaje: 'Perfil actualizado correctamente',
      datos: usuarioActualizado
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

/**
 * Subir foto de perfil
 * POST /api/usuarios/foto
 */
const subirFotoPerfil = async (req, res) => {
  try {
    if (!req.archivoSubido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'No se proporcionó ninguna imagen'
      });
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { $set: { 'perfil.fotoUrl': req.archivoSubido.url } },
      { new: true }
    ).select('-contrasena');

    res.json({
      exito: true,
      mensaje: 'Foto de perfil actualizada',
      datos: {
        fotoUrl: req.archivoSubido.url,
        usuario: usuarioActualizado
      }
    });

  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al subir foto de perfil',
      error: error.message
    });
  }
};

/**
 * Agregar elemento al portafolio (técnicos)
 * POST /api/usuarios/portafolio
 */
const agregarPortafolio = async (req, res) => {
  try {
    if (req.usuario.rol !== 'tecnico') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo técnicos pueden agregar portafolio'
      });
    }

    const { titulo, descripcion } = req.body;
    const imagenes = req.archivosSubidos?.map(f => f.url) || [];

    if (!titulo) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El título es obligatorio'
      });
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      {
        $push: {
          'datosTecnico.portafolio': {
            titulo,
            descripcion: descripcion || '',
            imagenes
          }
        }
      },
      { new: true }
    ).select('-contrasena');

    res.json({
      exito: true,
      mensaje: 'Elemento agregado al portafolio',
      datos: usuarioActualizado.datosTecnico.portafolio
    });

  } catch (error) {
    console.error('Error al agregar portafolio:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al agregar al portafolio',
      error: error.message
    });
  }
};

/**
 * Agregar certificación (técnicos)
 * POST /api/usuarios/certificacion
 */
const agregarCertificacion = async (req, res) => {
  try {
    if (req.usuario.rol !== 'tecnico') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo técnicos pueden agregar certificaciones'
      });
    }

    const { nombre, fechaEmision } = req.body;

    if (!req.archivoSubido) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Debes subir una imagen de la certificación'
      });
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      {
        $push: {
          'datosTecnico.certificaciones': {
            nombre: nombre || 'Certificación',
            url: req.archivoSubido.url,
            fechaEmision: fechaEmision ? new Date(fechaEmision) : new Date()
          }
        }
      },
      { new: true }
    ).select('-contrasena');

    res.json({
      exito: true,
      mensaje: 'Certificación agregada',
      datos: usuarioActualizado.datosTecnico.certificaciones
    });

  } catch (error) {
    console.error('Error al agregar certificación:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al agregar certificación',
      error: error.message
    });
  }
};

/**
 * Actualizar disponibilidad (técnicos)
 * PUT /api/usuarios/disponibilidad
 */
const actualizarDisponibilidad = async (req, res) => {
  try {
    if (req.usuario.rol !== 'tecnico') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo técnicos pueden actualizar disponibilidad'
      });
    }

    const { disponibleAhora, emergencia24h, ubicacion } = req.body;
    const actualizacion = {};

    if (disponibleAhora !== undefined) {
      actualizacion['datosTecnico.disponibleAhora'] = disponibleAhora;
    }

    if (emergencia24h !== undefined) {
      actualizacion['datosTecnico.emergencia24h'] = emergencia24h;
    }

    if (ubicacion && ubicacion.latitud && ubicacion.longitud) {
      actualizacion['perfil.direccion.coordenadas'] = crearPuntoGeoJSON(
        parseFloat(ubicacion.latitud),
        parseFloat(ubicacion.longitud)
      );
    }

    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      req.usuario._id,
      { $set: actualizacion },
      { new: true }
    ).select('-contrasena');

    res.json({
      exito: true,
      mensaje: 'Disponibilidad actualizada',
      datos: {
        disponibleAhora: usuarioActualizado.datosTecnico.disponibleAhora,
        emergencia24h: usuarioActualizado.datosTecnico.emergencia24h
      }
    });

  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al actualizar disponibilidad',
      error: error.message
    });
  }
};

/**
 * Retirar fondos (técnicos)
 * POST /api/usuarios/retirar-fondos
 */
const retirarFondos = async (req, res) => {
  try {
    const { monto, banco, numeroCuenta, titular } = req.body;
    const usuarioId = req.usuario._id;

    // Validar datos requeridos
    if (!monto || !banco || !numeroCuenta || !titular) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Todos los campos son requeridos: monto, banco, numeroCuenta, titular'
      });
    }

    // Validar monto mínimo
    if (monto < 10) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El monto mínimo de retiro es $10'
      });
    }

    // Obtener usuario
    const usuario = await Usuario.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado'
      });
    }

    // Verificar que sea técnico
    if (usuario.rol !== 'tecnico') {
      return res.status(403).json({
        exito: false,
        mensaje: 'Solo los técnicos pueden retirar fondos'
      });
    }

    // Verificar fondos disponibles
    const fondosDisponibles = usuario.datosTecnico?.fondos?.disponible || 0;

    if (monto > fondosDisponibles) {
      return res.status(400).json({
        exito: false,
        mensaje: `Fondos insuficientes. Disponible: $${fondosDisponibles.toFixed(2)}`
      });
    }

    // Crear registro de retiro
    const nuevoRetiro = {
      monto,
      fecha: new Date(),
      estado: 'completado', // En producción sería 'pendiente' o 'procesando'
      banco,
      numeroCuenta,
      titular
    };

    // Actualizar fondos del técnico
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      usuarioId,
      {
        $inc: {
          'datosTecnico.fondos.disponible': -monto,
          'datosTecnico.fondos.totalRetirado': monto
        },
        $push: {
          'datosTecnico.historialRetiros': {
            $each: [nuevoRetiro],
            $position: 0 // Agregar al inicio del array
          }
        }
      },
      { new: true }
    ).select('-contrasena');

    console.log(`✅ Retiro procesado: $${monto} para técnico ${usuario.perfil.nombre}`);

    res.json({
      exito: true,
      mensaje: 'Retiro procesado exitosamente',
      datos: {
        retiro: nuevoRetiro,
        fondos: usuarioActualizado.datosTecnico.fondos
      }
    });

  } catch (error) {
    console.error('Error al procesar retiro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al procesar retiro',
      error: error.message
    });
  }
};

module.exports = {
  obtenerTecnicosCercanos,
  obtenerUsuarioPorId,
  actualizarPerfil,
  subirFotoPerfil,
  agregarPortafolio,
  agregarCertificacion,
  actualizarDisponibilidad,
  retirarFondos
};
