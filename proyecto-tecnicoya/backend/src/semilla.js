/**
 * Script de Semilla (Seed)
 * TécnicoYa - Backend
 * Genera datos de prueba para desarrollo
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Modelos
const Usuario = require('./models/Usuario');
const Servicio = require('./models/Servicio');
const Cotizacion = require('./models/Cotizacion');
const Trabajo = require('./models/Trabajo');
const Resena = require('./models/Resena');
const Mensaje = require('./models/Mensaje');

// Configuración
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tecnicoya';

// ===== DATOS DE PRUEBA =====

const contrasenaHash = bcrypt.hashSync('123456', 10);

// Clientes de prueba - estructura correcta según el modelo
const clientes = [
  {
    email: 'carlos@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'cliente',
    perfil: {
      nombre: 'Carlos',
      apellido: 'Mendoza',
      telefono: '0991234567',
      fotoUrl: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=random',
      direccion: {
        calle: 'Av. Amazonas N35-17',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Cerca del parque La Carolina',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.4833, -0.1807]
        }
      }
    },
    puntosLealtad: 250,
    activo: true
  },
  {
    email: 'maria@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'cliente',
    perfil: {
      nombre: 'María',
      apellido: 'González',
      telefono: '0987654321',
      fotoUrl: 'https://ui-avatars.com/api/?name=Maria+Gonzalez&background=random',
      direccion: {
        calle: 'Av. 6 de Diciembre N45-10',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Centro Histórico',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.4678, -0.2035]
        }
      }
    },
    puntosLealtad: 100,
    activo: true
  },
  {
    email: 'roberto@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'cliente',
    perfil: {
      nombre: 'Roberto',
      apellido: 'Sánchez',
      telefono: '0998765432',
      fotoUrl: 'https://ui-avatars.com/api/?name=Roberto+Sanchez&background=random',
      direccion: {
        calle: 'Av. Naciones Unidas E5-123',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Cerca del Quicentro',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.4822, -0.1695]
        }
      }
    },
    puntosLealtad: 500,
    activo: true
  }
];

// Técnicos de prueba - estructura correcta según el modelo
const tecnicos = [
  {
    email: 'juan.plomero@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'tecnico',
    perfil: {
      nombre: 'Juan',
      apellido: 'Hernández',
      telefono: '0991112222',
      fotoUrl: 'https://ui-avatars.com/api/?name=Juan+Hernandez&background=0D47A1&color=fff',
      direccion: {
        calle: 'Av. República E7-123',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Sector La Pradera',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.4911, -0.1856]
        }
      }
    },
    datosTecnico: {
      especialidades: ['plomeria'],
      tarifaPorHora: 15,
      descripcion: 'Plomero profesional con 8 años de experiencia. Especializado en reparaciones de emergencia, instalación de tuberías y mantenimiento de sistemas hidráulicos.',
      verificado: true,
      calificacion: 4.8,
      totalResenas: 45,
      trabajosCompletados: 156,
      disponibleEmergencias: true,
      disponibleAhora: true,
      zonasCobertura: [
        { nombre: 'La Carolina', radio: 10 },
        { nombre: 'La Mariscal', radio: 8 }
      ]
    },
    puntosLealtad: 1200,
    activo: true
  },
  {
    email: 'ana.electricista@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'tecnico',
    perfil: {
      nombre: 'Ana',
      apellido: 'Martínez',
      telefono: '0992223333',
      fotoUrl: 'https://ui-avatars.com/api/?name=Ana+Martinez&background=F57C00&color=fff',
      direccion: {
        calle: 'Av. Colón E4-56',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Cerca de la Plaza Foch',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.4934, -0.2067]
        }
      }
    },
    datosTecnico: {
      especialidades: ['electricidad'],
      tarifaPorHora: 18,
      descripcion: 'Electricista certificada con más de 12 años de experiencia. Instalaciones residenciales y comerciales, reparación de fallas eléctricas.',
      verificado: true,
      calificacion: 4.9,
      totalResenas: 67,
      trabajosCompletados: 234,
      disponibleEmergencias: true,
      disponibleAhora: true,
      zonasCobertura: [
        { nombre: 'La Mariscal', radio: 12 },
        { nombre: 'González Suárez', radio: 10 }
      ]
    },
    puntosLealtad: 1800,
    activo: true
  },
  {
    email: 'pedro.cerrajero@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'tecnico',
    perfil: {
      nombre: 'Pedro',
      apellido: 'García',
      telefono: '0993334444',
      fotoUrl: 'https://ui-avatars.com/api/?name=Pedro+Garcia&background=388E3C&color=fff',
      direccion: {
        calle: 'Av. 10 de Agosto N25-45',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Sector El Ejido',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.5011, -0.2134]
        }
      }
    },
    datosTecnico: {
      especialidades: ['cerrajeria'],
      tarifaPorHora: 12,
      descripcion: 'Cerrajero 24/7. Apertura de puertas, cambio de chapas, cerraduras de alta seguridad. Servicio de emergencia disponible.',
      verificado: true,
      calificacion: 4.7,
      totalResenas: 32,
      trabajosCompletados: 89,
      disponibleEmergencias: true,
      disponibleAhora: true,
      zonasCobertura: [
        { nombre: 'Centro Norte', radio: 15 },
        { nombre: 'El Ejido', radio: 10 }
      ]
    },
    puntosLealtad: 600,
    activo: true
  },
  {
    email: 'luis.clima@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'tecnico',
    perfil: {
      nombre: 'Luis',
      apellido: 'Rodríguez',
      telefono: '0994445555',
      fotoUrl: 'https://ui-avatars.com/api/?name=Luis+Rodriguez&background=7B1FA2&color=fff',
      direccion: {
        calle: 'Av. De los Shyris N34-12',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Cerca del Estadio Olímpico',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.4756, -0.1723]
        }
      }
    },
    datosTecnico: {
      especialidades: ['aire_acondicionado', 'refrigeracion'],
      tarifaPorHora: 20,
      descripcion: 'Especialista en aires acondicionados y refrigeración. Instalación, mantenimiento y reparación de equipos de todas las marcas.',
      verificado: true,
      calificacion: 4.6,
      totalResenas: 28,
      trabajosCompletados: 78,
      disponibleEmergencias: false,
      disponibleAhora: true,
      zonasCobertura: [
        { nombre: 'Iñaquito', radio: 12 },
        { nombre: 'Bellavista', radio: 15 }
      ]
    },
    puntosLealtad: 450,
    activo: true
  },
  {
    email: 'sofia.pintora@ejemplo.com',
    contrasena: contrasenaHash,
    rol: 'tecnico',
    perfil: {
      nombre: 'Sofía',
      apellido: 'López',
      telefono: '0995556666',
      fotoUrl: 'https://ui-avatars.com/api/?name=Sofia+Lopez&background=C2185B&color=fff',
      direccion: {
        calle: 'Av. Eloy Alfaro N45-67',
        ciudad: 'Quito',
        estado: 'Pichincha',
        referencia: 'Sector La Floresta',
        coordenadas: {
          type: 'Point',
          coordinates: [-78.4678, -0.1945]
        }
      }
    },
    datosTecnico: {
      especialidades: ['pintura'],
      tarifaPorHora: 10,
      descripcion: 'Pintora profesional. Interiores y exteriores, acabados decorativos, impermeabilización. Trabajo limpio y puntual.',
      verificado: true,
      calificacion: 4.9,
      totalResenas: 41,
      trabajosCompletados: 112,
      disponibleEmergencias: false,
      disponibleAhora: false,
      zonasCobertura: [
        { nombre: 'La Floresta', radio: 10 },
        { nombre: 'Guápulo', radio: 8 }
      ]
    },
    puntosLealtad: 890,
    activo: true
  }
];

// ===== FUNCIÓN PRINCIPAL =====

async function ejecutarSemilla() {
  try {
    // Conectar a MongoDB
    console.log('🌱 Iniciando script de semilla...\n');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Limpiar colecciones
    console.log('🗑️  Limpiando colecciones...');
    await Promise.all([
      Usuario.deleteMany({}),
      Servicio.deleteMany({}),
      Cotizacion.deleteMany({}),
      Trabajo.deleteMany({}),
      Resena.deleteMany({}),
      Mensaje.deleteMany({})
    ]);
    console.log('✅ Colecciones limpiadas\n');

    // Insertar clientes
    console.log('👤 Insertando clientes...');
    const clientesCreados = await Usuario.insertMany(clientes);
    console.log(`   ✅ ${clientesCreados.length} clientes creados`);

    // Insertar técnicos
    console.log('🔧 Insertando técnicos...');
    const tecnicosCreados = await Usuario.insertMany(tecnicos);
    console.log(`   ✅ ${tecnicosCreados.length} técnicos creados`);

    // Crear algunos servicios de ejemplo
    console.log('📋 Creando servicios de ejemplo...');
    const serviciosEjemplo = [
      {
        idCliente: clientesCreados[0]._id,
        tipo: 'plomeria',
        titulo: 'Fuga de agua en baño',
        descripcion: 'Tengo una fuga de agua debajo del lavabo del baño principal. El agua sale constantemente.',
        ubicacion: {
          direccion: 'Av. Reforma 123, CDMX',
          coordenadas: {
            type: 'Point',
            coordinates: [-99.1676, 19.4275]
          }
        },
        urgencia: 'normal',
        estado: 'pendiente',
        presupuestoEstimado: { min: 300, max: 600 }
      },
      {
        idCliente: clientesCreados[1]._id,
        tipo: 'electricidad',
        titulo: 'Instalación de contactos',
        descripcion: 'Necesito instalar 3 contactos nuevos en la sala y 2 en la recámara principal.',
        ubicacion: {
          direccion: 'Calle Madero 456, CDMX',
          coordenadas: {
            type: 'Point',
            coordinates: [-99.1405, 19.4320]
          }
        },
        urgencia: 'normal',
        estado: 'pendiente',
        presupuestoEstimado: { min: 500, max: 1000 }
      },
      {
        idCliente: clientesCreados[2]._id,
        tipo: 'cerrajeria',
        titulo: 'Cambio de chapa principal',
        descripcion: 'La chapa de la puerta principal está muy vieja y quiero cambiarla por una de mayor seguridad.',
        ubicacion: {
          direccion: 'Insurgentes Sur 789, CDMX',
          coordenadas: {
            type: 'Point',
            coordinates: [-99.1729, 19.3928]
          }
        },
        urgencia: 'normal',
        estado: 'pendiente',
        presupuestoEstimado: { min: 800, max: 1500 }
      }
    ];

    const serviciosCreados = await Servicio.insertMany(serviciosEjemplo);
    console.log(`   ✅ ${serviciosCreados.length} servicios creados\n`);

    // Resumen final
    console.log('═══════════════════════════════════════════');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 Resumen:`);
    console.log(`   👤 Clientes creados: ${clientesCreados.length}`);
    console.log(`   🔧 Técnicos creados: ${tecnicosCreados.length}`);
    console.log(`   📋 Servicios creados: ${serviciosCreados.length}`);
    console.log('');
    console.log('🔐 Credenciales de prueba:');
    console.log('   Clientes:');
    console.log('     - carlos@ejemplo.com / 123456');
    console.log('     - maria@ejemplo.com / 123456');
    console.log('     - roberto@ejemplo.com / 123456');
    console.log('   Técnicos:');
    console.log('     - juan.plomero@ejemplo.com / 123456');
    console.log('     - ana.electricista@ejemplo.com / 123456');
    console.log('     - pedro.cerrajero@ejemplo.com / 123456');
    console.log('     - luis.clima@ejemplo.com / 123456');
    console.log('     - sofia.pintora@ejemplo.com / 123456');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error en script de semilla:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(campo => {
        console.error(`   - ${campo}: ${error.errors[campo].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('👋 Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar
ejecutarSemilla();
