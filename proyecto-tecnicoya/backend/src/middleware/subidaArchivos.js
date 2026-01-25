/**
 * Middleware de Subida de Archivos
 * TécnicoYa - Backend
 * Maneja la subida de imágenes con Multer y Cloudinary
 */

const multer = require('multer');
const { subirImagen, CARPETAS } = require('../config/cloudinary');

// Configuración de Multer para almacenamiento en memoria
const almacenamiento = multer.memoryStorage();

// Filtro para aceptar solo imágenes
const filtroArchivos = (req, archivo, callback) => {
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (tiposPermitidos.includes(archivo.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error('Tipo de archivo no permitido. Solo se aceptan imágenes (JPEG, PNG, GIF, WebP).'), false);
  }
};

// Configuración base de Multer
const configuracionMulter = multer({
  storage: almacenamiento,
  fileFilter: filtroArchivos,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 10 // Máximo 10 archivos a la vez
  }
});

/**
 * Middleware para subir una sola imagen
 * @param {String} nombreCampo - Nombre del campo en el formulario
 */
const subirUnaImagen = (nombreCampo) => configuracionMulter.single(nombreCampo);

/**
 * Middleware para subir múltiples imágenes
 * @param {String} nombreCampo - Nombre del campo en el formulario
 * @param {Number} maximo - Número máximo de archivos
 */
const subirVariasImagenes = (nombreCampo, maximo = 5) => configuracionMulter.array(nombreCampo, maximo);

/**
 * Middleware para subir campos mixtos
 * @param {Array} campos - Array de configuraciones { name, maxCount }
 */
const subirCamposMixtos = (campos) => configuracionMulter.fields(campos);

/**
 * Middleware que procesa y sube a Cloudinary después de Multer
 * @param {String} carpeta - Carpeta de destino en Cloudinary
 */
const procesarYSubirACloudinary = (carpeta = CARPETAS.GENERAL) => {
  return async (req, res, siguiente) => {
    try {
      // Si hay un solo archivo
      if (req.file) {
        const resultado = await subirImagen(req.file.buffer, carpeta);
        req.archivoSubido = {
          url: resultado.secure_url,
          publicId: resultado.public_id,
          ancho: resultado.width,
          alto: resultado.height,
          formato: resultado.format
        };
      }

      // Si hay múltiples archivos
      if (req.files) {
        // Si es un array (de .array())
        if (Array.isArray(req.files)) {
          const promesas = req.files.map(archivo =>
            subirImagen(archivo.buffer, carpeta)
          );
          const resultados = await Promise.all(promesas);
          req.archivosSubidos = resultados.map(r => ({
            url: r.secure_url,
            publicId: r.public_id,
            ancho: r.width,
            alto: r.height,
            formato: r.format
          }));
        }
        // Si es un objeto (de .fields())
        else {
          req.archivosSubidos = {};
          for (const [campo, archivos] of Object.entries(req.files)) {
            const promesas = archivos.map(archivo =>
              subirImagen(archivo.buffer, carpeta)
            );
            const resultados = await Promise.all(promesas);
            req.archivosSubidos[campo] = resultados.map(r => ({
              url: r.secure_url,
              publicId: r.public_id,
              ancho: r.width,
              alto: r.height,
              formato: r.format
            }));
          }
        }
      }

      siguiente();
    } catch (error) {
      console.error('❌ Error al subir a Cloudinary:', error.message);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error al procesar las imágenes.',
        error: error.message
      });
    }
  };
};

/**
 * Middleware combinado: Multer + Cloudinary para una imagen
 * @param {String} nombreCampo - Nombre del campo
 * @param {String} carpeta - Carpeta en Cloudinary
 */
const subirImagenACloudinary = (nombreCampo, carpeta) => {
  return [
    subirUnaImagen(nombreCampo),
    procesarYSubirACloudinary(carpeta)
  ];
};

/**
 * Middleware combinado: Multer + Cloudinary para múltiples imágenes
 * @param {String} nombreCampo - Nombre del campo
 * @param {Number} maximo - Número máximo
 * @param {String} carpeta - Carpeta en Cloudinary
 */
const subirImagenesACloudinary = (nombreCampo, maximo, carpeta) => {
  return [
    subirVariasImagenes(nombreCampo, maximo),
    procesarYSubirACloudinary(carpeta)
  ];
};

/**
 * Manejo de errores de Multer
 */
const manejarErrorMulter = (error, req, res, siguiente) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        exito: false,
        mensaje: 'El archivo es demasiado grande. Máximo 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Demasiados archivos. Máximo 10.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Campo de archivo inesperado.'
      });
    }
  }

  if (error.message.includes('Tipo de archivo')) {
    return res.status(400).json({
      exito: false,
      mensaje: error.message
    });
  }

  siguiente(error);
};

module.exports = {
  subirUnaImagen,
  subirVariasImagenes,
  subirCamposMixtos,
  procesarYSubirACloudinary,
  subirImagenACloudinary,
  subirImagenesACloudinary,
  manejarErrorMulter,
  CARPETAS
};
