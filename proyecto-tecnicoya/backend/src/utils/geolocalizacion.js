/**
 * Utilidades de Geolocalización
 * TécnicoYa - Backend
 * Cálculo de distancias y búsquedas geoespaciales
 */

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @param {Number} lat1 - Latitud del punto 1
 * @param {Number} lon1 - Longitud del punto 1
 * @param {Number} lat2 - Latitud del punto 2
 * @param {Number} lon2 - Longitud del punto 2
 * @returns {Number} - Distancia en kilómetros
 */
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const radioTierra = 6371; // Radio de la Tierra en km

  const dLat = gradosARadianes(lat2 - lat1);
  const dLon = gradosARadianes(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(gradosARadianes(lat1)) * Math.cos(gradosARadianes(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = radioTierra * c;

  return Math.round(distancia * 100) / 100; // Redondear a 2 decimales
};

/**
 * Convierte grados a radianes
 * @param {Number} grados - Valor en grados
 * @returns {Number} - Valor en radianes
 */
const gradosARadianes = (grados) => {
  return grados * (Math.PI / 180);
};

/**
 * Calcula el tiempo estimado de llegada basado en distancia
 * @param {Number} distanciaKm - Distancia en kilómetros
 * @param {Number} velocidadPromedio - Velocidad promedio en km/h (default: 30)
 * @returns {Object} - Tiempo estimado en minutos y formato legible
 */
const calcularTiempoLlegada = (distanciaKm, velocidadPromedio = 30) => {
  const tiempoHoras = distanciaKm / velocidadPromedio;
  const tiempoMinutos = Math.round(tiempoHoras * 60);

  let formato;
  if (tiempoMinutos < 60) {
    formato = `${tiempoMinutos} min`;
  } else {
    const horas = Math.floor(tiempoMinutos / 60);
    const mins = tiempoMinutos % 60;
    formato = `${horas}h ${mins}min`;
  }

  return {
    minutos: tiempoMinutos,
    formato
  };
};

/**
 * Verifica si unas coordenadas están dentro de un radio específico
 * @param {Number} latCentro - Latitud del centro
 * @param {Number} lonCentro - Longitud del centro
 * @param {Number} latPunto - Latitud del punto a verificar
 * @param {Number} lonPunto - Longitud del punto a verificar
 * @param {Number} radioKm - Radio en kilómetros
 * @returns {Boolean} - true si está dentro del radio
 */
const estaDentroDeRadio = (latCentro, lonCentro, latPunto, lonPunto, radioKm) => {
  const distancia = calcularDistancia(latCentro, lonCentro, latPunto, lonPunto);
  return distancia <= radioKm;
};

/**
 * Genera una consulta de MongoDB para búsqueda geoespacial
 * @param {Array} coordenadas - [longitud, latitud]
 * @param {Number} radioKm - Radio de búsqueda en kilómetros
 * @returns {Object} - Consulta de MongoDB
 */
const generarConsultaGeoespacial = (coordenadas, radioKm = 10) => {
  return {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: coordenadas
      },
      $maxDistance: radioKm * 1000 // Convertir a metros
    }
  };
};

/**
 * Genera una consulta de agregación con $geoNear
 * @param {Array} coordenadas - [longitud, latitud]
 * @param {Number} radioKm - Radio máximo en kilómetros
 * @param {String} campoDistancia - Nombre del campo para la distancia calculada
 * @returns {Object} - Stage de agregación $geoNear
 */
const generarGeoNearStage = (coordenadas, radioKm = 10, campoDistancia = 'distancia') => {
  return {
    $geoNear: {
      near: {
        type: 'Point',
        coordinates: coordenadas
      },
      distanceField: campoDistancia,
      maxDistance: radioKm * 1000,
      spherical: true,
      distanceMultiplier: 0.001 // Convertir metros a km
    }
  };
};

/**
 * Ordena un array de objetos por distancia a un punto
 * @param {Array} items - Array de objetos con coordenadas
 * @param {Number} latRef - Latitud de referencia
 * @param {Number} lonRef - Longitud de referencia
 * @param {String} campoCoord - Ruta al campo de coordenadas (ej: 'perfil.direccion.coordenadas')
 * @returns {Array} - Array ordenado por distancia (más cercano primero)
 */
const ordenarPorDistancia = (items, latRef, lonRef, campoCoord = 'coordenadas') => {
  return items
    .map(item => {
      // Obtener coordenadas del objeto
      const coords = obtenerValorAnidado(item, campoCoord);
      let distancia = Infinity;

      if (coords && coords.coordinates && coords.coordinates.length === 2) {
        const [lon, lat] = coords.coordinates;
        distancia = calcularDistancia(latRef, lonRef, lat, lon);
      }

      return { ...item._doc || item, distancia };
    })
    .sort((a, b) => a.distancia - b.distancia);
};

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 * @param {Object} obj - Objeto
 * @param {String} ruta - Ruta al valor (ej: 'perfil.direccion.coordenadas')
 * @returns {*} - Valor encontrado o undefined
 */
const obtenerValorAnidado = (obj, ruta) => {
  return ruta.split('.').reduce((acc, parte) => acc && acc[parte], obj);
};

/**
 * Formatea una distancia para mostrar al usuario
 * @param {Number} distanciaKm - Distancia en kilómetros
 * @returns {String} - Distancia formateada
 */
const formatearDistancia = (distanciaKm) => {
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  }
  return `${distanciaKm.toFixed(1)} km`;
};

/**
 * Valida que las coordenadas sean válidas
 * @param {Number} latitud - Latitud
 * @param {Number} longitud - Longitud
 * @returns {Boolean} - true si son válidas
 */
const validarCoordenadas = (latitud, longitud) => {
  return (
    typeof latitud === 'number' &&
    typeof longitud === 'number' &&
    latitud >= -90 &&
    latitud <= 90 &&
    longitud >= -180 &&
    longitud <= 180
  );
};

/**
 * Convierte coordenadas de formato [lat, lon] a GeoJSON [lon, lat]
 * @param {Number} latitud - Latitud
 * @param {Number} longitud - Longitud
 * @returns {Object} - Objeto GeoJSON Point
 */
const crearPuntoGeoJSON = (latitud, longitud) => {
  return {
    type: 'Point',
    coordinates: [longitud, latitud] // GeoJSON usa [lon, lat]
  };
};

module.exports = {
  calcularDistancia,
  gradosARadianes,
  calcularTiempoLlegada,
  estaDentroDeRadio,
  generarConsultaGeoespacial,
  generarGeoNearStage,
  ordenarPorDistancia,
  formatearDistancia,
  validarCoordenadas,
  crearPuntoGeoJSON
};
