import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type { IncomingMessage, ServerResponse } from "node:http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const _require = createRequire(import.meta.url);

const SWAGGER_DIST = resolve(
  _require.resolve("swagger-ui-dist/package.json"),
  "..",
);

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".svg": "image/svg+xml",
};

function getMimeType(pathname: string): string {
  const ext = extname(pathname);
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

const encoder = new TextEncoder();

function htmlResponse(res: ServerResponse, html: string): void {
  const encoded = encoder.encode(html);
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": encoded.byteLength.toString(),
  });
  res.end(encoded as never);
}

function assetResponse(res: ServerResponse, mime: string, data: Buffer): void {
  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Length": data.byteLength.toString(),
    "Cache-Control": "public, max-age=86400",
  });
  res.end(data as never);
}

function jsonResponse(res: ServerResponse, json: string): void {
  const encoded = encoder.encode(json);
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": encoded.byteLength.toString(),
  });
  res.end(encoded as never);
}

function serveDocPage(res: ServerResponse): void {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>UniConnect API — Documentación</title>
  <link rel="stylesheet" type="text/css" href="/docs/swagger-ui.css" />
  <link rel="stylesheet" type="text/css" href="/docs/index.css" />
  <link rel="icon" type="image/png" href="/docs/favicon-32x32.png" sizes="32x32" />
  <link rel="icon" type="image/png" href="/docs/favicon-16x16.png" sizes="16x16" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs/swagger-ui-bundle.js" charset="UTF-8"> </script>
  <script src="/docs/swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset,
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl,
        ],
        layout: "StandaloneLayout",
      });
    };
  </script>
</body>
</html>`;

  htmlResponse(res, html);
}

function serveStaticAsset(assetPath: string, res: ServerResponse): void {
  const filePath = resolve(SWAGGER_DIST, assetPath);

  if (!filePath.startsWith(SWAGGER_DIST)) {
    res.writeHead(403);
    res.end();
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end();
    return;
  }

  const content = readFileSync(filePath);
  const mime = getMimeType(assetPath);
  assetResponse(res, mime, content);
}

export function handleDocsRequest(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  const requestUrl = new URL(req.url ?? "/", "http://localhost");

  if (requestUrl.pathname === "/docs" || requestUrl.pathname === "/docs/") {
    serveDocPage(res);
    return;
  }

  const assetPath = requestUrl.pathname.replace("/docs/", "");
  serveStaticAsset(assetPath, res);
}

export function handleOpenApiJson(
  res: ServerResponse,
  openApiPath: string,
): void {
  if (!existsSync(openApiPath)) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "OpenAPI spec not available",
        message:
          "Ejecuta 'pnpm generate:openapi' en el gateway para generar el archivo.",
      }),
    );
    return;
  }

  const content = readFileSync(openApiPath, "utf-8");
  jsonResponse(res, content);
}
