import assert from "node:assert/strict";
import { describe, it } from "node:test";

/**
 * Pruebas de lógica de permisos para recursos de estudio (US-V03).
 *
 * Regla: El botón "Editar recurso" y las acciones de modificación
 * deben permitirse solo si:
 *   currentUser.id === recurso.ownerId
 *   O currentUser.role === "admin"
 */

type Role = "estudiante" | "admin";

interface User {
  id: string;
  role: Role;
}

interface Recurso {
  id: string;
  uploaderUserId: string;
  titulo: string;
}

function canEditResource(user: User | null | undefined, recurso: Recurso): boolean {
  if (!user || !recurso) return false;
  return user.id === recurso.uploaderUserId || user.role === "admin";
}

describe("Lógica de permisos — Editar recurso (US-V03)", () => {
  const recurso = {
    id: "rec-001",
    uploaderUserId: "owner-123",
    titulo: "Apuntes de Cálculo",
  };

  describe("Owner (propietario del recurso)", () => {
    it("debe poder editar su propio recurso", () => {
      const owner: User = { id: "owner-123", role: "estudiante" };
      assert.equal(canEditResource(owner, recurso), true);
    });

    it("debe poder editar incluso si es admin también", () => {
      const ownerAdmin: User = { id: "owner-123", role: "admin" };
      assert.equal(canEditResource(ownerAdmin, recurso), true);
    });
  });

  describe("Admin (rol administrador)", () => {
    it("debe poder editar un recurso ajeno", () => {
      const admin: User = { id: "admin-999", role: "admin" };
      assert.equal(canEditResource(admin, recurso), true);
    });
  });

  describe("Estudiante aleatorio (sin permisos)", () => {
    it("NO debe poder editar un recurso ajeno", () => {
      const randomStudent: User = { id: "student-456", role: "estudiante" };
      assert.equal(canEditResource(randomStudent, recurso), false);
    });

    it("NO debe poder editar aunque tenga otro recurso propio", () => {
      const otherStudent: User = { id: "student-789", role: "estudiante" };
      assert.equal(canEditResource(otherStudent, recurso), false);
    });
  });

  describe("Casos borde", () => {
    it("usuario undefined/null no debe poder editar", () => {
      const result1 = canEditResource(null as unknown as User, recurso);
      const result2 = canEditResource(undefined as unknown as User, recurso);
      assert.equal(result1, false);
      assert.equal(result2, false);
    });
  });
});
