import { z } from 'zod';

/**
 * Declaración de los 46 tools de Contratando: nombre, título, descripción y
 * schema de entrada. SIN lógica de negocio — este repo es un cliente MCP
 * delgado que reenvía cada llamada a `POST {MCP_BRIDGE_URL}/api/mcp` (ver
 * `server.ts`). La ejecución real vive en el repo de Contratando
 * (`src/lib/mcp/registro.ts`), que valida los argumentos otra vez del lado
 * del servidor — si este archivo queda desactualizado (un campo nuevo que
 * todavía no se copió acá), el peor caso es que el agente no vea ese campo
 * como opción hasta que se actualice; el servidor sigue siendo la fuente de
 * verdad de qué es válido.
 *
 * Las 25 categorías/zonas/etc. del enum de Contratando se repiten acá tal
 * cual — si cambian allá, hay que copiarlas de nuevo.
 */

const ZONAS = ['BAVARO', 'HIGUEY', 'PUNTA_CANA', 'VERON', 'FRIUSA', 'LA_OTRA_BANDA', 'UVERO_ALTO', 'MACAO', 'OTRA'] as const;

const CATEGORIAS = [
  'RECEPCION', 'COCINA', 'CAMARERA_PISO', 'ANIMACION', 'BAR', 'SPA_BELLEZA',
  'ADMINISTRACION', 'ATENCION_CLIENTE', 'VENTAS', 'CONTABILIDAD_FINANZAS', 'TECNOLOGIA',
  'MANTENIMIENTO', 'CONSTRUCCION', 'SEGURIDAD', 'TRANSPORTE', 'LOGISTICA_ALMACEN',
  'SALUD', 'EDUCACION', 'JARDINERIA', 'LAVANDERIA', 'DOMESTICO', 'AGRICULTURA',
  'MARKETING', 'LEGAL', 'OTRO',
] as const;

const TIPOS_CONTRATO = ['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'TEMPORAL', 'POR_TEMPORADA', 'PASANTIA'] as const;
const NIVELES_IDIOMA = ['BASICO', 'INTERMEDIO', 'AVANZADO', 'NATIVO'] as const;

export interface DefinicionToolCliente {
  name: string;
  title: string;
  description: string;
  schema: z.ZodType<unknown>;
}

function tool(name: string, title: string, description: string, schema: z.ZodType<unknown>): DefinicionToolCliente {
  return { name, title, description, schema };
}

const vacio = z.object({});

const campoIdioma = z.object({ idioma: z.string().trim().min(2).max(40), nivel: z.enum(NIVELES_IDIOMA), requerido: z.boolean().default(false) });
const campoPregunta = z.object({
  pregunta: z.string().trim().min(3).max(300),
  tipo: z.enum(['SI_NO', 'OPCION_MULTIPLE', 'ABIERTA']),
  opciones: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  respuestaCorrecta: z.boolean().default(false),
  critica: z.boolean().default(false),
});

const datosVacante = {
  titulo: z.string().trim().min(5).max(160),
  descripcion: z.string().trim().min(40).max(8000),
  requisitos: z.string().trim().max(4000).optional(),
  experienciaMinimaAnios: z.number().int().min(0).max(40).optional(),
  categoria: z.enum(CATEGORIAS),
  tipoContrato: z.enum(TIPOS_CONTRATO),
  zona: z.enum(ZONAS),
  direccion: z.string().trim().max(255).optional(),
  enlaceExternoPostulacion: z.string().trim().max(500).optional(),
  salarioMin: z.number().min(0).max(9_999_999).optional(),
  salarioMax: z.number().min(0).max(9_999_999).optional(),
  salarioFrecuencia: z.enum(['MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIO', 'POR_HORA']).default('MENSUAL'),
  salarioMoneda: z.enum(['DOP', 'USD']).default('DOP'),
  modalidadTrabajo: z.enum(['PRESENCIAL', 'REMOTO', 'HIBRIDO']).default('PRESENCIAL'),
  confidencial: z.boolean().default(false),
  mostrarSalario: z.boolean().default(true),
  incluyeTransporte: z.boolean().default(false),
  incluyeAlojamiento: z.boolean().default(false),
  incluyeAlimentacion: z.boolean().default(false),
  turnoRotativo: z.boolean().default(false),
  postulacionRapida: z.boolean().default(true),
  vacantesDisponibles: z.number().int().min(1).max(999).default(1),
  fechaCierre: z.coerce.date().optional(),
  destacada: z.boolean().default(false),
  urgente: z.boolean().default(false),
  duracionDestacadoDias: z.union([z.literal(7), z.literal(14)]).default(7),
  idiomas: z.array(campoIdioma).default([]),
  preguntas: z.array(campoPregunta).default([]),
  beneficiosPersonalizados: z.array(z.string().trim().min(1).max(200)).default([]),
};

/** Item del lote de importación (scraper) — mismo schema laxo que
 *  `validaciones-importacion.ts` del lado de Contratando: todo estructurado
 *  es opcional, cae a un default razonable. */
const itemImportacion = z.object({
  origenId: z.string().trim().min(3).max(200),
  titulo: z.string().trim().min(2).max(160).optional(),
  nombreEmpresa: z.string().trim().min(2).max(160).optional(),
  zona: z.enum(ZONAS).optional(),
  categoria: z.enum(CATEGORIAS).optional(),
  tipoContrato: z.enum(TIPOS_CONTRATO).optional(),
  textoOriginal: z.string().trim().max(8000).optional(),
  descripcion: z.string().trim().max(8000).optional(),
  requisitos: z.string().trim().max(4000).optional(),
  salarioMin: z.number().min(0).max(9_999_999).optional(),
  salarioMax: z.number().min(0).max(9_999_999).optional(),
  incluyeTransporte: z.boolean().optional(),
  incluyeAlojamiento: z.boolean().optional(),
  incluyeAlimentacion: z.boolean().optional(),
  turnoRotativo: z.boolean().optional(),
  urgente: z.boolean().optional(),
  enlaceExternoPostulacion: z.string().trim().max(2000).optional(),
  contactoTelefono: z.string().trim().max(40).optional(),
  contactoEmail: z.string().trim().max(200).optional(),
  fechaOriginal: z.string().trim().optional(),
});

const filtrosTalento = {
  q: z.string().trim().max(120).optional(),
  zona: z.enum(ZONAS).optional(),
  idioma: z.string().trim().max(40).optional(),
  nivelIdioma: z.enum(NIVELES_IDIOMA).optional(),
  disponible: z.boolean().optional(),
  vehiculo: z.boolean().optional(),
  salarioMax: z.number().int().min(0).max(1_000_000).optional(),
  pagina: z.number().int().min(1).max(500).default(1),
};

const esquemaPlan = z.object({
  nombre: z.string().trim().min(2).max(60),
  precioMensual: z.number().min(0).max(9_999_999),
  limiteVacantesActivas: z.number().int().min(1).max(10_000),
  destacadosIncluidos: z.number().int().min(0).max(1000).default(0),
  accesoBuscadorTalentos: z.boolean(),
});

export const TOOLS: DefinicionToolCliente[] = [
  // --- Lectura ---------------------------------------------------------------
  tool(
    'vacantes_buscar', 'Buscar vacantes',
    'Busca vacantes publicadas con filtros (texto, zona, categoría, tipo de contrato, idioma, salario, días de antigüedad, beneficios), paginado.',
    z.object({
      q: z.string().trim().max(120).optional(),
      zona: z.enum(ZONAS).optional(),
      categoria: z.enum(CATEGORIAS).optional(),
      tipoContrato: z.enum(TIPOS_CONTRATO).optional(),
      idioma: z.string().trim().max(40).optional(),
      salarioMin: z.number().int().min(0).max(1_000_000).optional(),
      dias: z.number().int().min(1).max(365).optional(),
      beneficios: z.array(z.enum(['transporte', 'alojamiento', 'alimentacion'])).default([]),
      orden: z.enum(['relevancia', 'fecha']).default('relevancia'),
      pagina: z.number().int().min(1).max(500).default(1),
    }),
  ),
  tool('vacantes_detalle', 'Detalle de una vacante', 'Trae una vacante por id con todos sus campos (cualquier estado), para gestión.', z.object({ vacanteId: z.string().cuid() })),
  tool('vacantes_de_empresa', 'Vacantes de una o más empresas', 'Lista las vacantes de una o más empresas (por id), con conteo de postulaciones. Filtro de estado opcional.', z.object({ empresaIds: z.array(z.string().cuid()).min(1), filtroEstado: z.string().optional() })),
  tool('talento_buscar', 'Buscar en el buscador de talentos', 'Busca perfiles de candidatos visibles para empresas. NUNCA incluye teléfono/correo/cédula.', z.object({ ...filtrosTalento, empresaId: z.string().cuid().optional() })),
  tool('talento_ficha', 'Ficha de un candidato', 'Ficha completa de un candidato SIN contacto.', z.object({ candidatoId: z.string().cuid() })),
  tool('creditos_saldo', 'Saldo de créditos de una empresa', 'Saldo de créditos (publicación, destacado, urgente) de una empresa.', z.object({ empresaId: z.string().cuid() })),
  tool('suscripcion_de_empresa', 'Suscripción de una empresa', 'Suscripción vigente (o la última) de una empresa, con su historial de pagos.', z.object({ empresaId: z.string().cuid() })),
  tool('notificaciones_listar', 'Notificaciones de un usuario', 'Últimas notificaciones in-app de un usuario.', z.object({ usuarioId: z.string().cuid(), take: z.number().int().min(1).max(100).default(30) })),
  tool('auditoria_buscar', 'Buscar en la bitácora de auditoría', 'Consulta el registro de auditoría, filtrando por acción/entidad/entidadId, paginado.', z.object({ accion: z.string().optional(), entidad: z.string().optional(), entidadId: z.string().optional(), pagina: z.number().int().min(1).max(500).default(1) })),
  tool('stats_resumen', 'Resumen general de la plataforma', 'Contadores clave: pendientes de moderación, candidatos, empresas, vacantes publicadas, postulaciones de hoy, interruptores de cobro/buscador.', vacio),
  tool('stats_financiero', 'Métricas financieras', 'MRR por plan, comisiones pendientes, solicitudes de crédito pendientes, suscripciones por vencer.', vacio),

  // --- Escritura: vacantes ------------------------------------------------------
  tool('vacante_crear', 'Crear vacante', 'Crea una vacante en nombre de una empresa.', z.object({ empresaId: z.string().cuid(), ...datosVacante })),
  tool('vacante_editar', 'Editar vacante', 'Edita una vacante existente.', z.object({ vacanteId: z.string().cuid(), ...datosVacante })),
  tool('vacante_cambiar_estado', 'Pausar / reactivar / cerrar / reabrir vacante', 'Cambia el estado de una vacante.', z.object({ vacanteId: z.string().cuid(), accion: z.enum(['PAUSAR', 'REACTIVAR', 'CERRAR', 'REABRIR']) })),
  tool('vacante_renovar', 'Renovar vacante vencida', 'Renueva una vacante que el propio sistema cerró — vuelve a PUBLICADA directo.', z.object({ vacanteId: z.string().cuid() })),
  tool('vacante_duplicar', 'Duplicar vacante', 'Copia una vacante entera como una nueva.', z.object({ vacanteId: z.string().cuid() })),
  tool('vacante_decidir_moderacion', 'Aprobar / rechazar vacante (moderación)', 'Decide una vacante pendiente de aprobación.', z.object({ vacanteId: z.string().cuid(), aprobar: z.boolean(), motivoRechazo: z.string().trim().max(1000).optional() })),

  // --- Escritura: empresas -------------------------------------------------------
  tool('empresa_decidir_verificacion', 'Aprobar / rechazar empresa (moderación)', 'Decide una empresa pendiente de verificación.', z.object({ empresaId: z.string().cuid(), aprobar: z.boolean(), motivoRechazo: z.string().trim().max(1000).optional() })),
  tool('empresa_crear', 'Crear empresa (alta manual)', 'Da de alta una empresa a mano con su dueño — nace ya APROBADA.', z.object({
    nombres: z.string().trim().min(2).max(60), apellidos: z.string().trim().min(2).max(60), email: z.string().trim().toLowerCase().email(),
    telefono: z.string().optional(), password: z.string().min(10), nombreEmpresa: z.string().trim().min(2).max(160),
    rnc: z.string().optional(), zonaEmpresa: z.enum(ZONAS).optional(),
  })),
  tool('empresa_editar_perfil', 'Editar perfil de empresa', 'Edita los datos de texto del perfil de una empresa.', z.object({
    empresaId: z.string().cuid(), nombre: z.string().trim().min(2).max(160), descripcion: z.string().trim().max(2000).optional(),
    sitioWeb: z.string().trim().max(255).optional(), tamano: z.enum(['MICRO', 'PEQUENA', 'MEDIANA', 'GRANDE']).optional(),
    telefono: z.string().optional(), zona: z.enum(ZONAS).optional(), direccion: z.string().trim().max(255).optional(),
  })),

  // --- Escritura: candidatos y postulaciones --------------------------------------
  tool('postulacion_cambiar_estado', 'Cambiar estado de una postulación', 'Avanza el estado de una postulación (para CONTRATADO usa postulacion_marcar_contratado).', z.object({
    postulacionId: z.string().cuid(),
    estado: z.enum(['ENVIADA', 'VISTA', 'EN_REVISION', 'PRESELECCIONADO', 'ENTREVISTA', 'APROBADA', 'RECHAZADA']),
    nota: z.string().trim().max(1000).optional(),
  })),
  tool('postulacion_marcar_contratado', 'Marcar postulación como contratado', 'Marca CONTRATADO y crea la colocación (pendiente de doble confirmación).', z.object({ postulacionId: z.string().cuid(), salarioAcordado: z.number().positive().max(9_999_999), fechaInicio: z.coerce.date() })),
  tool('postulacion_retirar', 'Retirar postulación', 'Retira una postulación.', z.object({ postulacionId: z.string().cuid() })),

  // --- Escritura: dinero -----------------------------------------------------------
  tool('credito_otorgar', 'Otorgar créditos', 'Regala créditos a una empresa sin que medie pago.', z.object({ empresaId: z.string().cuid(), tipo: z.enum(['PUBLICACION', 'DESTACADO', 'URGENTE']), cantidad: z.number().int().min(1).max(1000), nota: z.string().trim().max(500).optional() })),
  tool('credito_resolver_solicitud', 'Aprobar / rechazar solicitud de créditos', 'Resuelve una solicitud de compra de créditos.', z.object({ solicitudId: z.string().cuid(), aprobar: z.boolean() })),
  tool('suscripcion_registrar_pago', 'Registrar pago de suscripción', 'Registra un pago de suscripción ya recibido.', z.object({
    empresaId: z.string().cuid(), monto: z.number().min(0).max(9_999_999), metodo: z.enum(['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'TARJETA', 'OTRO']),
    mesesCubiertos: z.number().int().min(1).max(36), referencia: z.string().trim().max(120).optional(), nota: z.string().trim().max(1000).optional(),
  })),
  tool('suscripcion_cancelar', 'Cancelar suscripción', 'Cancela la suscripción de una empresa.', z.object({ empresaId: z.string().cuid() })),
  tool('suscripcion_editar', 'Editar suscripción a mano', 'Cambia estado/vencimiento/notas/plan de una suscripción sin registrar un pago.', z.object({
    empresaId: z.string().cuid(), estado: z.enum(['PRUEBA', 'ACTIVA', 'VENCIDA', 'CANCELADA']), venceEn: z.coerce.date(),
    notas: z.string().trim().max(1000).optional(), planId: z.string().cuid().optional(),
  })),
  tool('plan_crear', 'Crear plan de suscripción', 'Crea un plan de suscripción nuevo.', esquemaPlan),
  tool('plan_editar', 'Editar plan de suscripción', 'Edita un plan existente.', z.object({ planId: z.string().cuid(), ...esquemaPlan.shape })),
  tool('plan_alternar_activo', 'Activar / pausar plan', 'Activa o pausa un plan.', z.object({ planId: z.string().cuid(), activo: z.boolean() })),
  tool('comision_registrar_pago', 'Registrar pago de comisión', 'Registra un pago (total o parcial) de una comisión.', z.object({
    comisionId: z.string().cuid(), monto: z.number().positive().max(9_999_999), metodo: z.enum(['TRANSFERENCIA', 'EFECTIVO', 'CHEQUE', 'TARJETA', 'OTRO']),
    referencia: z.string().trim().max(120).optional(), nota: z.string().trim().max(1000).optional(),
  })),
  tool('comision_facturar', 'Facturar comisión', 'Marca una comisión como facturada.', z.object({ comisionId: z.string().cuid(), numeroFactura: z.string().trim().min(3).max(60) })),
  tool('liquidacion_registrar', 'Registrar liquidación pagada', 'Documenta un pago ya hecho a un reclutador por un periodo.', z.object({
    reclutadorId: z.string().cuid(), montoTotal: z.number().positive().max(9_999_999), periodoInicio: z.coerce.date(), periodoFin: z.coerce.date(), notas: z.string().trim().max(1000).optional(),
  })),
  tool('colocacion_confirmar', 'Confirmar colocación', 'Firma la confirmación de una colocación por una de las dos partes.', z.object({ colocacionId: z.string().cuid(), parte: z.enum(['EMPRESA', 'CANDIDATO']).default('EMPRESA') })),
  tool('colocacion_anular', 'Anular colocación', 'Anula una colocación (y su comisión, si tenía).', z.object({ colocacionId: z.string().cuid(), motivo: z.string().trim().min(10).max(1000) })),

  // --- Escritura: usuarios y reclutadores -----------------------------------------
  tool('usuario_alternar_bloqueo', 'Bloquear / desbloquear usuario', 'Bloquea o desbloquea un usuario (togglea).', z.object({ usuarioId: z.string().cuid(), motivo: z.string().trim().max(500).optional() })),
  tool('usuario_cambiar_rol', 'Cambiar rol de usuario', 'Cambia el rol de un usuario.', z.object({ usuarioId: z.string().cuid(), rol: z.enum(['SUPER_ADMIN', 'MODERADOR', 'RECLUTADOR', 'EMPRESA', 'CANDIDATO']) })),
  tool('usuario_crear', 'Crear usuario (alta manual)', 'Da de alta un usuario a mano (no EMPRESA — para eso usa empresa_crear).', z.object({
    nombre: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email(), telefono: z.string().optional(),
    password: z.string().min(10), rol: z.enum(['SUPER_ADMIN', 'MODERADOR', 'RECLUTADOR', 'CANDIDATO']), zona: z.enum(ZONAS).optional(),
  })),
  tool('reclutador_asignar_empresa', 'Asignar empresa a reclutador', 'Asigna una empresa a un reclutador.', z.object({ reclutadorId: z.string().cuid(), empresaId: z.string().cuid() })),
  tool('reclutador_quitar_asignacion', 'Quitar asignación de empresa a reclutador', 'Le corta a un reclutador el acceso a una empresa.', z.object({ reclutadorId: z.string().cuid(), empresaId: z.string().cuid() })),
  tool('reclutador_alternar_activo', 'Activar / desactivar reclutador', 'Activa o desactiva el perfil de reclutador.', z.object({ reclutadorId: z.string().cuid() })),

  // --- Escritura: equipo de empresa -----------------------------------------------
  tool('equipo_invitar_miembro', 'Invitar miembro al equipo de una empresa', 'Genera un enlace de invitación (vale 7 días).', z.object({ empresaId: z.string().cuid(), email: z.string().trim().toLowerCase().email(), rol: z.enum(['PROPIETARIO', 'RECLUTADOR_INTERNO']) })),
  tool('equipo_revocar_invitacion', 'Revocar invitación de equipo', 'Revoca una invitación de equipo pendiente.', z.object({ invitacionId: z.string().cuid() })),
  tool('equipo_quitar_miembro', 'Quitar miembro del equipo', 'Quita a alguien del equipo de una empresa.', z.object({ empresaId: z.string().cuid(), usuarioId: z.string().cuid() })),

  // --- Escritura: configuración de la plataforma (el más sensible) ----------------
  tool(
    'configuracion_actualizar', 'Actualizar configuración de la plataforma',
    'PATCH parcial de la configuración global — sólo mandá los campos que querés cambiar. Prende/apaga cobro, límite de vacantes, buscador de talentos, mantenimiento, precios. Afecta al sitio en vivo (hasta 30s de retraso).',
    z.object({
      cobroActivo: z.boolean().optional(), comisionPorcentajeDefecto: z.number().min(0).max(100).optional(),
      parteQuePagaDefecto: z.enum(['EMPRESA', 'CANDIDATO']).optional(), repartoReclutadorDefecto: z.number().min(0).max(100).optional(),
      diasGarantia: z.number().int().min(0).max(365).optional(), requiereAprobacionVacante: z.boolean().optional(),
      requiereAprobacionEmpresa: z.boolean().optional(), buscadorTalentosActivo: z.boolean().optional(), suscripcionRequerida: z.boolean().optional(),
      precioSuscripcionMensual: z.number().min(0).max(9_999_999).optional(), limiteVacantesActivo: z.boolean().optional(),
      limiteVacantesSinPlan: z.number().int().min(0).max(1000).optional(), precioPublicacionSuelta: z.number().min(0).max(9_999_999).optional(),
      precioDestacadoSuelto: z.number().min(0).max(9_999_999).optional(), precioUrgenteSuelto: z.number().min(0).max(9_999_999).optional(),
      modoMantenimiento: z.boolean().optional(), bannerAnuncio: z.string().max(500).optional(), bannerActivo: z.boolean().optional(),
      bannerColorFondo: z.string().optional(), bannerColorTexto: z.string().optional(), bannerIniciaEn: z.coerce.date().nullable().optional(),
      bannerTerminaEn: z.coerce.date().nullable().optional(), emailsActivos: z.boolean().optional(), digestScrapedActivo: z.boolean().optional(),
      digestScrapedFrecuenciaHoras: z.number().int().min(1).max(168).optional(),
    }),
  ),

  // --- Escritura: importación en lote (scraper) ------------------------------------
  tool(
    'vacantes_importar_lote', 'Importar vacantes en lote (scraper)',
    'Crea vacantes a partir de un lote ya parseado por vos, a partir de mensajes crudos leídos con scraper_mensajes_pendientes. Nacen PUBLICADAS directo, sin moderación. Cada item necesita origenId único y al menos descripción/textoOriginal + una forma de aplicar (enlace, teléfono o correo). Reimportar el mismo origenId no duplica.',
    z.object({ items: z.array(itemImportacion).min(1).max(500) }),
  ),

  // --- Lectura/escritura: cola de mensajes scrapeados -------------------------------
  tool(
    'scraper_mensajes_pendientes', 'Mensajes scrapeados pendientes de revisar',
    'Lista mensajes crudos (Telegram/Facebook) que el scraper dejó sin procesar todavía — para que los parsees vos mismo y decidas cuáles importar con vacantes_importar_lote.',
    z.object({ limite: z.number().int().min(1).max(200).default(50) }),
  ),
  tool(
    'scraper_marcar_procesado', 'Marcar mensajes scrapeados como procesados',
    'Marca mensajes de la cola como ya vistos (los hayas importado o descartado como spam) — para que scraper_mensajes_pendientes no los vuelva a mostrar.',
    z.object({ ids: z.array(z.string().cuid()).min(1).max(200) }),
  ),
];
