# Parseo de mensajes scrapeados → `vacantes_importar_lote`

Estructura real que espera `vacantes_importar_lote` (ver `src/tools.ts`).
No es un prompt de LLM — Hermes lee cada mensaje crudo (`scraper_mensajes_pendientes`)
y arma este JSON él mismo, a su criterio, uno por mensaje. Descarta (no
importes) lo que sea spam, publicidad, o una BÚSQUEDA de empleo de un
candidato — sólo importa ofertas reales.

## Item (uno por vacante)

```jsonc
{
  // Obligatorio. Viene tal cual del mensaje original — no lo inventes.
  "origenId": "telegram:Disimotaempleos/6017",

  // Todo lo demás es opcional y cae a un default razonable si falta —
  // el texto scrapeado es libre, no un formulario. Pero mientras más
  // completes, menos tiene que arreglar el moderador después.
  "titulo": "Recepcionista bilingüe",
  "nombreEmpresa": "Hotel Riu Palace",

  "zona": "BAVARO",              // ver tabla de zonas
  "categoria": "RECEPCION",      // ver tabla de categorías
  "tipoContrato": "TIEMPO_COMPLETO", // ver tabla de tipos de contrato

  // Al menos uno de los dos es obligatorio (si no hay descripción propia,
  // se usa textoOriginal tal cual).
  "textoOriginal": "texto crudo del post, sin editar",
  "descripcion": "descripción limpia y reformateada del puesto",
  "requisitos": "experiencia, idiomas, disponibilidad, etc.",

  "salarioMin": 15000,
  "salarioMax": 20000,

  "incluyeTransporte": false,
  "incluyeAlojamiento": false,
  "incluyeAlimentacion": false,
  "turnoRotativo": false,
  "urgente": false,

  // Al menos UNA forma de aplicar es obligatoria (enlace, o teléfono, o correo).
  "enlaceExternoPostulacion": "",   // debe empezar con http:// o https://
  "contactoTelefono": "809-555-1234",
  "contactoEmail": "",

  // Informativo — no se guarda en la vacante, sólo para tu propio criterio.
  "fechaOriginal": "2026-08-27T10:00:00.000Z"
}
```

Mandalo envuelto en `{ "items": [ ... ] }` (1 a 500 items por llamada).

## Zonas válidas (`zona`)

`HIGUEY` `BAVARO` `PUNTA_CANA` `VERON` `FRIUSA` `LA_OTRA_BANDA` `UVERO_ALTO` `MACAO` `OTRA`

## Categorías válidas (`categoria`)

`ADMINISTRACION` `ATENCION_CLIENTE` `VENTAS` `RECEPCION` `COCINA` `BAR`
`CAMARERA_PISO` `MANTENIMIENTO` `CONSTRUCCION` `SEGURIDAD` `TRANSPORTE`
`LOGISTICA_ALMACEN` `CONTABILIDAD_FINANZAS` `TECNOLOGIA` `MARKETING`
`SALUD` `EDUCACION` `LEGAL` `ANIMACION` `SPA_BELLEZA` `JARDINERIA`
`LAVANDERIA` `DOMESTICO` `AGRICULTURA` `OTRO`

## Tipos de contrato válidos (`tipoContrato`)

`TIEMPO_COMPLETO` `MEDIO_TIEMPO` `TEMPORAL` `POR_TEMPORADA` `PASANTIA`

## Qué pasa después de importar

Las vacantes nacen en **BORRADOR** — no salen públicas todavía. El dueño
las revisa en `/moderacion/vacantes` → pestaña "Por revisar (scraper)" y
las aprueba (o descarta) en lote, o entra a editar una si hace falta
corregir algo antes de publicarla. Vos no tenés que preguntar "¿la
publico?" — importar ya deja todo listo para esa revisión.

Después de importar, marcá los mensajes como procesados con
`scraper_marcar_procesado` (los hayas importado o descartado como spam) —
si no, `scraper_mensajes_pendientes` te los va a volver a mostrar.
