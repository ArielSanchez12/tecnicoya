/**
 * Configuración de Socket.io
 * TécnicoYa - Backend
 * Manejo de comunicación en tiempo real (chat, notificaciones)
 */

const { Server } = require('socket.io');

let io = null;

// Almacenar conexiones activas por usuario
const usuariosConectados = new Map();

/**
 * Inicializa Socket.io con el servidor HTTP
 * @param {Object} servidorHttp - Servidor HTTP de Express
 * @returns {Object} - Instancia de Socket.io
 */
const inicializarSocket = (servidorHttp) => {
  io = new Server(servidorHttp, {
    cors: {
      origin: process.env.URL_FRONTEND || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  console.log('🔌 Socket.io inicializado');

  // Middleware de autenticación para sockets
  io.use((socket, siguiente) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decodificado = jwt.verify(token, process.env.JWT_SECRETO);
        socket.idUsuario = decodificado.id;
        socket.rolUsuario = decodificado.rol;
        siguiente();
      } catch (error) {
        console.warn('⚠️ Token de socket inválido:', error.message);
        siguiente(new Error('Autenticación fallida'));
      }
    } else {
      // Permitir conexiones sin autenticación para pruebas
      siguiente();
    }
  });

  // Manejar conexiones
  io.on('connection', (socket) => {
    console.log(`👤 Usuario conectado: ${socket.id}`);

    // Registrar usuario conectado
    if (socket.idUsuario) {
      usuariosConectados.set(socket.idUsuario, socket.id);
      console.log(`✅ Usuario ${socket.idUsuario} registrado con socket ${socket.id}`);
    }

    // ===== EVENTOS DE SALA DE TRABAJO =====

    /**
     * Unirse a sala de chat de un trabajo específico
     */
    socket.on('unirse_chat', (datos) => {
      const { idTrabajo } = datos;
      const salaTrabajo = `trabajo_${idTrabajo}`;
      socket.join(salaTrabajo);
      console.log(`📥 Socket ${socket.id} se unió a sala ${salaTrabajo}`);
    });

    /**
     * Salir de sala de chat
     */
    socket.on('salir_chat', (datos) => {
      const { idTrabajo } = datos;
      const salaTrabajo = `trabajo_${idTrabajo}`;
      socket.leave(salaTrabajo);
      console.log(`📤 Socket ${socket.id} salió de sala ${salaTrabajo}`);
    });

    // ===== EVENTOS DE CHAT =====

    /**
     * Enviar mensaje de chat (trabajo o directo)
     */
    socket.on('enviar_mensaje', async (datos) => {
      const { idTrabajo, idReceptor, contenido } = datos;

      // Guardar mensaje en base de datos
      try {
        const Mensaje = require('../models/Mensaje');
        const datosMsg = {
          idEmisor: socket.idUsuario,
          contenido,
          fechaEnvio: new Date()
        };

        // Si es chat de trabajo
        if (idTrabajo) {
          datosMsg.idTrabajo = idTrabajo;
          const salaTrabajo = `trabajo_${idTrabajo}`;

          const nuevoMensaje = await Mensaje.create(datosMsg);

          // Emitir mensaje a otros en la sala (excluyendo al emisor para evitar duplicados)
          socket.to(salaTrabajo).emit('recibir_mensaje', {
            _id: nuevoMensaje._id,
            idEmisor: socket.idUsuario,
            emisor: socket.idUsuario,
            contenido,
            fechaEnvio: nuevoMensaje.fechaEnvio,
            createdAt: nuevoMensaje.fechaEnvio
          });

          // Confirmar al emisor que el mensaje se guardó (para actualizar el ID temporal)
          socket.emit('mensaje_confirmado', {
            _id: nuevoMensaje._id,
            contenido,
            fechaEnvio: nuevoMensaje.fechaEnvio
          });

          console.log(`💬 Mensaje enviado en ${salaTrabajo}`);
        }
        // Si es chat directo
        else if (idReceptor) {
          datosMsg.idReceptor = idReceptor;

          const nuevoMensaje = await Mensaje.create(datosMsg);

          // Crear sala de chat directo (ordenar IDs para consistencia)
          const ids = [socket.idUsuario, idReceptor].sort();
          const salaDirecta = `chat_${ids[0]}_${ids[1]}`;

          // Emitir mensaje solo a otros en la sala (no al emisor)
          socket.to(salaDirecta).emit('recibir_mensaje', {
            _id: nuevoMensaje._id,
            emisor: socket.idUsuario,
            receptor: idReceptor,
            contenido,
            createdAt: nuevoMensaje.fechaEnvio
          });

          // Confirmar al emisor que el mensaje se guardó
          socket.emit('mensaje_confirmado', {
            _id: nuevoMensaje._id,
            contenido,
            createdAt: nuevoMensaje.fechaEnvio
          });

          // También notificar al receptor si no está en la sala
          const socketReceptor = usuariosConectados.get(idReceptor);
          if (socketReceptor) {
            // Verificar si el receptor ya está en la sala
            const socketObj = io.sockets.sockets.get(socketReceptor);
            if (socketObj && !socketObj.rooms.has(salaDirecta)) {
              io.to(socketReceptor).emit('nuevo_mensaje', {
                _id: nuevoMensaje._id,
                emisor: socket.idUsuario,
                receptor: idReceptor,
                contenido,
                createdAt: nuevoMensaje.fechaEnvio
              });
            }
          }

          console.log(`💬 Mensaje directo enviado de ${socket.idUsuario} a ${idReceptor}`);
        }
      } catch (error) {
        console.error('❌ Error al guardar mensaje:', error.message);
        socket.emit('error_mensaje', { mensaje: 'Error al enviar mensaje' });
      }
    });

    /**
     * Unirse a sala de chat directo
     */
    socket.on('unirse_chat_directo', (datos) => {
      const { idOtroUsuario } = datos;
      const ids = [socket.idUsuario, idOtroUsuario].sort();
      const salaDirecta = `chat_${ids[0]}_${ids[1]}`;
      socket.join(salaDirecta);
      console.log(`📥 Socket ${socket.id} se unió a chat directo ${salaDirecta}`);
    });

    /**
     * Indicador de "escribiendo..."
     */
    socket.on('escribiendo', (datos) => {
      const { idTrabajo, idReceptor, escribiendo } = datos;

      if (idTrabajo) {
        const salaTrabajo = `trabajo_${idTrabajo}`;
        socket.to(salaTrabajo).emit('usuario_escribiendo', {
          idUsuario: socket.idUsuario,
          escribiendo
        });
      } else if (idReceptor) {
        // Emitir directamente al receptor
        const socketReceptor = usuariosConectados.get(idReceptor);
        if (socketReceptor) {
          io.to(socketReceptor).emit('usuario_escribiendo', {
            usuarioId: socket.idUsuario,
            escribiendo
          });
        }
      }
    });

    // ===== EVENTOS DE TÉCNICO =====

    /**
     * Técnico se registra como disponible
     */
    socket.on('tecnico_disponible', (datos) => {
      const { ubicacion, especialidades } = datos;
      socket.ubicacionTecnico = ubicacion;
      socket.especialidadesTecnico = especialidades;
      socket.join('tecnicos_disponibles');
      console.log(`🔧 Técnico ${socket.idUsuario} disponible en ${JSON.stringify(ubicacion)}`);
    });

    /**
     * Técnico actualiza su ubicación
     */
    socket.on('actualizar_ubicacion', (datos) => {
      const { ubicacion, idTrabajo } = datos;
      socket.ubicacionTecnico = ubicacion;

      if (idTrabajo) {
        const salaTrabajo = `trabajo_${idTrabajo}`;
        socket.to(salaTrabajo).emit('ubicacion_tecnico', {
          idTecnico: socket.idUsuario,
          ubicacion
        });
      }
    });

    // ===== DESCONEXIÓN =====

    socket.on('disconnect', () => {
      if (socket.idUsuario) {
        usuariosConectados.delete(socket.idUsuario);
      }
      console.log(`👋 Usuario desconectado: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Obtiene la instancia de Socket.io
 * @returns {Object} - Instancia de Socket.io
 */
const obtenerIO = () => {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado');
  }
  return io;
};

/**
 * Obtiene el socket ID de un usuario conectado
 * @param {String} idUsuario - ID del usuario
 * @returns {String|null} - Socket ID o null si no está conectado
 */
const obtenerSocketUsuario = (idUsuario) => {
  return usuariosConectados.get(idUsuario) || null;
};

/**
 * Verifica si un usuario está conectado
 * @param {String} idUsuario - ID del usuario
 * @returns {Boolean}
 */
const usuarioConectado = (idUsuario) => {
  return usuariosConectados.has(idUsuario);
};

/**
 * Emite evento a un usuario específico
 * @param {String} idUsuario - ID del usuario
 * @param {String} evento - Nombre del evento
 * @param {Object} datos - Datos a enviar
 */
const emitirAUsuario = (idUsuario, evento, datos) => {
  const socketId = usuariosConectados.get(idUsuario);
  if (socketId && io) {
    io.to(socketId).emit(evento, datos);
    return true;
  }
  return false;
};

/**
 * Emite evento a una sala
 * @param {String} sala - Nombre de la sala
 * @param {String} evento - Nombre del evento
 * @param {Object} datos - Datos a enviar
 */
const emitirASala = (sala, evento, datos) => {
  if (io) {
    io.to(sala).emit(evento, datos);
  }
};

module.exports = {
  inicializarSocket,
  obtenerIO,
  obtenerSocketUsuario,
  usuarioConectado,
  emitirAUsuario,
  emitirASala
};
