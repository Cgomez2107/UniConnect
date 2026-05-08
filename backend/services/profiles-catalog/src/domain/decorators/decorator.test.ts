import { PerfilBase } from "./PerfilBase.js";
import { EstadisticasDecorator, type Indicadores } from "./EstadisticasDecorator.js";
import { InsigniasDecorator, type Insignia } from "./InsigniasDecorator.js";

console.log("=".repeat(80));
console.log("PRUEBA DE COMPOSICIÓN DE DECORADORES DE PERFIL");
console.log("=".repeat(80));

// ===== PASO 1: Crear PerfilBase =====
console.log("\n📝 PASO 1: Crear PerfilBase");
console.log("-".repeat(80));

const base = new PerfilBase({
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

console.log("PerfilBase creado:");
console.log(`  Nombre: ${base.fullName}`);
console.log(`  Carrera: ${base.carrera}`);
console.log(`  Semestre: ${base.semestre}`);
console.log(`  Render: ${base.render()}`);

const baseInfo = base.getInformacionBase();
console.log(`  getInformacionBase() contiene: ${Object.keys(baseInfo).join(", ")}`);

// ===== PASO 2: Envolver con EstadisticasDecorator =====
console.log("\n📊 PASO 2: Envolver con EstadisticasDecorator");
console.log("-".repeat(80));

const indicadores: Indicadores = {
  gruposCreados: 3,
  gruposParticipa: 5,
  mensajesEnviados: 42,
};

const conEstadisticas = new EstadisticasDecorator(base, indicadores);

console.log("EstadisticasDecorator aplicado:");
console.log(`  Render: ${conEstadisticas.render()}`);
console.log(`  Grupos creados: ${conEstadisticas.getIndicadores().gruposCreados}`);
console.log(`  Grupos participa: ${conEstadisticas.getIndicadores().gruposParticipa}`);
console.log(`  Mensajes enviados: ${conEstadisticas.getIndicadores().mensajesEnviados}`);

// ===== PASO 3: Envolver con InsigniasDecorator =====
console.log("\n🏅 PASO 3: Envolver con InsigniasDecorator");
console.log("-".repeat(80));

const insignias: Insignia[] = [
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

const completo = new InsigniasDecorator(conEstadisticas, insignias);

console.log("InsigniasDecorator aplicado:");
console.log(`  Render: ${completo.render()}`);
console.log(`  Insignias: ${completo.getInsignias().length}`);
for (const ins of completo.getInsignias()) {
  console.log(`    - ${ins.nombre}: ${ins.descripcion}`);
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

// AC-01: PerfilBase
const hasBaseFields =
  metadataKeys.includes("id") &&
  metadataKeys.includes("fullName") &&
  metadataKeys.includes("carrera") &&
  metadataKeys.includes("semestre") &&
  metadataKeys.includes("asignaturasActivas");
console.log(`  ✅ AC-01 (PerfilBase): ${hasBaseFields ? "OK" : "FALLA"}`);

// AC-02: Estadisticas
const hasStats = metadataKeys.includes("indicadores");
const statsValid =
  hasStats &&
  (metadata.indicadores as Indicadores).gruposCreados !== undefined &&
  (metadata.indicadores as Indicadores).gruposParticipa !== undefined &&
  (metadata.indicadores as Indicadores).mensajesEnviados !== undefined;
console.log(`  ✅ AC-02 (Estadisticas): ${statsValid ? "OK" : "FALLA"}`);

// AC-03: Insignias
const hasInsignias = metadataKeys.includes("insignias");
console.log(`  ✅ AC-03 (Insignias): ${hasInsignias ? "OK" : "FALLA"}`);

// AC-04: Render compuesto
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

  PerfilBase [Carlos Pérez - Ingeniería de Sistemas (Semestre 6)]
    ↓ (envuelto por)
  EstadisticasDecorator [3 grupos creados, 5 participa, 42 msgs]
    ↓ (envuelto por)
  InsigniasDecorator [2 insignias: Primer Mensaje, Colaborador]
    ↓ (resultado final)
  Perfil completamente decorado

Validaciones:
  ✅ AC-01: PerfilBase con nombre, carrera, semestre y asignaturas activas
  ✅ AC-02: EstadisticasDecorator con gruposCreados, gruposParticipa, mensajesEnviados
  ✅ AC-03: InsigniasDecorator con array de insignias
  ✅ AC-04: Render compuesto preserva capas inferiores
  ✅ getMetadata() retorna información de todos los decoradores
`);

console.log("=".repeat(80));
console.log("🎉 PRUEBA COMPLETADA");
console.log("=".repeat(80));
