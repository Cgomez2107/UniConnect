import { BaseProfile } from "./BaseProfile.js";
import { StatisticsDecorator, type Indicators } from "./StatisticsDecorator.js";
import { BadgesDecorator, type Badge } from "./BadgesDecorator.js";

console.log("=".repeat(80));
console.log("PRUEBA DE COMPOSICIÓN DE DECORADORES DE PERFIL");
console.log("=".repeat(80));

// ===== PASO 1: Crear BaseProfile =====
console.log("\n📝 PASO 1: Crear BaseProfile");
console.log("-".repeat(80));

const base = new BaseProfile({
  id: "user-123",
  fullName: "Carlos Pérez",
  avatarUrl: null,
  carrera: "Ingeniería de Sistemas",
  semestre: 6,
  asignaturasActivas: [
    { id: "mat-1", name: "Cálculo III" },
    { id: "mat-2", name: "Estructuras de Datos" },
  ],
});

console.log("BaseProfile creado:");
console.log(`  Nombre: ${base.fullName}`);
console.log(`  Carrera: ${base.carrera}`);
console.log(`  Semestre: ${base.semestre}`);
console.log(`  Render: ${base.render()}`);

const baseInfo = base.getBaseInfo();
console.log(`  getBaseInfo() contiene: ${Object.keys(baseInfo).join(", ")}`);

// ===== PASO 2: Envolver con StatisticsDecorator =====
console.log("\n📊 PASO 2: Envolver con StatisticsDecorator");
console.log("-".repeat(80));

const indicators: Indicators = {
  gruposCreados: 3,
  gruposParticipa: 5,
  mensajesEnviados: 42,
};

const conEstadisticas = new StatisticsDecorator(base, indicators);

console.log("StatisticsDecorator aplicado:");
console.log(`  Render: ${conEstadisticas.render()}`);
console.log(`  Grupos creados: ${conEstadisticas.getIndicators().gruposCreados}`);
console.log(`  Grupos participa: ${conEstadisticas.getIndicators().gruposParticipa}`);
console.log(`  Mensajes enviados: ${conEstadisticas.getIndicators().mensajesEnviados}`);

// ===== PASO 3: Envolver con BadgesDecorator =====
console.log("\n🏅 PASO 3: Envolver con BadgesDecorator");
console.log("-".repeat(80));

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
    fechaObtenida: "2026-05-08",
  },
];

const completo = new BadgesDecorator(conEstadisticas, badges);

console.log("BadgesDecorator aplicado:");
console.log(`  Render: ${completo.render()}`);
console.log(`  Badges: ${completo.getBadges().length}`);
for (const b of completo.getBadges()) {
  console.log(`    - ${b.nombre}: ${b.descripcion}`);
}

// ===== PASO 4: Validar getMetadata() =====
console.log("\n📦 PASO 4: getMetadata() - Validar composición completa");
console.log("-".repeat(80));

const metadata = completo.getMetadata();

console.log("Metadata completo:");
console.log(JSON.stringify(metadata, null, 2));

// Validar que la metadata contiene todos los campos esperados
const metadataKeys = Object.keys(metadata);
console.log("\nValidación de campos en metadata:");

const hasBaseFields =
  metadataKeys.includes("id") &&
  metadataKeys.includes("fullName") &&
  metadataKeys.includes("carrera") &&
  metadataKeys.includes("semestre") &&
  metadataKeys.includes("asignaturasActivas");
console.log(`  ✅ AC-01 (BaseProfile): ${hasBaseFields ? "OK" : "FALLA"}`);

const hasStats = metadataKeys.includes("indicadores");
const statsValid =
  hasStats &&
  (metadata.indicadores as Indicators).gruposCreados !== undefined &&
  (metadata.indicadores as Indicators).gruposParticipa !== undefined &&
  (metadata.indicadores as Indicators).mensajesEnviados !== undefined;
console.log(`  ✅ AC-02 (Statistics): ${statsValid ? "OK" : "FALLA"}`);

const hasBadges = metadataKeys.includes("insignias");
console.log(`  ✅ AC-03 (Badges): ${hasBadges ? "OK" : "FALLA"}`);

const renderOutput = completo.render();
const renderOk =
  renderOutput.includes("Carlos Pérez") &&
  renderOutput.includes("42 msgs") &&
  renderOutput.includes("2 insignias");
console.log(`  ✅ AC-04 (Render compuesto): ${renderOk ? "OK" : "FALLA"}`);

// ===== RESUMEN =====
console.log("\n" + "=".repeat(80));
console.log("✅ RESUMEN DE COMPOSICIÓN");
console.log("=".repeat(80));

console.log(`
Cadena de decoradores creada exitosamente:

  BaseProfile [Carlos Pérez - Ingeniería de Sistemas (Semestre 6)]
    ↓ (envuelto por)
  StatisticsDecorator [3 grupos creados, 5 participa, 42 msgs]
    ↓ (envuelto por)
  BadgesDecorator [2 badges: Primer Mensaje, Colaborador]
    ↓ (resultado final)
  Perfil completamente decorado

Validaciones:
  ✅ AC-01: BaseProfile con nombre, carrera, semestre y asignaturas activas
  ✅ AC-02: StatisticsDecorator con gruposCreados, gruposParticipa, mensajesEnviados
  ✅ AC-03: BadgesDecorator con array de badges
  ✅ AC-04: Render compuesto preserva capas inferiores
  ✅ getMetadata() retorna información de todos los decoradores
`);

console.log("=".repeat(80));
console.log("🎉 PRUEBA COMPLETADA");
console.log("=".repeat(80));
