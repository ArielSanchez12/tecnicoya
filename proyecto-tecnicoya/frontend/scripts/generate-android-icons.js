/**
 * Script para generar iconos Android para TécnicoYa
 * Genera iconos con una llave de herramienta estilizada
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

// Color primario TécnicoYa
const primaryColor = { r: 56, g: 128, b: 255 }; // #3880ff
const whiteColor = { r: 255, g: 255, b: 255 };
const darkColor = { r: 25, g: 50, b: 100 };

// Crear un icono con diseño de herramienta/llave
function createTecnicoYaIcon(size) {
  const width = size;
  const height = size;
  const channels = 4;
  const rawData = Buffer.alloc(width * height * channels);

  const centerX = width / 2;
  const centerY = height / 2;
  const bgRadius = size * 0.45;
  const innerRadius = size * 0.35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      // Fondo circular azul
      if (dist <= bgRadius) {
        // Gradiente sutil
        const gradientFactor = 1 - (dist / bgRadius) * 0.3;
        
        // Dibujar una "T" estilizada (de TécnicoYa) o llave
        const relX = (x - centerX) / size;
        const relY = (y - centerY) / size;
        
        // Forma de llave inglesa simplificada
        const isWrenchHead = dist < size * 0.15;
        const isWrenchHandle = Math.abs(relX) < 0.06 && relY > 0 && relY < 0.3;
        const isWrenchTop = Math.abs(relY + 0.05) < 0.08 && Math.abs(relX) < 0.18;
        
        if (isWrenchHead || isWrenchHandle || isWrenchTop) {
          // Llave en blanco
          rawData[idx] = 255;
          rawData[idx + 1] = 255;
          rawData[idx + 2] = 255;
          rawData[idx + 3] = 255;
        } else {
          // Fondo azul con gradiente
          rawData[idx] = Math.round(primaryColor.r * gradientFactor);
          rawData[idx + 1] = Math.round(primaryColor.g * gradientFactor);
          rawData[idx + 2] = Math.round(primaryColor.b * gradientFactor);
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

// Crear icono foreground (para adaptive icons)
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
      const dist = Math.sqrt(relX * relX + relY * relY);
      
      // Llave inglesa más grande para foreground
      const isWrenchHead = dist < 0.12;
      const isWrenchHandle = Math.abs(relX) < 0.05 && relY > -0.05 && relY < 0.25;
      const isWrenchTop = Math.abs(relY + 0.02) < 0.07 && Math.abs(relX) < 0.15;
      
      if (isWrenchHead || isWrenchHandle || isWrenchTop) {
        // Llave en blanco
        rawData[idx] = 255;
        rawData[idx + 1] = 255;
        rawData[idx + 2] = 255;
        rawData[idx + 3] = 255;
      } else {
        // Transparente
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

console.log('🔧 Generando iconos Android para TécnicoYa...\n');

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

  // Foreground para adaptive icons (tamaño más grande)
  const fgSize = Math.round(size * 1.5);
  const fgBuffer = createForegroundIcon(fgSize);
  fs.writeFileSync(path.join(outputDir, 'ic_launcher_foreground.png'), fgBuffer);
  console.log(`✅ ${folder}/ic_launcher_foreground.png (${fgSize}x${fgSize})`);
});

console.log('\n🎉 ¡Todos los iconos Android han sido generados!');
console.log('📱 Los iconos están en: android/app/src/main/res/mipmap-*/');
