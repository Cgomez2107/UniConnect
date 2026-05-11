import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ProfilesCatalogController } from "../../src/interfaces/http/controllers/ProfilesCatalogController.js";
import { GetFullProfile } from "../../src/application/use-cases/GetFullProfile.js";
import { createMockReqRes } from "../support/httpHelpers.js";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

describe("Perf: comparar latencia entre vista base y completa (lógica)", () => {
  it("base debe ser significativamente más rápida cuando indicadores tienen latencia", async () => {
    const student = { id: "u-perf", fullName: "Perf", avatarUrl: null, programName: "Ing", semester: 1, sharedSubjects: [] };

    const mockGetPublic = { execute: async () => student } as any;

    // Simulate DB latency in indicators repo
    let indicatorsCalled = 0;
    const slowIndicatorsRepo = {
      getIndicators: async () => { indicatorsCalled++; await delay(50); return { gruposCreados: 2, gruposParticipa: 1, mensajesEnviados: 5 }; },
      getBadges: async () => { indicatorsCalled++; await delay(20); return []; },
    } as any;

    const getFullProfileUC = new GetFullProfile(slowIndicatorsRepo);
    const controller = new ProfilesCatalogController({} as any, mockGetPublic as any, getFullProfileUC as any, {} as any, {} as any);

    const iterations = 5;
    const baseTimes: number[] = [];
    const fullTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const { req, res } = createMockReqRes(`/perfil/${student.id}`, "GET");
      const t0 = Date.now();
      await controller.getStudentProfile(req as any, res as any, student.id);
      baseTimes.push(Date.now() - t0);
    }

    for (let i = 0; i < iterations; i++) {
      const { req, res } = createMockReqRes(`/perfil/${student.id}?vista=completa`, "GET");
      const t0 = Date.now();
      await controller.getStudentProfile(req as any, res as any, student.id);
      fullTimes.push(Date.now() - t0);
    }

    const avg = (arr: number[]) => Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    const avgBase = avg(baseTimes);
    const avgFull = avg(fullTimes);

    // Expect that average full view is higher than base by at least 20ms (since we added artificial delays)
    assert(avgFull - avgBase >= 20, `avgFull (${avgFull}ms) should be >= avgBase (${avgBase}ms) + 20`);
    // Also ensure indicators were called during full view (indicatorsCalled > 0)
    assert(indicatorsCalled > 0, "Indicators repository should have been called for full view");
  });
});
