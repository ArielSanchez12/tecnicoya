/**
 * Rutas de Mensajes
 * TécnicoYa - Backend
 * Endpoints para gestión de mensajes/chat
 */

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/autenticacion');
const Mensaje = require('../models/Mensaje');

/**
 * GET /api/mensajes/conversacion/:usuarioId
 * Obtener mensajes de conversación directa con otro usuario
 */
router.get('/conversacion/:usuarioId', verificarToken, async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const miId = req.usuario._id;

    // Buscar mensajes donde yo soy emisor y el otro receptor, o viceversa
    const mensajes = await Mensaje.find({
      $or: [
        { idEmisor: miId, idReceptor: usuarioId },
        { idEmisor: usuarioId, idReceptor: miId }
      ]
    })
      .sort({ fechaEnvio: 1 })
      .limit(100)
      .lean();

    // Marcar como leídos los mensajes que recibí
    await Mensaje.updateMany(
      { idEmisor: usuarioId, idReceptor: miId, leido: false },
      { $set: { leido: true, fechaLectura: new Date() } }
    );

    res.json({
      exito: true,
      datos: mensajes
    });

  } catch (error) {
    console.error('Error al obtener conversación:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener mensajes',
      error: error.message
    });
  }
});

/**
 * GET /api/mensajes/trabajo/:trabajoId
 * Obtener mensajes de un trabajo
 */
router.get('/trabajo/:trabajoId', verificarToken, async (req, res) => {
  try {
    const { trabajoId } = req.params;

    const mensajes = await Mensaje.find({ idTrabajo: trabajoId })
      .sort({ fechaEnvio: 1 })
      .populate('idEmisor', 'perfil.nombre perfil.apellido perfil.fotoUrl')
      .lean();

    res.json({
      exito: true,
      datos: mensajes
    });

  } catch (error) {
    console.error('Error al obtener mensajes del trabajo:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener mensajes',
      error: error.message
    });
  }
});

/**
 * GET /api/mensajes/conversaciones
 * Obtener lista de conversaciones del usuario
 */
router.get('/conversaciones', verificarToken, async (req, res) => {
  try {
    const miId = req.usuario._id;

    // Obtener todos los usuarios con los que tengo mensajes
    const conversaciones = await Mensaje.aggregate([
      {
        $match: {
          $or: [
            { idEmisor: miId },
            { idReceptor: miId }
          ],
          idTrabajo: { $exists: false } // Solo chats directos
        }
      },
      {
        $sort: { fechaEnvio: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$idEmisor', miId] },
              '$idReceptor',
              '$idEmisor'
            ]
          },
          ultimoMensaje: { $first: '$$ROOT' },
          noLeidos: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$idReceptor', miId] }, { $eq: ['$leido', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'usuario'
        }
      },
      {
        $unwind: '$usuario'
      },
      {
        $project: {
          usuario: {
            _id: '$usuario._id',
            nombre: '$usuario.perfil.nombre',
            apellido: '$usuario.perfil.apellido',
            fotoUrl: '$usuario.perfil.fotoUrl'
          },
          ultimoMensaje: 1,
          noLeidos: 1
        }
      }
    ]);

    res.json({
      exito: true,
      datos: conversaciones
    });

  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener conversaciones',
      error: error.message
    });
  }
});

module.exports = router;
