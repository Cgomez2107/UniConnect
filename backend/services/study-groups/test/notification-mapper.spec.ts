import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NotificationMapper, type MappingResult } from "../src/application/services/NotificationMapper.js";
import type { StudyGroupEvent } from "../src/domain/events/StudyGroupEvents.js";

const mapper = new NotificationMapper();
const BASE_TIME = new Date("2026-05-11T12:00:00.000Z");

function single(r: MappingResult[]): MappingResult {
  assert.equal(r.length, 1);
  return r[0];
}

describe("NotificationMapper — JOIN_REQUEST", () => {
  it("mapea correctamente un evento completo", () => {
    const event: StudyGroupEvent = {
      type: "JOIN_REQUEST",
      version: "1.0",
      timestamp: BASE_TIME,
      requestId: "req-001",
      applicantId: "user-applicant",
      recipientUserId: "user-recipient",
      message: "Quiero unirme!",
      groupName: "Grupo de Matematicas",
      applicantName: "Juan Perez",
    };

    const result = single(mapper.map(event));

    assert.equal(result.persistence.userId, "user-recipient");
    assert.equal(result.dto.userId, "user-recipient");
    assert.equal(result.dto.type, "solicitud_ingreso");
    assert.equal(result.dto.title, "Grupo de Matematicas");
    assert.equal(result.dto.body, "Juan Perez quiere unirse a tu grupo.");
    assert.equal(result.dto.priority, "normal");
    assert.deepEqual(result.dto.payload, {
      requestId: "req-001",
      applicantId: "user-applicant",
      message: "Quiero unirme!",
      applicantName: "Juan Perez",
      groupName: "Grupo de Matematicas",
    });
  });

  it("persistence y dto comparten userId, type, title, body, payload", () => {
    const event: StudyGroupEvent = {
      type: "JOIN_REQUEST",
      version: "1.0",
      timestamp: BASE_TIME,
      requestId: "req-002",
      applicantId: "user-a",
      recipientUserId: "user-r",
      message: "Hola",
      groupName: "Fisica",
      applicantName: "Ana",
    };

    const result = single(mapper.map(event));

    assert.equal(result.persistence.userId, result.dto.userId);
    assert.equal(result.persistence.type, result.dto.type);
    assert.equal(result.persistence.title, result.dto.title);
    assert.equal(result.persistence.body, result.dto.body);
    assert.deepEqual(result.persistence.payload, result.dto.payload);
  });
});

describe("NotificationMapper — MEMBER_ACCEPTED", () => {
  it("mapea correctamente", () => {
    const event: StudyGroupEvent = {
      type: "MEMBER_ACCEPTED",
      version: "1.0",
      timestamp: BASE_TIME,
      applicationId: "app-001",
      requestId: "req-001",
      applicantId: "user-applicant",
      applicantName: "Juan Perez",
      approvedBy: "user-admin",
      groupName: "Grupo de Matematicas",
    };

    const result = single(mapper.map(event));

    assert.equal(result.dto.userId, "user-applicant");
    assert.equal(result.dto.type, "miembro_aceptado");
    assert.equal(result.dto.body, "Tu solicitud para Grupo de Matematicas fue aceptada.");
    assert.ok(result.dto.payload?.approvedBy);
  });
});

describe("NotificationMapper — MEMBER_REJECTED", () => {
  it("mapea correctamente sin groupName", () => {
    const event: StudyGroupEvent = {
      type: "MEMBER_REJECTED",
      version: "1.0",
      timestamp: BASE_TIME,
      applicationId: "app-002",
      requestId: "req-002",
      applicantId: "user-applicant",
      rejectedBy: "user-admin",
    };

    const result = single(mapper.map(event));

    assert.equal(result.dto.userId, "user-applicant");
    assert.equal(result.dto.title, "Solicitud rechazada");
    assert.equal(result.dto.body, "Tu solicitud fue rechazada.");
    assert.equal(result.dto.priority, "normal");
  });
});

describe("NotificationMapper — ADMIN_TRANSFER_REQUESTED", () => {
  it("mapea usando newAdminId como destinatario y priority urgente", () => {
    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_REQUESTED",
      version: "1.0",
      timestamp: BASE_TIME,
      transferId: "trf-001",
      groupId: "grp-001",
      oldAdminId: "user-old-admin",
      newAdminId: "user-new-admin",
      newState: "PendienteTransferencia",
      groupName: "Grupo de Quimica",
    };

    const result = single(mapper.map(event));

    assert.equal(result.dto.userId, "user-new-admin");
    assert.equal(result.dto.type, "transferencia_admin_solicitada");
    assert.equal(result.dto.priority, "urgente");
    assert.equal(result.dto.title, "Grupo de Quimica");
    assert.ok(result.dto.payload?.transferId);
  });
});

describe("NotificationMapper — ADMIN_TRANSFER_ACCEPTED", () => {
  it("mapea usando oldAdminId como destinatario", () => {
    const event: StudyGroupEvent = {
      type: "ADMIN_TRANSFER_ACCEPTED",
      version: "1.0",
      timestamp: BASE_TIME,
      transferId: "trf-002",
      groupId: "grp-001",
      oldAdminId: "user-old-admin",
      newAdminId: "user-new-admin",
      newState: "TransferenciaAceptada",
      acceptedBy: "user-new-admin",
    };

    const result = single(mapper.map(event));

    assert.equal(result.dto.userId, "user-old-admin");
    assert.equal(result.dto.type, "transferencia_admin_aceptada");
    assert.equal(result.dto.title, "Transferencia aceptada");
    assert.equal(result.dto.body, "Tu transferencia de administracion fue aceptada.");
    assert.equal(result.dto.priority, "normal");
    assert.ok(result.dto.payload?.newAdminId);
  });
});

describe("NotificationMapper — AVAILABILITY_UPDATED", () => {
  it("mapea enviando al organizerId con el detalle de la actualizacion", () => {
    const event: StudyGroupEvent = {
      type: "AVAILABILITY_UPDATED",
      version: "1.0",
      timestamp: BASE_TIME,
      sessionId: "ses-001",
      requestId: "req-001",
      userId: "user-attendee",
      userName: "Maria Lopez",
      status: "confirmed",
      groupName: "Grupo de Fisica",
      organizerId: "user-organizer",
    };

    const result = single(mapper.map(event));

    assert.equal(result.dto.userId, "user-organizer");
    assert.equal(result.dto.type, "disponibilidad_actualizada");
    assert.equal(result.dto.title, "Grupo de Fisica");
    assert.equal(result.dto.body, "Maria Lopez ha confirmado su asistencia a la sesion.");
    assert.equal(result.dto.priority, "normal");
    assert.deepEqual(result.dto.payload, {
      sessionId: "ses-001",
      requestId: "req-001",
      userId: "user-attendee",
      status: "confirmed",
    });
  });

  it("mapea declined correctamente", () => {
    const event: StudyGroupEvent = {
      type: "AVAILABILITY_UPDATED",
      version: "1.0",
      timestamp: BASE_TIME,
      sessionId: "ses-002",
      requestId: "req-002",
      userId: "user-attendee",
      userName: "Carlos Ruiz",
      status: "declined",
      groupName: "Calculo",
      organizerId: "user-organizer",
    };

    const result = single(mapper.map(event));

    assert.equal(result.dto.userId, "user-organizer");
    assert.equal(result.dto.body, "Carlos Ruiz ha declinado su asistencia a la sesion.");
  });
});

describe("NotificationMapper — SESSION_CANCELLED", () => {
  it("mapea un resultado por cada attendee", () => {
    const event: StudyGroupEvent = {
      type: "SESSION_CANCELLED",
      version: "1.0",
      timestamp: BASE_TIME,
      sessionId: "ses-001",
      requestId: "req-001",
      title: "Sesion de Calculo",
      groupName: "Grupo de Calculo",
      attendeeIds: ["user-a", "user-b", "user-c"],
    };

    const results = mapper.map(event);

    assert.equal(results.length, 3);
    assert.equal(results[0].dto.userId, "user-a");
    assert.equal(results[1].dto.userId, "user-b");
    assert.equal(results[2].dto.userId, "user-c");
    assert.equal(results[0].dto.type, "sesion_cancelada");
    assert.equal(results[0].dto.priority, "urgente");
    assert.equal(results[0].dto.title, "Grupo de Calculo");
    assert.equal(results[0].dto.body, 'La sesion "Sesion de Calculo" ha sido cancelada.');
    assert.deepEqual(results[0].dto.payload, {
      sessionId: "ses-001",
      requestId: "req-001",
      title: "Sesion de Calculo",
    });
  });
});

describe("NotificationMapper — edge cases", () => {
  it("cada mapeo retorna tanto persistence como dto en cada resultado", () => {
    const events: StudyGroupEvent[] = [
      {
        type: "JOIN_REQUEST", version: "1.0", timestamp: BASE_TIME,
        requestId: "r", applicantId: "a", recipientUserId: "b",
        message: "m", groupName: "g", applicantName: "n",
      },
      {
        type: "MEMBER_ACCEPTED", version: "1.0", timestamp: BASE_TIME,
        applicationId: "a", requestId: "r", applicantId: "b",
        applicantName: "n", approvedBy: "ab", groupName: "g",
      },
      {
        type: "MEMBER_REJECTED", version: "1.0", timestamp: BASE_TIME,
        applicationId: "a", requestId: "r", applicantId: "b", rejectedBy: "rb",
      },
      {
        type: "ADMIN_TRANSFER_REQUESTED", version: "1.0", timestamp: BASE_TIME,
        transferId: "t", groupId: "g", oldAdminId: "oa", newAdminId: "na",
        newState: "PendienteTransferencia", groupName: "gn",
      },
      {
        type: "ADMIN_TRANSFER_ACCEPTED", version: "1.0", timestamp: BASE_TIME,
        transferId: "t", groupId: "g", oldAdminId: "oa", newAdminId: "na",
        newState: "TransferenciaAceptada", acceptedBy: "ab",
      },
    ];

    for (const event of events) {
      const results = mapper.map(event);
      assert.ok(results.length >= 1);
      for (const result of results) {
        assert.ok(result.persistence, `persistence missing for ${event.type}`);
        assert.ok(result.dto, `dto missing for ${event.type}`);
        assert.equal(typeof result.persistence.userId, "string");
        assert.equal(typeof result.dto.userId, "string");
        assert.equal(typeof result.dto.type, "string");
        assert.equal(typeof result.dto.title, "string");
        assert.equal(typeof result.dto.body, "string");
      }
    }
  });

  it("arroja TypeError si el tipo de evento no es manejado por el switch exhaustivo", () => {
    const bad = { type: "TIPO_INEXISTENTE" } as unknown as StudyGroupEvent;
    assert.throws(() => mapper.map(bad), TypeError);
  });
});
