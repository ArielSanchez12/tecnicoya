# Backend TécnicoYa - API REST

## 📋 Descripción

API REST desarrollada con Node.js y Express para la plataforma TécnicoYa. Gestiona usuarios, servicios, cotizaciones, trabajos y reseñas.

## 🏗️ Estructura

```
backend/
├── src/
│   ├── config/
│   │   ├── basedatos.js       # Conexión MongoDB Atlas
│   │   ├── cloudinary.js      # Configuración Cloudinary
│   │   └── socket.js          # Configuración Socket.io
│   ├── middleware/
│   │   ├── autenticacion.js   # Verificación JWT
│   │   └── subidaArchivos.js  # Multer + Cloudinary
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Servicio.js
│   │   ├── Cotizacion.js
│   │   ├── Trabajo.js
│   │   ├── Resena.js
│   │   └── Mensaje.js
│   ├── routes/
│   │   ├── auth.rutas.js
│   │   ├── usuarios.rutas.js
│   │   ├── servicios.rutas.js
│   │   ├── cotizaciones.rutas.js
│   │   ├── trabajos.rutas.js
│   │   ├── resenas.rutas.js
│   │   └── fidelizacion.rutas.js
│   ├── controllers/
│   │   ├── authControlador.js
│   │   ├── usuarioControlador.js
│   │   ├── servicioControlador.js
│   │   ├── cotizacionControlador.js
│   │   ├── trabajoControlador.js
│   │   ├── resenaControlador.js
│   │   └── fidelizacionControlador.js
│   ├── utils/
│   │   ├── geolocalizacion.js # Cálculo de distancias
│   │   ├── notificaciones.js  # Socket.io
│   │   ├── precios.js         # Cálculo comisiones
│   │   └── semilla.js         # Datos de prueba
│   └── servidor.js            # Punto de entrada
├── .env.example
├── package.json
└── README.md
```

## 🔌 Endpoints API

### Autenticación (`/api/auth`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/registro` | Registrar usuario (cliente/técnico) |
| POST | `/login` | Iniciar sesión |
| GET | `/perfil` | Obtener perfil del usuario autenticado |

### Usuarios (`/api/usuarios`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/tecnicos` | Obtener técnicos cercanos |
| GET | `/:id` | Obtener usuario por ID |
| PUT | `/perfil` | Actualizar perfil |
| POST | `/foto` | Subir foto de perfil |

### Servicios (`/api/servicios`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/` | Crear solicitud de servicio |
| GET | `/` | Obtener mis solicitudes |
| GET | `/:id` | Obtener servicio por ID |
| POST | `/instantaneo` | Solicitar técnico inmediato |

### Cotizaciones (`/api/cotizaciones`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/` | Enviar cotización (técnico) |
| GET | `/servicio/:id` | Obtener cotizaciones de un servicio |
| PUT | `/:id/aceptar` | Aceptar cotización |
| PUT | `/:id/rechazar` | Rechazar cotización |

### Trabajos (`/api/trabajos`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Obtener mis trabajos |
| GET | `/:id` | Obtener trabajo por ID |
| PUT | `/:id/estado` | Actualizar estado |
| POST | `/:id/fotos/antes` | Subir fotos antes |
| POST | `/:id/fotos/despues` | Subir fotos después |
| PUT | `/:id/aprobar` | Aprobar trabajo (garantía) |
| POST | `/:id/disputa` | Abrir disputa |

### Reseñas (`/api/resenas`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/` | Crear reseña |
| GET | `/tecnico/:id` | Obtener reseñas de técnico |
| GET | `/estadisticas/:id` | Obtener estadísticas |

### Fidelización (`/api/fidelizacion`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/puntos` | Obtener puntos actuales |
| POST | `/canjear` | Canjear puntos |
| GET | `/historial` | Historial de transacciones |

## 📊 Diagrama de Colecciones MongoDB

```
┌─────────────────┐     ┌─────────────────┐
│    Usuarios     │     │    Servicios    │
├─────────────────┤     ├─────────────────┤
│ _id             │────<│ idCliente       │
│ email           │     │ tipo            │
│ contraseña      │     │ descripcion     │
│ rol             │     │ fotos[]         │
│ perfil{}        │     │ ubicacion{}     │
│ datosTecnico{}  │     │ urgencia        │
│ puntosLealtad   │     │ estado          │
└─────────────────┘     └─────────────────┘
         │                      │
         │              ┌───────┴───────┐
         │              │               │
         ▼              ▼               │
┌─────────────────┐  ┌─────────────────┐│
│   Cotizaciones  │  │    Trabajos     ││
├─────────────────┤  ├─────────────────┤│
│ _id             │  │ _id             ││
│ idServicio      │─>│ idServicio      │┘
│ idTecnico       │  │ idCotizacion    │
│ precio          │  │ idCliente       │
│ tiempoEstimado  │  │ idTecnico       │
│ materiales      │  │ fechaProgramada │
│ estado          │  │ estado          │
└─────────────────┘  │ fotosAntes[]    │
                     │ fotosDespues[]  │
                     │ pago{}          │
                     └─────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────┐                    ┌─────────────────┐
│     Reseñas     │                    │    Mensajes     │
├─────────────────┤                    ├─────────────────┤
│ _id             │                    │ _id             │
│ idTrabajo       │                    │ idTrabajo       │
│ idResenador     │                    │ idEmisor        │
│ idResenado      │                    │ contenido       │
│ calificacion    │                    │ fechaEnvio      │
│ comentario      │                    │ leido           │
│ fotos[]         │                    └─────────────────┘
└─────────────────┘
```

## 🔐 Flujo de Autenticación

1. Usuario envía credenciales a `/api/auth/login`
2. Backend valida credenciales con bcrypt
3. Si son válidas, genera JWT con id y rol del usuario
4. Frontend almacena el token
5. En cada petición protegida, envía el token en header `Authorization: Bearer <token>`
6. Middleware `autenticacion.js` verifica el token
7. Si es válido, añade `req.usuario` con los datos decodificados

## 🚀 Comandos

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo (con nodemon)
npm run desarrollo

# Ejecutar en producción
npm run inicio

# Poblar base de datos con datos de prueba
npm run semilla
```

## 📡 Eventos Socket.io

| Evento | Emisor | Descripción |
|--------|--------|-------------|
| `nueva_cotizacion` | Técnico | Notifica al cliente de nueva cotización |
| `cotizacion_aceptada` | Cliente | Notifica al técnico que fue aceptado |
| `estado_actualizado` | Técnico | Notifica cambio de estado del trabajo |
| `unirse_chat` | Ambos | Conectar a sala de chat del trabajo |
| `enviar_mensaje` | Ambos | Enviar mensaje de chat |
| `recibir_mensaje` | Servidor | Broadcast de mensaje recibido |
| `escribiendo` | Ambos | Indicador de "escribiendo..." |
