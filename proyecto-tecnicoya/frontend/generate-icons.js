/**
 * Script para generar iconos PNG básicos para el manifest
 * Crea iconos azules simples con el color primario de TécnicoYa
 */

const fs = require('fs');
const path = require('path');

// Crear un PNG simple (azul sólido) sin dependencias externas
// Formato PNG mínimo con color sólido
function createSimplePNG(size, color = { r: 56, g: 128, b: 255 }) {
  // Crear imagen raw RGBA
  const width = size;
  const height = size;
  const channels = 4; // RGBA
  const rawData = Buffer.alloc(width * height * channels);

  // Llenar con color azul (primario de TécnicoYa #3880ff)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;

      // Crear un círculo en el centro
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = size * 0.4;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

      if (dist <= radius) {
        // Dentro del círculo - color primario
        rawData[idx] = color.r;     // R
        rawData[idx + 1] = color.g; // G
        rawData[idx + 2] = color.b; // B
        rawData[idx + 3] = 255;     // A
      } else {
        // Fuera del círculo - blanco
        rawData[idx] = 255;     // R
        rawData[idx + 1] = 255; // G
        rawData[idx + 2] = 255; // B
        rawData[idx + 3] = 255; // A
      }
    }
  }

  return createPNGBuffer(width, height, rawData);
}

// Crear buffer PNG válido
function createPNGBuffer(width, height, rawData) {
  const zlib = require('zlib');

  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createChunk('IHDR', ihdrData);

  // IDAT chunk (image data)
  // Add filter byte (0) before each row
  const filteredData = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    filteredData[y * (width * 4 + 1)] = 0; // filter none
    rawData.copy(
      filteredData,
      y * (width * 4 + 1) + 1,
      y * width * 4,
      (y + 1) * width * 4
    );
  }

  const compressed = zlib.deflateSync(filteredData, { level: 9 });
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
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

// CRC32 table
const crcTable = (function () {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
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
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, 'src', 'assets', 'icon');

// Asegurar que el directorio existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generando iconos PNG para TécnicoYa...');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);

  const pngBuffer = createSimplePNG(size);
  fs.writeFileSync(filepath, pngBuffer);

  console.log(`✅ Creado: ${filename} (${pngBuffer.length} bytes)`);
});

console.log('\n¡Todos los iconos han sido generados!');
