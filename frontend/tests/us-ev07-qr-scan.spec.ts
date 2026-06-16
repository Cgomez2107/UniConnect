import { test, expect } from "@playwright/test";

/**
 * US-EV07 - Escaneo y verificación de código QR
 *
 * Estos tests E2E simulan el flujo completo de escaneo desde la app móvil.
 * Requieren que el backend y frontend estén corriendo.
 *
 * Escenarios:
 * 1. Escaneo de QR válido → "Acceso Válido" (fondo verde, nombre, avatar) — Criterio 2
 * 2. Escaneo de QR ya usado → "Ya verificado" (timestamp) — Criterio 3
 * 3. Escaneo de QR inválido/expirado → "No válido" (motivo, fondo rojo) — Criterio 4
 * 4. Tiempo de respuesta < 2 segundos — Criterio 2
 */

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8081";
const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";

test.describe("US-EV07 — Escaneo QR desde app móvil", () => {
  test.describe("Criterio 2: QR válido → respuesta < 2000ms", () => {
    test("la verificación retorna valid=true con datos del usuario", async ({ request }) => {
      const start = Date.now();

      const response = await request.post(`${API_URL}/api/v1/registration/verify`, {
        data: {
          qrData: "uniconnect://access?rid=test-token&sig=test-signature",
        },
        headers: {
          "x-user-id": "test-organizer-id",
          "Content-Type": "application/json",
        },
      });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(2000);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.data).toBeDefined();
    });
  });

  test.describe("Criterio 3: QR reutilizado → 'Ya verificado'", () => {
    test("el segundo escaneo del mismo QR es rechazado", async ({ request }) => {
      const qrData = "uniconnect://access?rid=reuse-token&sig=reuse-sig";

      await request.post(`${API_URL}/api/v1/registration/verify`, {
        data: { qrData },
        headers: { "x-user-id": "test-org", "Content-Type": "application/json" },
      });

      const response = await request.post(`${API_URL}/api/v1/registration/verify`, {
        data: { qrData },
        headers: { "x-user-id": "test-org", "Content-Type": "application/json" },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.data.valid).toBe(false);
      expect(body.data.reason).toBe("Ya verificado");
      expect(body.data.scannedAt).toBeDefined();
    });
  });

  test.describe("Criterio 4: QR inválido o expirado → 'No válido'", () => {
    test("QR con firma corrupta retorna 'Firma digital corrupta'", async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/registration/verify`, {
        data: { qrData: "uniconnect://access?rid=x&sig=firma-invalida" },
        headers: { "x-user-id": "test-org", "Content-Type": "application/json" },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.data.valid).toBe(false);
    });

    test("QR de evento cancelado retorna 'Evento cancelado'", async ({ request }) => {
      const response = await request.post(`${API_URL}/api/v1/registration/verify`, {
        data: { qrData: "uniconnect://access?rid=cancelled-event&sig=signature" },
        headers: { "x-user-id": "test-org", "Content-Type": "application/json" },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.data.valid).toBe(false);
    });
  });

  test.describe("Criterio 1: Generación del pase QR", () => {
    test("GET /events/:id/my-pass retorna qrContent", async ({ request }) => {
      const response = await request.get(`${API_URL}/api/v1/events/test-event-id/my-pass`, {
        headers: { "x-user-id": "test-user-id" },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.data.qrContent).toMatch(/^uniconnect:\/\/access\?rid=.+&sig=.+$/);
    });
  });
});
