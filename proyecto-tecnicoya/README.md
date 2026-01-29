ñ# TécnicoYa - Plataforma de Servicios Técnicos

## 📱 Descripción

TécnicoYa es una aplicación móvil estilo Uber que conecta clientes con técnicos especializados (plomeros, electricistas, cerrajeros, etc.). Los clientes pueden solicitar servicios, recibir cotizaciones, y contratar técnicos cercanos de forma rápida y segura.

## 🛠️ Stack Tecnológico

- **Frontend:** Ionic 7 + Angular
- **Backend:** Node.js + Express
- **Base de Datos:** MongoDB Atlasñ
- **Almacenamiento de Imágenes:** Cloudinary
- **Mapas:** OpenStreetMap + Leaflet
- **Tiempo Real:** Socket.io

## 📁 Estructura del Proyecto

```
proyecto-tecnicoya/
├── backend/           # API REST con Node.js + Express
├── frontend/          # App móvil con Ionic + Angular
└── README.md          # Este archivo
```

## 🚀 Requisitos Previos

- Node.js v18 o superior
- npm v9 o superior
- Angular CLI v17
- Ionic CLI v7
- Cuenta de MongoDB Atlas
- Cuenta de Cloudinary
- Android Studio (para generar APK)

## ⚙️ Variables de Entorno

Copia el archivo `.env.example` a `.env` en la carpeta `backend/` y configura:

```env
MONGO_URI=tu_uri_de_mongodb_atlas
JWT_SECRETO=tu_clave_secreta_jwt
CLOUDINARY_NOMBRE_NUBE=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
PUERTO=3000
```

## 📦 Instalación

### Backend

```bash
cd backend
npm install
npm run desarrollo
```

### Frontend

```bash
cd frontend
npm install
ionic serve
```

## 📱 Generar APK Android

### APK de Debug

```bash
cd frontend
ionic build --prod
ionic cap sync android
cd android
./gradlew assembleDebug
```

## 👤 Credenciales de Prueba

### Cliente
- Email: `cliente1@test.com` | Contraseña: `123456`

### Técnico
- Email: `tecnico1@test.com` | Contraseña: `123456`

## 🌟 Features Innovadoras

1. **Sistema de Garantía Inteligente** - Protección al cliente con retención de pago
2. **Servicio de Emergencias 24/7** - Técnicos disponibles las 24 horas
3. **Programa de Fidelización** - Acumula puntos y obtén descuentos
4. **Técnico Inmediato** - Encuentra técnico al instante estilo Uber
5. **Chat en Tiempo Real** - Comunicación directa con Socket.io
