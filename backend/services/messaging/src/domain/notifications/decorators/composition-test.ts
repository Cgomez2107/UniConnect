/**
 * composition-test.ts
 *
 * Prueba de composición: Base → PriorityDecorator → ActionDecorator.
 * Demuestra que los datos se acumulan correctamente sin modificar la base.
 *
 * Uso: npx tsx composition-test.ts
 */

import { BaseNotification } from "./BaseNotification.js";
import { PriorityDecorator } from "./PriorityDecorator.js";
import { ActionDecorator } from "./ActionDecorator.js";

// ─── PASO 1: BaseNotification ───────────────────────────────────────────────

const base = new BaseNotification({
  mensaje: "Tienes una nueva solicitud de transferencia de administrador",
  destinatario: "user_abc123",
  timestamp: "2026-05-10T14:30:00.000Z",
});

console.log("=".repeat(70));
console.log("PASO 1: BaseNotification (solo)");
console.log("=".repeat(70));
console.log(`  Render: ${base.render()}`);
console.log(`  JSON:   ${JSON.stringify(base.toJSON())}\n`);

// ─── PASO 2: Envolver con PriorityDecorator (urgente) ───────────────────────

const urgente = new PriorityDecorator(base, "urgente");

console.log("=".repeat(70));
console.log("PASO 2: PriorityDecorator(nivel=urgente) sobre Base");
console.log("=".repeat(70));
console.log(`  Nivel:  ${urgente.getNivel()}`);
console.log(`  Render: ${urgente.render()}`);
console.log(`  JSON:   ${JSON.stringify(urgente.toJSON())}\n`);

// ─── PASO 3: Envolver con ActionDecorator ────────────────────────────────────

const completo = new ActionDecorator(urgente, {
  label: "Revisar solicitud",
  endpoint: "/api/v1/admin-transfers/pending",
});

console.log("=".repeat(70));
console.log("PASO 3: ActionDecorator sobre PriorityDecorator(Base)");
console.log("=".repeat(70));
console.log(`  Render: ${completo.render()}`);
console.log(`  Acción: ${JSON.stringify(completo.getAccion())}`);
console.log(`  JSON:`);
console.log(JSON.stringify(completo.toJSON(), null, 2));

// ─── VALIDACIÓN ──────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(70));
console.log("VALIDACIÓN DE COMPOSICIÓN");
console.log("=".repeat(70));

const json = completo.toJSON();
const checks = [
  json.mensaje === "Tienes una nueva solicitud de transferencia de administrador",
  json.destinatario === "user_abc123",
  json.timestamp === "2026-05-10T14:30:00.000Z",
  json.nivel === "urgente",
  (json.accion as any).label === "Revisar solicitud",
  (json.accion as any).endpoint === "/api/v1/admin-transfers/pending",
  Object.keys(json).length === 5,
];

checks.forEach((ok, i) => {
  console.log(`  ${ok ? "✅" : "❌"} Check ${i + 1}: ${ok ? "OK" : "FALLA"}`);
});

const allOk = checks.every(Boolean);
console.log(allOk
  ? "\n  ✅ TODAS LAS VALIDACIONES PASARON — Composición correcta."
  : "\n  ❌ HAY FALLOS — Revisar la implementación."
);
