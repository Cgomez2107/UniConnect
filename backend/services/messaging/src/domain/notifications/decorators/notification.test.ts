import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BaseNotification, PriorityDecorator, ActionDecorator } from "./index.js";

const baseInput = {
  mensaje: "Tienes una nueva solicitud de transferencia de administrador",
  destinatario: "user_abc123",
  timestamp: "2026-05-10T14:30:00.000Z",
};

describe("AC-01: BaseNotification", () => {
  it("debe crear una notificación con mensaje, destinatario y timestamp", () => {
    const notif = new BaseNotification(baseInput);

    assert.equal(notif.getMensaje(), baseInput.mensaje);
    assert.equal(notif.getDestinatario(), baseInput.destinatario);
    assert.equal(notif.getTimestamp(), baseInput.timestamp);
  });

  it("getMetadata debe retornar los tres campos base", () => {
    const notif = new BaseNotification(baseInput);
    const meta = notif.getMetadata();

    assert.equal(meta.mensaje, baseInput.mensaje);
    assert.equal(meta.destinatario, baseInput.destinatario);
    assert.equal(meta.timestamp, baseInput.timestamp);
  });

  it("toJSON debe coincidir con getMetadata", () => {
    const notif = new BaseNotification(baseInput);

    assert.deepEqual(notif.toJSON(), notif.getMetadata());
  });
});

describe("AC-02: PriorityDecorator", () => {
  it("debe añadir nivel 'normal'", () => {
    const notif = new PriorityDecorator(new BaseNotification(baseInput), "normal");

    assert.equal(notif.getNivel(), "normal");
    assert.equal(notif.getMetadata().nivel, "normal");
  });

  it("debe añadir nivel 'urgente'", () => {
    const notif = new PriorityDecorator(new BaseNotification(baseInput), "urgente");

    assert.equal(notif.getNivel(), "urgente");
    assert.equal(notif.getMetadata().nivel, "urgente");
  });

  it("debe añadir nivel 'critica'", () => {
    const notif = new PriorityDecorator(new BaseNotification(baseInput), "critica");

    assert.equal(notif.getNivel(), "critica");
    assert.equal(notif.getMetadata().nivel, "critica");
  });

  it("debe lanzar error con nivel inválido", () => {
    assert.throws(
      () => new PriorityDecorator(new BaseNotification(baseInput), "bajo" as "normal"),
      /Nivel inválido/,
    );
  });

  it("getMetadata debe incluir los campos base más nivel via spread", () => {
    const notif = new PriorityDecorator(new BaseNotification(baseInput), "urgente");
    const meta = notif.getMetadata();

    assert.equal(meta.mensaje, baseInput.mensaje);
    assert.equal(meta.destinatario, baseInput.destinatario);
    assert.equal(meta.timestamp, baseInput.timestamp);
    assert.equal(meta.nivel, "urgente");
  });
});

describe("AC-03: ActionDecorator", () => {
  const accion = { label: "Revisar solicitud", endpoint: "/api/v1/admin-transfers/pending" };

  it("debe añadir accion con label y endpoint", () => {
    const notif = new ActionDecorator(new BaseNotification(baseInput), accion);

    assert.deepEqual(notif.getAccion(), accion);
    const metaAccion = notif.getMetadata().accion as { label: string; endpoint: string };
    assert.equal(metaAccion.label, accion.label);
    assert.equal(metaAccion.endpoint, accion.endpoint);
  });

  it("debe lanzar error si la acción no tiene label", () => {
    assert.throws(
      () => new ActionDecorator(new BaseNotification(baseInput), { label: "", endpoint: "/api/test" }),
      /label.*endpoint/,
    );
  });

  it("debe lanzar error si la acción no tiene endpoint", () => {
    assert.throws(
      () => new ActionDecorator(new BaseNotification(baseInput), { label: "Test", endpoint: "" }),
      /label.*endpoint/,
    );
  });

  it("getMetadata debe incluir los campos base más accion via spread", () => {
    const notif = new ActionDecorator(new BaseNotification(baseInput), accion);
    const meta = notif.getMetadata();

    assert.equal(meta.mensaje, baseInput.mensaje);
    assert.equal(meta.destinatario, baseInput.destinatario);
    assert.equal(meta.timestamp, baseInput.timestamp);
    assert.deepEqual(meta.accion, accion);
  });
});

describe("AC-04: Composición en cadena", () => {
  it("toJSON debe contener campos de los tres niveles (base + prioridad + accion)", () => {
    const notif = new ActionDecorator(
      new PriorityDecorator(
        new BaseNotification(baseInput),
        "urgente",
      ),
      { label: "Revisar solicitud", endpoint: "/api/v1/admin-transfers/pending" },
    );

    const json = notif.toJSON();

    assert.equal(json.mensaje, baseInput.mensaje);
    assert.equal(json.destinatario, baseInput.destinatario);
    assert.equal(json.timestamp, baseInput.timestamp);
    assert.equal(json.nivel, "urgente");
    assert.deepEqual(json.accion, { label: "Revisar solicitud", endpoint: "/api/v1/admin-transfers/pending" });
  });

  it("toJSON con composición inversa (Action -> Priority -> Base) también funciona", () => {
    const notif = new PriorityDecorator(
      new ActionDecorator(
        new BaseNotification(baseInput),
        { label: "Ver", endpoint: "/api/test" },
      ),
      "critica",
    );

    const json = notif.toJSON();

    assert.equal(json.mensaje, baseInput.mensaje);
    assert.equal(json.nivel, "critica");
    assert.deepEqual(json.accion, { label: "Ver", endpoint: "/api/test" });
  });
});

describe("AC-05: Transparencia", () => {
  it("getMensaje debe retornar el valor original tras decorar con prioridad", () => {
    const base = new BaseNotification(baseInput);
    const decorado = new PriorityDecorator(base, "urgente");

    assert.equal(decorado.getMensaje(), baseInput.mensaje);
  });

  it("getMensaje debe retornar el valor original tras decorar con acción", () => {
    const base = new BaseNotification(baseInput);
    const decorado = new ActionDecorator(base, { label: "Test", endpoint: "/api/test" });

    assert.equal(decorado.getMensaje(), baseInput.mensaje);
  });

  it("getMensaje debe retornar el valor original tras composición completa", () => {
    const decorado = new ActionDecorator(
      new PriorityDecorator(
        new BaseNotification(baseInput),
        "critica",
      ),
      { label: "Test", endpoint: "/api/test" },
    );

    assert.equal(decorado.getMensaje(), baseInput.mensaje);
    assert.equal(decorado.getDestinatario(), baseInput.destinatario);
    assert.equal(decorado.getTimestamp(), baseInput.timestamp);
  });
});
