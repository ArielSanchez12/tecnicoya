/**
 * Script para actualizar el técnico existente
 * Ejecutar con: node src/actualizarTecnico.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');

const actualizarTecnico = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // ID del técnico a actualizar
    const tecnicoId = '696ed9e03bcc285db5e8c583';

    // Buscar el técnico
    const tecnico = await Usuario.findById(tecnicoId);

    if (!tecnico) {
      console.log('❌ Técnico no encontrado');
      process.exit(1);
    }

    console.log('\n📋 Datos actuales del técnico:');
    console.log(`  - Nombre: ${tecnico.perfil.nombre} ${tecnico.perfil.apellido}`);
    console.log(`  - radioTrabajo: ${tecnico.datosTecnico.radioTrabajo}`);
    console.log(`  - radioExtendido (membresía): ${tecnico.datosTecnico.membresia?.radioExtendido}`);
    console.log(`  - emergencia24h: ${tecnico.datosTecnico.emergencia24h}`);
    console.log(`  - disponibleEmergencias: ${tecnico.datosTecnico.disponibleEmergencias}`);
    console.log(`  - tipo membresía: ${tecnico.datosTecnico.membresia?.tipo}`);

    // Actualizar los valores
    const actualizacion = await Usuario.findByIdAndUpdate(
      tecnicoId,
      {
        $set: {
          // Actualizar radioTrabajo al nuevo default base
          'datosTecnico.radioTrabajo': 15,
          // El radioExtendido debería ser 35 para premium (15 base + 35 = 50 total)
          'datosTecnico.membresia.radioExtendido': 35,
          // Eliminar el campo obsoleto disponibleEmergencias
          // Y asegurarse de que emergencia24h refleje el valor correcto
        },
        $unset: {
          // Eliminar campos obsoletos
          'datosTecnico.disponibleEmergencias': '',
          'datosTecnico.tarifaPorHora': '',
          'puntosLealtad': '',
          'historialPuntos': ''
        }
      },
      { new: true }
    );

    console.log('\n✅ Técnico actualizado:');
    console.log(`  - radioTrabajo: ${actualizacion.datosTecnico.radioTrabajo}`);
    console.log(`  - radioExtendido (membresía): ${actualizacion.datosTecnico.membresia?.radioExtendido}`);
    console.log(`  - Radio total efectivo: ${actualizacion.datosTecnico.radioTrabajo + (actualizacion.datosTecnico.membresia?.radioExtendido || 0)} km`);
    console.log(`  - emergencia24h: ${actualizacion.datosTecnico.emergencia24h}`);

    // Verificar campos eliminados
    console.log('\n📋 Verificación de campos eliminados:');
    console.log(`  - disponibleEmergencias: ${actualizacion.datosTecnico.disponibleEmergencias || 'ELIMINADO ✓'}`);
    console.log(`  - tarifaPorHora: ${actualizacion.datosTecnico.tarifaPorHora || 'ELIMINADO ✓'}`);
    console.log(`  - puntosLealtad: ${actualizacion.puntosLealtad || 'ELIMINADO ✓'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

actualizarTecnico();
