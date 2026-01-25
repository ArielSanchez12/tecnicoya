/**
 * Configuración de Cloudinary
 * TécnicoYa - Backend
 * Manejo de subida de imágenes (fotos de perfil, certificaciones, trabajos)
 */

const cloudinary = require('cloudinary').v2;

const configurarCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NOMBRE_NUBE,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('☁️ Cloudinary configurado correctamente');

  return cloudinary;
};

/**
 * Sube una imagen a Cloudinary
 * @param {Buffer|String} archivo - Buffer del archivo o path local
 * @param {String} carpeta - Carpeta en Cloudinary (ej: 'perfiles', 'trabajos')
 * @param {Object} opciones - Opciones adicionales de transformación
 * @returns {Promise<Object>} - Resultado de la subida
 */
const subirImagen = async (archivo, carpeta = 'general', opciones = {}) => {
  try {
    const opcionesPorDefecto = {
      folder: `tecnicoya/${carpeta}`,
      resource_type: 'image',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }, // Limitar tamaño máximo
        { quality: 'auto:good' }, // Compresión automática
        { fetch_format: 'auto' } // Formato óptimo (webp si es soportado)
      ],
      ...opciones
    };

    // Si es un buffer, usar upload_stream
    if (Buffer.isBuffer(archivo)) {
      return new Promise((resolve, reject) => {
        const streamSubida = cloudinary.uploader.upload_stream(
          opcionesPorDefecto,
          (error, resultado) => {
            if (error) reject(error);
            else resolve(resultado);
          }
        );

        const streamifier = require('streamifier');
        streamifier.createReadStream(archivo).pipe(streamSubida);
      });
    }

    // Si es una URL o path
    const resultado = await cloudinary.uploader.upload(archivo, opcionesPorDefecto);
    return resultado;
  } catch (error) {
    console.error('❌ Error al subir imagen a Cloudinary:', error.message);
    throw error;
  }
};

/**
 * Elimina una imagen de Cloudinary
 * @param {String} publicId - ID público de la imagen
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
const eliminarImagen = async (publicId) => {
  try {
    const resultado = await cloudinary.uploader.destroy(publicId);
    return resultado;
  } catch (error) {
    console.error('❌ Error al eliminar imagen de Cloudinary:', error.message);
    throw error;
  }
};

/**
 * Extrae el public_id de una URL de Cloudinary
 * @param {String} url - URL completa de Cloudinary
 * @returns {String} - Public ID
 */
const extraerPublicId = (url) => {
  if (!url) return null;

  // URL típica: https://res.cloudinary.com/cloud_name/image/upload/v123/tecnicoya/carpeta/archivo.jpg
  const partes = url.split('/');
  const indiceUpload = partes.indexOf('upload');

  if (indiceUpload === -1) return null;

  // El public_id está después de 'upload' y la versión
  const partesId = partes.slice(indiceUpload + 2);
  const publicId = partesId.join('/').replace(/\.[^/.]+$/, ''); // Quitar extensión

  return publicId;
};

// Carpetas predefinidas para organización
const CARPETAS = {
  PERFILES: 'perfiles',
  CERTIFICACIONES: 'certificaciones',
  SERVICIOS: 'servicios',
  TRABAJOS_ANTES: 'trabajos/antes',
  TRABAJOS_DESPUES: 'trabajos/despues',
  RESENAS: 'resenas',
  PORTAFOLIO: 'portafolio'
};

module.exports = {
  configurarCloudinary,
  subirImagen,
  eliminarImagen,
  extraerPublicId,
  CARPETAS,
  cloudinary
};
