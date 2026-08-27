# contratando-mcp

Servidor MCP para que un agente de IA (Hermes) controle [Contratando](https://contratandord.com) — lectura y escritura completa de la plataforma: vacantes, empresas, candidatos, postulaciones, créditos, suscripciones, comisiones, usuarios y configuración.

## Cómo funciona

Este repo **no tiene acceso a la base de datos**. Es un cliente delgado: cada tool que llama el agente se reenvía por HTTPS a `POST {MCP_BRIDGE_URL}/api/mcp`, una ruta protegida dentro de la propia app de Contratando (ya desplegada). La base de datos de producción está en modo privado a propósito — este puente es la forma de controlarla sin exponerla a internet.

```
Hermes → contratando-mcp (stdio, local) → HTTPS + secreto → contratandord.com/api/mcp → Postgres (privada)
```

La lógica real (qué mutación hace cada tool, validación, auditoría) vive en el repo de Contratando (`src/lib/mcp/registro.ts`). Este repo sólo declara los 46 tools (nombre, descripción, schema de entrada) para que el agente sepa qué puede pedir.

## Setup

```bash
npm install
cp .env.example .env
```

Completar `.env`:
- `MCP_BRIDGE_URL` — `https://contratandord.com` (o `http://localhost:3200` para probar contra local).
- `MCP_API_SECRET` — el mismo valor que `MCP_API_SECRET` en el `.env` de Contratando. Si no coinciden, el puente rechaza todo con 401.

```bash
npm start
```

## Conectarlo a un agente

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "contratando": {
      "command": "npx",
      "args": ["tsx", "C:\\ruta\\a\\contratando-mcp\\src\\server.ts"],
      "env": {
        "MCP_BRIDGE_URL": "https://contratandord.com",
        "MCP_API_SECRET": "..."
      }
    }
  }
}
```

**Claude Code**:
```
claude mcp add contratando -- npx tsx C:\ruta\a\contratando-mcp\src\server.ts
```

Para Hermes u otro runtime MCP: apuntarlo a `npm start` (o `node --import tsx src/server.ts`) en este directorio, con `MCP_BRIDGE_URL`/`MCP_API_SECRET` en el entorno.

## Qué NO hace

- No sube archivos (logo, comprobantes, documentos de RNC).
- No edita el CV de un candidato sección por sección (experiencia/educación/idiomas uno por uno) — sólo lo esencial de postulaciones y perfil de empresa.
- `talento_ficha` nunca trae teléfono/correo/cédula — el buscador de talentos real exige un flujo de desbloqueo auditado que este puente no replica.
- No manda correo ni avisa a Google al mutar — sólo notificación in-app. El sitio recoge los cambios por su cuenta (cache de config hasta 30s, sitemap/rastreo normal para SEO).

## Seguridad

- El secreto se compara del lado del servidor con `timingSafeEqual` (sin filtración por tiempo de respuesta).
- Rate limit de 30 llamadas / 5 min por IP en el puente.
- Cada mutación queda en la bitácora de auditoría de Contratando con `datos.via: "mcp"`, atribuida al super admin configurado en `SEED_ADMIN_EMAIL` del lado del servidor.
- Si el secreto se filtra, rotarlo en LOS DOS lados: `MCP_API_SECRET` en el `.env` de Contratando (redeploy) y acá.
