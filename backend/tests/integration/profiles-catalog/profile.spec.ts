import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ProfilesCatalogController } from "../../../services/profiles-catalog/src/interfaces/http/controllers/ProfilesCatalogController.js";
import { GetFullProfile } from "../../../services/profiles-catalog/src/application/use-cases/GetFullProfile.js";
import { GetStudentPublicProfile } from "../../../services/profiles-catalog/src/application/use-cases/GetStudentPublicProfile.js";
import { createMockReqRes } from "../../support/httpHelpers.js";

describe("ProfilesCatalog - integración (perfil base vs completa)", () => {
  it("AC5 - GET /perfil/:id (base) no añade indicadores ni insignias y no invoca repositorios de indicadores", async () => {
    const student = {
      id: "user-2",
      fullName: "User2",
      avatarUrl: null,
      programName: "Ing",
      semester: 1,
      sharedSubjects: [],
    };

    const mockGetPublic = { execute: async (_id: string) => student } as unknown as GetStudentPublicProfile;

    const fakeIndicatorsRepo = {
      getIndicators: () => {
        throw new Error("Should not be called");
      },
      getBadges: () => {
        throw new Error("Should not be called");
      },
    } as any;

    const getFullProfileUC = new GetFullProfile(fakeIndicatorsRepo);

    const controller = new ProfilesCatalogController(
      {} as any,
      mockGetPublic as any,
      getFullProfileUC as any,
      {} as any,
      {} as any,
    );

    const { req, res, getBody } = createMockReqRes(`/perfil/${student.id}`, "GET");
    await controller.getStudentProfile(req as any, res as any, student.id);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(getBody());
    const payload = body.data;
    // Base profile must not contain indicadores nor insignias
    assert.equal(payload.indicadores, undefined);
    assert.equal(payload.insignias, undefined);
  });

  it("AC4 - GET /perfil/:id?vista=completa devuelve base + indicadores + insignias", async () => {
    const student = {
      id: "user-1",
      fullName: "Test User",
      avatarUrl: null,
      programName: "Ing",
      semester: 3,
      sharedSubjects: [],
    };

    const mockGetPublic = { execute: async (_id: string) => student } as unknown as GetStudentPublicProfile;

    const fakeIndicatorsRepo = {
      getIndicators: async () => ({ gruposBajoAdministracion: 1, gruposParticipa: 2, mensajesEnviados: 10 }),
      getBadges: async () => [{ id: "b1", nombre: "Badge", descripcion: "", iconoUrl: "", fechaObtenida: new Date().toISOString() }],
    } as any;

    const getFullProfileUC = new GetFullProfile(fakeIndicatorsRepo);

    const controller = new ProfilesCatalogController(
      {} as any,
      mockGetPublic as any,
      getFullProfileUC as any,
      {} as any,
      {} as any,
    );

    const { req, res, getBody } = createMockReqRes(`/perfil/${student.id}?vista=completa`, "GET");
    await controller.getStudentProfile(req as any, res as any, student.id);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(getBody());
    const payload = body.data;

    // Base fields
    assert.equal(payload.id, student.id);
    assert.equal(payload.fullName, student.fullName);

    // Decorator fields
    assert(payload.indicadores);
    assert.equal(typeof payload.indicadores.gruposBajoAdministracion, "number");
    assert(Array.isArray(payload.insignias));
  });

  it("Resiliencia: si repo de indicadores falla, retorna BaseProfile (sin excepcionar)", async () => {
    const student = { id: "user-3", fullName: "User3", avatarUrl: null, programName: "Ing", semester: 2, sharedSubjects: [] };

    const mockGetPublic = { execute: async () => student } as any;

    const failingRepo = {
      getIndicators: async () => { throw new Error("DB down"); },
      getBadges: async () => { throw new Error("DB down"); },
    } as any;

    const getFullProfileUC = new GetFullProfile(failingRepo);
    const controller = new ProfilesCatalogController({} as any, mockGetPublic as any, getFullProfileUC as any, {} as any, {} as any);

    const { req, res, getBody } = createMockReqRes(`/perfil/${student.id}?vista=completa`, "GET");
    await controller.getStudentProfile(req as any, res as any, student.id);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(getBody());
    const payload = body.data;
    // Should return base fields only, no indicadores or insignias
    assert.equal(payload.id, student.id);
    assert.equal(payload.indicadores, undefined);
    assert.equal(payload.insignias, undefined);
  });
});
