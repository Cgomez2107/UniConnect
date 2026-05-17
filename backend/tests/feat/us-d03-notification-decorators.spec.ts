import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseNotification, PriorityDecorator, ActionDecorator } from "../../shared/patterns/decorator/notification/index.js";

const baseInput = {
  mensaje: "Tienes una nueva solicitud de transferencia de administrador",
  destinatario: "user_abc123",
  timestamp: "2026-05-10T14:30:00.000Z",
};

describe("US-D03 - Decorators de notificación", () => {
  describe("AC-01: BaseNotification", () => {
    it("debe exponer mensaje, destinatario y timestamp sin decoradores", () => {
      const notif = new BaseNotification(baseInput);

      assert.equal(notif.getMensaje(), baseInput.mensaje);
      assert.equal(notif.getDestinatario(), baseInput.destinatario);
      assert.equal(notif.getTimestamp(), baseInput.timestamp);
      assert.deepEqual(notif.toJSON(), {
        mensaje: baseInput.mensaje,
        destinatario: baseInput.destinatario,
        timestamp: baseInput.timestamp,
      });
    });
  });

  describe("AC-02: PriorityDecorator", () => {
    it("debe aceptar solo normal, urgente y critica", () => {
      const normal = new PriorityDecorator(new BaseNotification(baseInput), "normal");
      const urgente = new PriorityDecorator(new BaseNotification(baseInput), "urgente");
      const critica = new PriorityDecorator(new BaseNotification(baseInput), "critica");

      assert.equal(normal.getMetadata().nivel, "normal");
      assert.equal(urgente.getMetadata().nivel, "urgente");
      assert.equal(critica.getMetadata().nivel, "critica");
      assert.throws(
        () => new PriorityDecorator(new BaseNotification(baseInput), "bajo" as "normal"),
        /Nivel inválido/,
      );
    });

    it("debe conservar los campos base al añadir la prioridad", () => {
      const notif = new PriorityDecorator(new BaseNotification(baseInput), "urgente");
      const meta = notif.getMetadata();

      assert.equal(meta.mensaje, baseInput.mensaje);
      assert.equal(meta.destinatario, baseInput.destinatario);
      assert.equal(meta.timestamp, baseInput.timestamp);
      assert.equal(meta.nivel, "urgente");
      assert.equal(notif.getMensaje(), baseInput.mensaje);
      assert.equal(notif.getDestinatario(), baseInput.destinatario);
      assert.equal(notif.getTimestamp(), baseInput.timestamp);
    });
  });

  describe("AC-03: ActionDecorator", () => {
    const accion = { label: "Revisar solicitud", endpoint: "/api/v1/admin-transfers/pending" };

    it("debe conservar los campos base al añadir la acción", () => {
      const notif = new ActionDecorator(new BaseNotification(baseInput), accion);
      const meta = notif.getMetadata();

      assert.equal(meta.mensaje, baseInput.mensaje);
      assert.equal(meta.destinatario, baseInput.destinatario);
      assert.equal(meta.timestamp, baseInput.timestamp);
      assert.deepEqual(meta.accion, accion);
      assert.equal(notif.getMensaje(), baseInput.mensaje);
      assert.equal(notif.getDestinatario(), baseInput.destinatario);
      assert.equal(notif.getTimestamp(), baseInput.timestamp);
    });

    it("debe rechazar acciones incompletas", () => {
      assert.throws(
        () => new ActionDecorator(new BaseNotification(baseInput), { label: "", endpoint: "/api/test" }),
        /label.*endpoint/,
      );
      assert.throws(
        () => new ActionDecorator(new BaseNotification(baseInput), { label: "Test", endpoint: "" }),
        /label.*endpoint/,
      );
    });
  });

  describe("Apilamiento completo", () => {
    it("debe fusionar Base + Prioridad + Acción sin perder datos", () => {
      const notif = new ActionDecorator(
        new PriorityDecorator(new BaseNotification(baseInput), "urgente"),
        { label: "Revisar solicitud", endpoint: "/api/v1/admin-transfers/pending" },
      );

      const json = notif.toJSON();

      assert.deepEqual(json, {
        mensaje: baseInput.mensaje,
        destinatario: baseInput.destinatario,
        timestamp: baseInput.timestamp,
        nivel: "urgente",
        accion: { label: "Revisar solicitud", endpoint: "/api/v1/admin-transfers/pending" },
      });
      assert.equal(notif.getMensaje(), baseInput.mensaje);
      assert.equal(notif.getDestinatario(), baseInput.destinatario);
      assert.equal(notif.getTimestamp(), baseInput.timestamp);
    });
  });

  describe("Colisión de metadata (sobrescritura predecible)", () => {
    it("el decorador externo debe sobrescribir la clave existente en metadata", () => {
      // Mock: decorador interno que fuerza un nivel 'normal' en metadata
      // Definimos el mock localmente en el test
      class InnerNivelDecorator {
        notification: any;
        constructor(notification: any) {
          this.notification = notification;
        }
        getMensaje() { return this.notification.getMensaje(); }
        getDestinatario() { return this.notification.getDestinatario(); }
        getTimestamp() { return this.notification.getTimestamp(); }
        getMetadata() { return { ...this.notification.getMetadata(), nivel: "normal" }; }
        toJSON() { return this.getMetadata(); }
      }

      const inner = new InnerNivelDecorator(new BaseNotification(baseInput));
      const wrapped = new PriorityDecorator(inner as any, "critica");

      const json = wrapped.toJSON();

      // El nivel debe corresponder al decorador externo ('critica')
      assert.equal(json.nivel, "critica");

      // Campos base intactos
      assert.equal(json.mensaje, baseInput.mensaje);
      assert.equal(json.destinatario, baseInput.destinatario);
      assert.equal(json.timestamp, baseInput.timestamp);
    });
  });
});