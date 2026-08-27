try {
  process.loadEnvFile();
} catch {
  // Sin .env (ej. las variables ya vienen del entorno que lanza el proceso,
  // como el `env` de la config de Claude Desktop) — no es un error.
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

import { TOOLS } from './tools.js';

/**
 * Cliente MCP delgado para Contratando — corre local (stdio) pero cada
 * llamada se reenvía por HTTPS a `{MCP_BRIDGE_URL}/api/mcp`, adentro del
 * server de Next YA desplegado en producción. Así se controla la instancia
 * real sin exponer la base de datos (que en Coolify está en modo privado a
 * propósito) ni copiar el schema/las reglas de negocio acá — la ejecución
 * de verdad vive en `contratando/src/lib/mcp/registro.ts`.
 *
 * Configurar con `MCP_BRIDGE_URL` y `MCP_API_SECRET` en `.env` (ver
 * `.env.example`) — el secreto tiene que ser EXACTAMENTE el mismo que
 * `MCP_API_SECRET` en el `.env` de Contratando.
 */

const BRIDGE_URL = process.env.MCP_BRIDGE_URL;
const SECRET = process.env.MCP_API_SECRET;

if (!BRIDGE_URL || !SECRET) {
  console.error('Faltan MCP_BRIDGE_URL y/o MCP_API_SECRET en el entorno. Copiá .env.example a .env y completalo.');
  process.exit(1);
}

async function llamarBridge(tool: string, args: unknown): Promise<{ ok: boolean; result?: unknown; error?: string }> {
  const respuesta = await fetch(`${BRIDGE_URL}/api/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SECRET}` },
    body: JSON.stringify({ tool, args }),
  });
  return (await respuesta.json()) as { ok: boolean; result?: unknown; error?: string };
}

const server = new McpServer({ name: 'contratando', version: '1.0.0' });

for (const t of TOOLS) {
  server.registerTool(
    t.name,
    { title: t.title, description: t.description, inputSchema: t.schema },
    async (args): Promise<CallToolResult> => {
      try {
        const respuesta = await llamarBridge(t.name, args);
        if (!respuesta.ok) {
          return { content: [{ type: 'text', text: `Error: ${respuesta.error ?? 'el puente no dio detalles'}` }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify(respuesta.result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error de red hablando con el puente: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
      }
    },
  );
}

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Error fatal en el servidor MCP:', error);
  process.exit(1);
});
