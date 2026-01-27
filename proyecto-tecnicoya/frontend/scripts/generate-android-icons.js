/**
 * Script para generar iconos Android para TécnicoYa
 * Genera iconos con una llave inglesa profesional
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Tamaños de iconos Android (mipmap)
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// Colores
const primaryBlue = { r: 56, g: 128, b: 255 };  // #3880ff
const darkBlue = { r: 30, g: 80, b: 180 };      // Sombra
const white = { r: 255, g: 255, b: 255 };

// Crear icono con llave inglesa profesional
function createTecnicoYaIcon(size) {
  const width = size;
  const height = size;
  const channels = 4;
  const rawData = Buffer.alloc(width * height * channels);

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = size * 0.42;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      // Fondo circular azul con gradiente
      if (dist <= radius) {
        const gradientFactor = 1 - (dist / radius) * 0.25;
        
        // Posición relativa normalizada
        const relX = (x - centerX) / size;
        const relY = (y - centerY) / size;
        
        // Dibujar llave inglesa profesional (forma de T con círculo)
        const isWrench = dibujarLlaveInglesa(relX, relY, size);
        
        if (isWrench) {
          // Llave en blanco
          rawData[idx] = 255;
          rawData[idx + 1] = 255;
          rawData[idx + 2] = 255;
          rawData[idx + 3] = 255;
        } else {
          // Fondo azul
          rawData[idx] = Math.round(primaryBlue.r * gradientFactor);
          rawData[idx + 1] = Math.round(primaryBlue.g * gradientFactor);
          rawData[idx + 2] = Math.round(primaryBlue.b * gradientFactor);
          rawData[idx + 3] = 255;
        }
      } else {
        // Transparente fuera del círculo
        rawData[idx] = 0;
        rawData[idx + 1] = 0;
        rawData[idx + 2] = 0;
        rawData[idx + 3] = 0;
      }
    }
  }

  return createPNGBuffer(width, height, rawData);
}

// Función para dibujar forma de llave inglesa
function dibujarLlaveInglesa(relX, relY, size) {
  // Rotar 45 grados para que la llave esté diagonal
  const angle = -Math.PI / 4;
  const rotX = relX * Math.cos(angle) - relY * Math.sin(angle);
  const rotY = relX * Math.sin(angle) + relY * Math.cos(angle);
  
  // Cabeza de la llave (hexágono/círculo con muesca)
  const headCenterY = -0.12;
  const headRadius = 0.11;
  const headDist = Math.sqrt(rotX * rotX + Math.pow(rotY - headCenterY, 2));
  
  // Muesca en la cabeza (para que parezca llave de tuercas)
  const notchWidth = 0.04;
  const isNotch = Math.abs(rotX) < notchWidth && rotY < headCenterY;
  
  const isHead = headDist < headRadius && !isNotch;
  
  // Mango de la llave (rectángulo)
  const handleWidth = 0.055;
  const handleStart = headCenterY + headRadius * 0.5;
  const handleEnd = 0.28;
  const isHandle = Math.abs(rotX) < handleWidth && rotY > handleStart && rotY < handleEnd;
  
  // Punta del mango (más ancha)
  const tipWidth = 0.08;
  const tipStart = 0.22;
  const tipEnd = 0.30;
  const isTip = Math.abs(rotX) < tipWidth && rotY > tipStart && rotY < tipEnd;
  
  return isHead || isHandle || isTip;
}

// Crear icono foreground para adaptive icons
function createForegroundIcon(size) {
  const width = size;
  const height = size;
  const channels = 4;
  const rawData = Buffer.alloc(width * height * channels);

  const centerX = width / 2;
  const centerY = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      
      const relX = (x - centerX) / size;
      const relY = (y - centerY) / size;
      
      const isWrench = dibujarLlaveInglesa(relX, relY, size);
      
      if (isWrench) {
        rawData[idx] = 255;
        rawData[idx + 1] = 255;
        rawData[idx + 2] = 255;
        rawData[idx + 3] = 255;
      } else {
        rawData[idx] = 0;
        rawData[idx + 1] = 0;
        rawData[idx + 2] = 0;
        rawData[idx + 3] = 0;
      }
    }
  }

  return createPNGBuffer(width, height, rawData);
}

// Crear buffer PNG válido
function createPNGBuffer(width, height, rawData) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = createChunk('IHDR', ihdrData);

  const filteredData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    filteredData[y * (width * 4 + 1)] = 0;
    rawData.copy(
      filteredData,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4
    );
  }

  const compressed = zlib.deflateSync(filteredData, { level: 9 });
  const idat = createChunk('IDAT', compressed);
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

const crcTable = (function () {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// Generar iconos
const androidDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

console.log('🔧 Generando iconos Android para TécnicoYa...');
console.log('   Diseño: Llave inglesa diagonal sobre fondo azul\n');

Object.entries(androidSizes).forEach(([folder, size]) => {
  const outputDir = path.join(androidDir, folder);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Icono launcher normal
  const iconBuffer = createTecnicoYaIcon(size);
  fs.writeFileSync(path.join(outputDir, 'ic_launcher.png'), iconBuffer);
  console.log(`✅ ${folder}/ic_launcher.png (${size}x${size})`);

  // Icono round
  fs.writeFileSync(path.join(outputDir, 'ic_launcher_round.png'), iconBuffer);
  console.log(`✅ ${folder}/ic_launcher_round.png (${size}x${size})`);

  // Foreground para adaptive icons
  const fgSize = Math.round(size * 1.5);
  const fgBuffer = createForegroundIcon(fgSize);
  fs.writeFileSync(path.join(outputDir, 'ic_launcher_foreground.png'), fgBuffer);
  console.log(`✅ ${folder}/ic_launcher_foreground.png (${fgSize}x${fgSize})`);
});

console.log('\n🎉 ¡Iconos generados con éxito!');
console.log('📱 Ubicación: android/app/src/main/res/mipmap-*/');
console.log('🔧 Diseño: Llave inglesa blanca sobre fondo azul #3880FF');
