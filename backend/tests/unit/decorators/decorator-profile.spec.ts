import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BaseProfile } from "../../../services/profiles-catalog/src/domain/decorators/BaseProfile.js";
import { StatisticsDecorator } from "../../../services/profiles-catalog/src/domain/decorators/StatisticsDecorator.js";
import type { Indicators } from "../../../services/profiles-catalog/src/domain/decorators/StatisticsDecorator.js";
import { BadgesDecorator } from "../../../services/profiles-catalog/src/domain/decorators/BadgesDecorator.js";
import type { Badge } from "../../../services/profiles-catalog/src/domain/decorators/BadgesDecorator.js";

describe("Decorator Pattern - Perfiles de Estudiante", () => {
  describe("BaseProfile", () => {
    it("debe asignar id, fullName, avatarUrl, carrera, semestre y asignaturasActivas correctamente", () => {
      const profile = new BaseProfile({
        id: "user-001",
        fullName: "Carlos Pérez",
        avatarUrl: "https://avatares.test.com/carlos.jpg",
        carrera: "Ingeniería de Sistemas",
        semestre: 6,
        asignaturasActivas: [
          { id: "mat-1", name: "Cálculo III" },
          { id: "mat-2", name: "Estructuras de Datos" },
        ],
      });

      assert.equal(profile.id, "user-001");
      assert.equal(profile.fullName, "Carlos Pérez");
      assert.equal(profile.avatarUrl, "https://avatares.test.com/carlos.jpg");
      assert.equal(profile.carrera, "Ingeniería de Sistemas");
      assert.equal(profile.semestre, 6);
      assert.equal(profile.asignaturasActivas.length, 2);
      assert.equal(profile.asignaturasActivas[0].name, "Cálculo III");
    });

    it("render() debe retornar formato 'Nombre - Carrera (Semestre X)'", () => {
      const profile = new BaseProfile({
        id: "user-002",
        fullName: "Ana Martínez",
        avatarUrl: null,
        carrera: "Medicina",
        semestre: 4,
        asignaturasActivas: [],
      });

      assert.equal(profile.render(), "Ana Martínez - Medicina (Semestre 4)");
    });

    it("render() con semestre null debe mostrar '?'", () => {
      const profile = new BaseProfile({
        id: "user-003",
        fullName: "Luis Gómez",
        avatarUrl: null,
        carrera: "Derecho",
        semestre: null,
        asignaturasActivas: [],
      });

      assert.equal(profile.render(), "Luis Gómez - Derecho (Semestre ?)");
    });

    it("getMetadata() solo debe incluir campos base, sin indicadores ni insignias", () => {
      const profile = new BaseProfile({
        id: "user-004",
        fullName: "Sofía Torres",
        avatarUrl: null,
        carrera: "Arquitectura",
        semestre: 8,
        asignaturasActivas: [],
      });

      const metadata = profile.getMetadata();

      assert.equal(metadata.id, "user-004");
      assert.equal(metadata.fullName, "Sofía Torres");
      assert.equal(metadata.carrera, "Arquitectura");
      assert.equal(metadata.semestre, 8);

      assert.equal("indicadores" in metadata, false);
      assert.equal("insignias" in metadata, false);
    });

    it("toJSON() debe serializar todos los campos base", () => {
      const profile = new BaseProfile({
        id: "user-005",
        fullName: "Pedro Ramírez",
        avatarUrl: null,
        carrera: "Psicología",
        semestre: 2,
        asignaturasActivas: [{ id: "mat-a", name: "Introducción" }],
      });

      const json = profile.toJSON();

      assert.equal(json.id, "user-005");
      assert.equal(json.fullName, "Pedro Ramírez");
      assert.equal(json.carrera, "Psicología");
      assert.equal(json.semestre, 2);
      assert(Array.isArray(json.asignaturasActivas));
    });
  });

  describe("StatisticsDecorator", () => {
    const indicators: Indicators = {
      gruposBajoAdministracion: 3,
      gruposParticipa: 5,
      mensajesEnviados: 42,
    };

    it("getMetadata() debe combinar indicadores con los campos base del perfil", () => {
      const base = new BaseProfile({
        id: "user-010",
        fullName: "María López",
        avatarUrl: null,
        carrera: "Ingeniería Civil",
        semestre: 7,
        asignaturasActivas: [],
      });

      const decorated = new StatisticsDecorator(base, indicators);
      const metadata = decorated.getMetadata();

      assert.equal(metadata.id, "user-010");
      assert.equal(metadata.fullName, "María López");
      assert.equal(metadata.carrera, "Ingeniería Civil");

      const ind = metadata.indicadores as Indicators;
      assert.equal(ind.gruposBajoAdministracion, 3);
      assert.equal(ind.gruposParticipa, 5);
      assert.equal(ind.mensajesEnviados, 42);
    });

    it("render() debe incluir estadísticas de actividad formateadas correctamente", () => {
      const base = new BaseProfile({
        id: "user-011",
        fullName: "Jorge Díaz",
        avatarUrl: null,
        carrera: "Administración",
        semestre: 5,
        asignaturasActivas: [],
      });

      const decorated = new StatisticsDecorator(base, indicators);
      const rendered = decorated.render();

      assert(rendered.includes("Jorge Díaz"));
      assert(rendered.includes("Administración"));
      assert(rendered.includes("42 msgs"));
      assert(rendered.includes("3 grupos administrados"));
      assert(rendered.includes("participa en 5"));
    });

    it("getIndicators() debe retornar los indicadores exactos", () => {
      const base = new BaseProfile({
        id: "user-012",
        fullName: "Elena Ruiz",
        avatarUrl: null,
        carrera: "Biología",
        semestre: 3,
        asignaturasActivas: [],
      });

      const decorated = new StatisticsDecorator(base, indicators);
      const result = decorated.getIndicators();

      assert.equal(result, indicators);
    });

    it("getBaseInfo() debe delegar al perfil interno sin modificaciones", () => {
      const base = new BaseProfile({
        id: "user-013",
        fullName: "Diego Vega",
        avatarUrl: "https://avatares.test.com/diego.jpg",
        carrera: "Física",
        semestre: 6,
        asignaturasActivas: [{ id: "mat-x", name: "Termodinámica" }],
      });

      const decorated = new StatisticsDecorator(base, indicators);
      const baseInfo = decorated.getBaseInfo();

      assert.equal(baseInfo.id, "user-013");
      assert.equal(baseInfo.fullName, "Diego Vega");
      assert.equal(baseInfo.carrera, "Física");
      assert(Array.isArray(baseInfo.asignaturasActivas));
      assert.equal("indicadores" in baseInfo, false);
    });
  });

  describe("BadgesDecorator", () => {
    const badges: Badge[] = [
      {
        id: "primer-mensaje",
        nombre: "Primer Mensaje",
        descripcion: "Has enviado tu primer mensaje",
        iconoUrl: "/insignias/primer-mensaje.svg",
        fechaObtenida: "2026-05-01",
      },
      {
        id: "colaborador",
        nombre: "Colaborador",
        descripcion: "Participas en grupos de estudio",
        iconoUrl: "/insignias/colaborador.svg",
        fechaObtenida: "2026-05-10",
      },
    ];

    it("getMetadata() debe combinar insignias con los campos base del perfil", () => {
      const base = new BaseProfile({
        id: "user-020",
        fullName: "Lucía Fernández",
        avatarUrl: null,
        carrera: "Diseño Gráfico",
        semestre: 4,
        asignaturasActivas: [],
      });

      const decorated = new BadgesDecorator(base, badges);
      const metadata = decorated.getMetadata();

      assert.equal(metadata.id, "user-020");
      assert.equal(metadata.fullName, "Lucía Fernández");

      const ins = metadata.insignias as Badge[];
      assert.equal(ins.length, 2);
      assert.equal(ins[0].nombre, "Primer Mensaje");
      assert.equal(ins[1].nombre, "Colaborador");
    });

    it("render() sin insignias debe retornar solo el render del perfil interno", () => {
      const base = new BaseProfile({
        id: "user-021",
        fullName: "Raúl Medina",
        avatarUrl: null,
        carrera: "Matemáticas",
        semestre: 6,
        asignaturasActivas: [],
      });

      const decorated = new BadgesDecorator(base, []);
      const rendered = decorated.render();

      assert.equal(rendered, "Raúl Medina - Matemáticas (Semestre 6)");
    });

    it("render() con 1 insignia debe decir '1 insignia desbloqueada' (singular)", () => {
      const base = new BaseProfile({
        id: "user-022",
        fullName: "Clara Ríos",
        avatarUrl: null,
        carrera: "Química",
        semestre: 2,
        asignaturasActivas: [],
      });

      const singleBadge: Badge[] = [
        {
          id: "b1",
          nombre: "Bienvenida",
          descripcion: "Te uniste a UniConnect",
          iconoUrl: "/insignias/bienvenida.svg",
          fechaObtenida: "2026-05-01",
        },
      ];

      const decorated = new BadgesDecorator(base, singleBadge);
      const rendered = decorated.render();

      assert(rendered.includes("1 insignia desbloqueada"));
    });

    it("render() con 2+ insignias debe pluralizar correctamente", () => {
      const base = new BaseProfile({
        id: "user-023",
        fullName: "Héctor Cruz",
        avatarUrl: null,
        carrera: "Ingeniería Eléctrica",
        semestre: 8,
        asignaturasActivas: [],
      });

      const decorated = new BadgesDecorator(base, badges);
      const rendered = decorated.render();

      assert(rendered.includes("2 insignias desbloqueadas"));
    });

    it("getBadges() debe retornar el array de objetos Badge completo", () => {
      const base = new BaseProfile({
        id: "user-024",
        fullName: "Natalia Paz",
        avatarUrl: null,
        carrera: "Medicina Veterinaria",
        semestre: 5,
        asignaturasActivas: [],
      });

      const decorated = new BadgesDecorator(base, badges);
      const result = decorated.getBadges();

      assert.equal(result.length, 2);
      assert.equal(result[0].id, "primer-mensaje");
      assert.equal(result[0].nombre, "Primer Mensaje");
      assert.equal(result[0].iconoUrl, "/insignias/primer-mensaje.svg");
      assert.equal(result[1].id, "colaborador");
    });
  });

  describe("Composición: BadgesDecorator(StatisticsDecorator(BaseProfile))", () => {
    const indicators: Indicators = {
      gruposBajoAdministracion: 2,
      gruposParticipa: 4,
      mensajesEnviados: 17,
    };

    const badges: Badge[] = [
      {
        id: "b1",
        nombre: "Primer Mensaje",
        descripcion: "Enviaste tu primer mensaje",
        iconoUrl: "/insignias/b1.svg",
        fechaObtenida: "2026-05-01",
      },
    ];

    it("la metadata completa debe incluir todos los campos: base + indicadores + insignias", () => {
      const base = new BaseProfile({
        id: "user-030",
        fullName: "Camila Soto",
        avatarUrl: null,
        carrera: "Artes Visuales",
        semestre: 3,
        asignaturasActivas: [],
      });

      const decorated = new BadgesDecorator(new StatisticsDecorator(base, indicators), badges);
      const metadata = decorated.getMetadata();

      assert.equal(metadata.id, "user-030");
      assert.equal(metadata.fullName, "Camila Soto");

      const ind = metadata.indicadores as Indicators;
      assert.equal(ind.mensajesEnviados, 17);

      const ins = metadata.insignias as Badge[];
      assert.equal(ins.length, 1);
      assert.equal(ins[0].nombre, "Primer Mensaje");
    });

    it("toJSON() debe serializar el árbol completo de decoradores", () => {
      const base = new BaseProfile({
        id: "user-031",
        fullName: "Felipe Ávila",
        avatarUrl: null,
        carrera: "Economía",
        semestre: 7,
        asignaturasActivas: [{ id: "m1", name: "Macroeconomía" }],
      });

      const decorated = new BadgesDecorator(new StatisticsDecorator(base, indicators), badges);
      const json = decorated.toJSON();

      assert.equal(json.id, "user-031");
      assert.equal(json.fullName, "Felipe Ávila");
      assert(json.indicadores);
      assert(json.insignias);
    });

    it("render() compuesto debe incluir informacion de base + stats + badges", () => {
      const base = new BaseProfile({
        id: "user-032",
        fullName: "Valentina Ríos",
        avatarUrl: null,
        carrera: "Sociología",
        semestre: 5,
        asignaturasActivas: [],
      });

      const decorated = new BadgesDecorator(new StatisticsDecorator(base, indicators), badges);
      const rendered = decorated.render();

      assert(rendered.includes("Valentina Ríos"));
      assert(rendered.includes("Sociología"));
      assert(rendered.includes("17 msgs"));
      assert(rendered.includes("1 insignia desbloqueada"));
    });
  });
});
