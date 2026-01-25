/**
 * Modelos/Interfaces TypeScript
 * TécnicoYa - Frontend
 */

// ===== USUARIO =====

export interface Usuario {
  _id: string;
  nombre?: string;
  apellido?: string;
  email: string;
  telefono?: string;
  rol: 'cliente' | 'tecnico';
  tipo?: 'cliente' | 'tecnico';
  perfil: Perfil;
  ubicacion?: Coordenadas;
  ubicacionActual?: Coordenadas;
  datosTecnico?: DatosTecnico;
  puntosLealtad: PuntosLealtad | number;
  estado: 'activo' | 'suspendido' | 'eliminado';
  activo?: boolean;
  fechaRegistro: string;
  ultimaConexion: string;
}

export interface Perfil {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  fotoUrl?: string;
  fotoPerfil?: string; // Alias para compatibilidad
  direccion?: Direccion;
  fechaNacimiento?: string;
}

export interface Direccion {
  calle?: string;
  ciudad?: string;
  estado?: string;
  pais?: string;
  referencia?: string;
  // NOTA: Las coordenadas NO se guardan en el perfil por privacidad
  // Los clientes proporcionan coordenadas solo en solicitudes de servicio
  // Los técnicos tienen su ubicación en datosTecnico.ubicacionBase
}

export interface DatosTecnico {
  especialidades?: TipoServicio[];
  experiencia?: number;
  descripcion?: string;
  certificaciones?: Certificacion[];
  portafolio?: FotoPortafolio[];
  disponibilidad?: Disponibilidad;
  radioTrabajo?: number;
  tarifaBase?: number;
  verificado?: boolean;
  activo?: boolean;
  disponibleAhora?: boolean;
  emergencia24h?: boolean;
  calificacionPromedio?: number;
  trabajosCompletados?: number;
  // Ubicación base del técnico (para búsquedas por cercanía)
  ubicacionBase?: {
    direccion?: string;
    ciudad?: string;
    coordenadas?: {
      type: string;
      coordinates: number[];
    };
  };
  // Fondos/Ganancias del técnico
  fondos?: {
    disponible: number;
    pendiente: number;
    totalGanado: number;
    totalRetirado: number;
  };
  // Historial de retiros
  historialRetiros?: {
    monto: number;
    fecha: Date;
    estado: string;
    banco: string;
    numeroCuenta: string;
    titular?: string;
  }[];
}

export interface Certificacion {
  _id?: string;
  nombre: string;
  institucion: string;
  fecha: string;
  documento?: string;
  verificado: boolean;
}

export interface FotoPortafolio {
  _id?: string;
  url: string;
  descripcion?: string;
  fecha: string;
}

export interface Disponibilidad {
  dias: string[];
  horaInicio: string;
  horaFin: string;
}

export interface PuntosLealtad {
  total: number;
  nivel: NivelLealtad;
  historial?: HistorialPuntos[];
}

export interface HistorialPuntos {
  _id?: string;
  cantidad: number;
  tipo: 'ganado' | 'canjeado';
  descripcion: string;
  fecha: string;
}

export type NivelLealtad = 'bronce' | 'plata' | 'oro' | 'platino';

export interface NivelLealtadInfo {
  nivel: NivelLealtad;
  nombre: string;
  puntosMinimos: number;
  color: string;
  beneficios?: string[];
}

// ===== SERVICIO =====

export interface Servicio {
  _id: string;
  cliente: any;
  tipo: TipoServicio;
  tipoServicio?: TipoServicio;
  titulo: string;
  descripcion: string;
  fotos: string[];
  ubicacion: UbicacionServicio;
  urgencia: 'normal' | 'emergencia';
  estado: EstadoServicio | string;
  esInstantaneo: boolean;
  tecnicoAsignado?: any;
  cotizaciones: any[];
  fechaCreacion: string;
  createdAt?: string;
  fechaActualizacion: string;
  fechaDeseada?: string;
  resena?: any;
}

export interface UbicacionServicio {
  direccion: string;
  ciudad?: string;
  estado?: string;
  referencia?: string;
  coordenadas: Coordenadas;
}

export interface Coordenadas {
  type: 'Point';
  coordinates: [number, number]; // [longitud, latitud]
}

export type TipoServicio =
  | 'plomeria' | 'electricidad' | 'cerrajeria' | 'carpinteria'
  | 'pintura' | 'aire_acondicionado' | 'refrigeracion' | 'albanileria'
  | 'herreria' | 'jardineria' | 'limpieza' | 'mudanzas'
  | 'electrodomesticos' | 'computadoras' | 'otro';

export type EstadoServicio =
  | 'pendiente' | 'publicado' | 'cotizado' | 'asignado' | 'en_progreso'
  | 'completado' | 'cancelado';

// ===== COTIZACIÓN =====

export interface Cotizacion {
  _id: string;
  servicio: any;
  idServicio?: any;
  tecnico?: any;
  idTecnico?: any;
  precio: number;
  montoTotal?: number;
  descripcion?: string;
  descripcionTrabajo?: string;
  tiempoEstimado: TiempoEstimado | string;
  materiales: Material[];
  garantia: number;
  notasAdicionales?: string;
  estado: EstadoCotizacion;
  fechaCreacion: string;
  fechaExpiracion?: string;
  validoHasta?: string;
  datosTecnicoSnapshot?: DatosTecnicoSnapshot;
}

export interface TiempoEstimado {
  valor: number;
  unidad: 'horas' | 'dias';
}

export interface Material {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  incluido: boolean;
}

export interface DatosTecnicoSnapshot {
  nombre?: string;
  calificacion?: number;
  calificacionPromedio?: number;
  trabajosCompletados: number;
  verificado?: boolean;
  fotoUrl?: string;
}

export type EstadoCotizacion = 'pendiente' | 'aceptada' | 'rechazada' | 'expirada' | 'cancelada';

// ===== TRABAJO =====

export interface Trabajo {
  _id: string;
  // Campos poblados desde el backend
  idServicio?: any;
  idCotizacion?: any;
  idCliente?: any;
  idTecnico?: any;
  // Alias para compatibilidad
  servicio?: any;
  cotizacion?: any;
  cliente?: any;
  tecnico?: any;
  estado: EstadoTrabajo | string;
  fechaProgramada: string;
  fechaInicio?: string;
  fechaFin?: string;
  fotos: FotoTrabajo[];
  descripcionFinal?: string;
  pago: PagoTrabajo;
  garantia?: GarantiaTrabajo;
  disputa?: DisputaTrabajo;
  ubicacionTecnico?: Coordenadas;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface FotoTrabajo {
  _id?: string;
  url: string;
  tipo: 'antes' | 'despues' | 'progreso';
  fecha: string;
}

export interface PagoTrabajo {
  monto: number;
  comision?: number;
  montoTecnico?: number;
  metodo?: string;
  metodoPago?: string;
  estado: 'pendiente' | 'pagado' | 'reembolsado' | 'retenido';
  tieneGarantia?: boolean;
  referenciaPago?: string;
  fechaPago?: string;
}

export interface GarantiaTrabajo {
  dias: number;
  fechaVencimiento: string;
  estado: 'vigente' | 'vencida' | 'activada' | 'aprobada' | 'rechazada';
  descripcionProblema?: string;
  fechaActivacion?: string;
}

export interface DisputaTrabajo {
  motivo: string;
  tipo: 'calidad' | 'tiempo' | 'precio' | 'comportamiento' | 'otro';
  estado: 'abierta' | 'en_revision' | 'resuelta';
  resolucion?: string;
  accion?: string;
  montoReembolso?: number;
  fechaCreacion: string;
  fechaResolucion?: string;
}

export type EstadoTrabajo =
  | 'pendiente' | 'programado' | 'en_camino' | 'en_progreso'
  | 'completado' | 'cancelado';

// ===== RESEÑA =====

export interface Resena {
  _id: string;
  trabajo: any;
  cliente: any;
  tecnico: any;
  calificacion: number;
  comentario: string;
  aspectos: AspectosResena;
  fotos: string[];
  recomendaria: boolean;
  respuesta?: RespuestaResena;
  respuestaTecnico?: string;
  reportada: boolean;
  fechaCreacion: string;
  createdAt?: string;
}

export interface AspectosResena {
  puntualidad?: number;
  calidad?: number;
  comunicacion?: number;
  limpieza?: number;
  profesionalismo?: number;
}

export interface RespuestaResena {
  texto: string;
  fecha: string;
}

// ===== MENSAJE =====

export interface Mensaje {
  _id: string;
  trabajo: string;
  remitente: any;
  emisor?: string;
  receptor?: string;
  contenido: string;
  tipo: 'texto' | 'imagen' | 'ubicacion' | 'sistema';
  leido: boolean;
  fechaCreacion: string;
  createdAt?: string;
}

// ===== API RESPONSES =====

export interface RespuestaApi<T> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  error?: string;
  errores?: ErrorValidacion[];
}

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
}

export interface RespuestaPaginada<T> {
  exito: boolean;
  datos: T[];
  paginacion: Paginacion;
}

export interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

// ===== AUTH =====

export interface CredencialesLogin {
  email: string;
  contrasena: string;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
  telefono: string;
  rol: 'cliente' | 'tecnico';
}

export interface DatosRegistroTecnico extends DatosRegistro {
  especialidades: TipoServicio[];
  descripcion: string;
}

export interface RespuestaAuth {
  exito: boolean;
  mensaje?: string;
  datos?: {
    token: string;
    usuario: Usuario;
  };
  // Compatibilidad con estructura plana (si el backend cambia)
  token?: string;
  usuario?: Usuario;
}

// ===== NOTIFICACIONES =====

export interface Notificacion {
  _id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  datos?: any;
  leida: boolean;
  fechaCreacion: string;
}

export type TipoNotificacion =
  | 'nueva_cotizacion' | 'cotizacion_aceptada' | 'cotizacion_rechazada' | 'cotizacion_cancelada'
  | 'cotizacion_no_seleccionada' | 'trabajo_programado' | 'tecnico_en_camino'
  | 'trabajo_completado' | 'nueva_resena' | 'pago_confirmado' | 'pago_liberado'
  | 'pago_procesado' | 'puntos_ganados' | 'estado_actualizado' | 'trabajo_estado_actualizado'
  | 'disputa_abierta' | 'servicio_instantaneo' | 'garantia_activada';

// ===== FIDELIZACIÓN =====

export interface Beneficio {
  _id: string;
  nombre: string;
  descripcion: string;
  puntosRequeridos: number;
  tipo: 'descuento' | 'servicio_gratis' | 'prioridad' | 'beneficio_especial';
  disponible: boolean;
}

export interface Canjeo {
  beneficio: string;
  puntos: number;
  tipo: string;
  descripcion?: string;
}

// ===== GEOLOCALIZACIÓN =====

export interface TecnicoCercano extends Usuario {
  distancia: number;
  tiempoEstimado: number;
}

export interface UbicacionActual {
  latitud: number;
  longitud: number;
  precision?: number;
}

// ===== UTILIDADES =====

export const TIPOS_SERVICIO: { valor: TipoServicio; etiqueta: string; icono: string }[] = [
  { valor: 'plomeria', etiqueta: 'Plomería', icono: 'water-outline' },
  { valor: 'electricidad', etiqueta: 'Electricidad', icono: 'flash-outline' },
  { valor: 'cerrajeria', etiqueta: 'Cerrajería', icono: 'key-outline' },
  { valor: 'carpinteria', etiqueta: 'Carpintería', icono: 'hammer-outline' },
  { valor: 'pintura', etiqueta: 'Pintura', icono: 'color-palette-outline' },
  { valor: 'aire_acondicionado', etiqueta: 'Aire Acondicionado', icono: 'snow-outline' },
  { valor: 'refrigeracion', etiqueta: 'Refrigeración', icono: 'snow-outline' },
  { valor: 'albanileria', etiqueta: 'Albañilería', icono: 'business-outline' },
  { valor: 'herreria', etiqueta: 'Herrería', icono: 'construct-outline' },
  { valor: 'jardineria', etiqueta: 'Jardinería', icono: 'leaf-outline' },
  { valor: 'limpieza', etiqueta: 'Limpieza', icono: 'sparkles-outline' },
  { valor: 'mudanzas', etiqueta: 'Mudanzas', icono: 'cube-outline' },
  { valor: 'electrodomesticos', etiqueta: 'Electrodomésticos', icono: 'tv-outline' },
  { valor: 'computadoras', etiqueta: 'Computadoras', icono: 'laptop-outline' },
  { valor: 'otro', etiqueta: 'Otro', icono: 'ellipsis-horizontal-outline' },
];

export const ESTADOS_SERVICIO: { valor: EstadoServicio; etiqueta: string; color: string }[] = [
  { valor: 'publicado', etiqueta: 'Publicado', color: 'primary' },
  { valor: 'cotizado', etiqueta: 'Cotizado', color: 'secondary' },
  { valor: 'asignado', etiqueta: 'Asignado', color: 'tertiary' },
  { valor: 'en_progreso', etiqueta: 'En Progreso', color: 'warning' },
  { valor: 'completado', etiqueta: 'Completado', color: 'success' },
  { valor: 'cancelado', etiqueta: 'Cancelado', color: 'danger' },
];

export const NIVELES_LEALTAD: NivelLealtadInfo[] = [
  {
    nivel: 'bronce',
    nombre: 'Bronce 🥉',
    puntosMinimos: 0,
    color: '#CD7F32',
    beneficios: [
      'Acceso al programa de puntos',
      '1 punto por cada $10 gastados',
      'Notificaciones de promociones'
    ]
  },
  {
    nivel: 'plata',
    nombre: 'Plata 🥈',
    puntosMinimos: 500,
    color: '#C0C0C0',
    beneficios: [
      'Todo lo de Bronce',
      '5% descuento en comisiones',
      'Prioridad en atención al cliente',
      'Acceso anticipado a nuevos técnicos'
    ]
  },
  {
    nivel: 'oro',
    nombre: 'Oro 🥇',
    puntosMinimos: 1500,
    color: '#FFD700',
    beneficios: [
      'Todo lo de Plata',
      '10% descuento en comisiones',
      'Garantía extendida gratis en servicios',
      'Técnicos verificados prioritarios'
    ]
  },
  {
    nivel: 'platino',
    nombre: 'Platino 💎',
    puntosMinimos: 3000,
    color: '#E5E4E2',
    beneficios: [
      'Todo lo de Oro',
      '15% descuento en comisiones',
      'Atención VIP 24/7',
      'Prioridad absoluta en asignación',
      'Un servicio básico gratis al mes'
    ]
  },
];
