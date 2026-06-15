import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const NO_CONTEXT_MESSAGE = "No encontré información específica sobre eso en el manual de UniConnect";

interface Chunk {
  pageContent: string;
  score: number;
  metadata?: { id?: string; source?: string };
}

interface PipelineInput {
  pregunta: string;
  rol: string;
  userId: string;
}

interface PipelineOutput {
  hasContext: boolean;
  context: string;
  referencias: Array<{ id: string; source: string; similarity: number }>;
  pregunta: string;
  rol: string;
  userId: string;
  chunksCount: number;
}

const UMBRAL = 0.75;

function getContent(item: Chunk): string | null {
  return item.pageContent || null;
}

function getScore(item: Chunk): number {
  return item.score ?? 0;
}

function buildPrompt(context: string, rol: string, pregunta: string): string {
  const base = rol === "admin"
    ? "Eres un asistente técnico y de administración para UniConnect. Tienes acceso a información de configuración, moderación de contenido, logs del sistema y métricas de uso. Responde de forma precisa y técnica a las consultas exclusivas del rol administrador."
    : "Eres un asistente virtual para estudiantes de UniConnect. Responde de forma amable, clara y accesible. Solo responde temas que tengan que ver con la sección de estudiantes (crear grupos de estudio, ver próximos eventos, subir recursos académicos). Si el usuario pregunta por configuraciones técnicas, logs, métricas o moderación, responde amablemente que no tienes permisos para acceder a esa información.";

  const contextLines = context
    .split("\n---\n")
    .filter(c => c.trim().length >= 20);

  return `${base}\n\nINSTRUCCIONES ESTRICTAS:\n- Responde ÚNICAMENTE con información del contexto de abajo.\n- NO inventes. Si no está en el contexto, di: "${NO_CONTEXT_MESSAGE}"\n\n=== CONTEXTO ===\n${contextLines.join("\n---\n")}\n=== FIN ===`;
}

function runPipelineFilter(results: Chunk[], input: PipelineInput): PipelineOutput {
  const valid = results.filter(r => getContent(r) !== null && getScore(r) > UMBRAL);

  if (valid.length === 0) {
    return {
      hasContext: false,
      context: "",
      referencias: [],
      pregunta: input.pregunta,
      rol: input.rol,
      userId: input.userId,
      chunksCount: 0,
    };
  }

  const context = valid.map(r => getContent(r)).join("\n---\n");
  const referencias = valid.map((r, i) => ({
    id: r.metadata?.id || `chunk-${i + 1}`,
    source: r.metadata?.source || "Manual UniConnect",
    similarity: getScore(r),
  }));

  const systemPrompt = buildPrompt(context, input.rol, input.pregunta);

  return {
    hasContext: true,
    context: systemPrompt,
    referencias,
    pregunta: input.pregunta,
    rol: input.rol,
    userId: input.userId,
    chunksCount: valid.length,
  };
}

describe("RAG Pipeline Simulation — Semantic Similarity & Threshold (US-CB03)", () => {
  const baseInput: PipelineInput = {
    pregunta: "¿Cómo crear un grupo de estudio?",
    rol: "estudiante",
    userId: "user-001",
  };

  describe("Criterion 1: Chunks with similarity > 0.75 are selected", () => {
    it("should keep only chunks with score > 0.75", () => {
      const results: Chunk[] = [
        { pageContent: "Para crear un grupo de estudio...", score: 0.92, metadata: { id: "chunk-a" } },
        { pageContent: "Los grupos permiten colaboración...", score: 0.88, metadata: { id: "chunk-b" } },
        { pageContent: "Puedes invitar miembros...", score: 0.76, metadata: { id: "chunk-c" } },
        { pageContent: "La plataforma tiene chat...", score: 0.74, metadata: { id: "chunk-d" } },
        { pageContent: "Los eventos se crean...", score: 0.70, metadata: { id: "chunk-e" } },
      ];

      const output = runPipelineFilter(results, baseInput);

      expect(output.hasContext).toBe(true);
      expect(output.chunksCount).toBe(3);
      expect(output.referencias).toHaveLength(3);
      expect(output.referencias.every(r => r.similarity > 0.75)).toBe(true);
      expect(output.referencias.map(r => r.id)).toEqual(["chunk-a", "chunk-b", "chunk-c"]);
    });

    it("should include all chunks when all exceed threshold", () => {
      const results: Chunk[] = [
        { pageContent: "Texto relevante A", score: 0.96 },
        { pageContent: "Texto relevante B", score: 0.91 },
        { pageContent: "Texto relevante C", score: 0.88 },
        { pageContent: "Texto relevante D", score: 0.82 },
        { pageContent: "Texto relevante E", score: 0.79 },
      ];

      const output = runPipelineFilter(results, baseInput);
      expect(output.hasContext).toBe(true);
      expect(output.chunksCount).toBe(5);
    });
  });

  describe("Criterion 2: No chunk exceeds threshold → default message", () => {
    it("should return no context when all chunks are below threshold", () => {
      const results: Chunk[] = [
        { pageContent: "Contenido no relevante", score: 0.70 },
        { pageContent: "Texto sin relación", score: 0.65 },
        { pageContent: "Otro fragmento", score: 0.60 },
        { pageContent: "Poco relevante", score: 0.55 },
        { pageContent: "Nada que ver", score: 0.50 },
      ];

      const output = runPipelineFilter(results, baseInput);

      expect(output.hasContext).toBe(false);
      expect(output.context).toBe("");
      expect(output.referencias).toEqual([]);
      expect(output.chunksCount).toBe(0);
      expect(output.pregunta).toBe(baseInput.pregunta);
      expect(output.rol).toBe(baseInput.rol);
      expect(output.userId).toBe(baseInput.userId);
    });

    it("should return no context when results array is empty", () => {
      const output = runPipelineFilter([], baseInput);
      expect(output.hasContext).toBe(false);
      expect(output.chunksCount).toBe(0);
    });

    it("should handle chunks with null content gracefully", () => {
      const results: Chunk[] = [
        { pageContent: "", score: 0.90 },
        { pageContent: null as unknown as string, score: 0.85 },
        { pageContent: "Texto válido", score: 0.72 },
      ];

      const output = runPipelineFilter(results, baseInput);
      expect(output.hasContext).toBe(false);
      expect(output.chunksCount).toBe(0);
    });
  });

  describe("Prompt construction with context and role", () => {
    it("should include retrieved context in the prompt for estudiante", () => {
      const results: Chunk[] = [
        { pageContent: "Los grupos de estudio se crean en el menú.", score: 0.91 },
      ];

      const output = runPipelineFilter(results, baseInput);

      expect(output.context).toContain("asistente virtual para estudiantes");
      expect(output.context).toContain("Los grupos de estudio se crean en el menú.");
      expect(output.context).toContain(NO_CONTEXT_MESSAGE);
    });

    it("should use admin prompt when rol is admin", () => {
      const results: Chunk[] = [
        { pageContent: "Configuración del sistema disponible.", score: 0.95 },
      ];

      const output = runPipelineFilter(results, { ...baseInput, rol: "admin" });

      expect(output.context).toContain("asistente técnico y de administración");
      expect(output.context).toContain("logs del sistema");
      expect(output.context).toContain("métricas de uso");
    });

    it("should provide referencias with similarity scores", () => {
      const results: Chunk[] = [
        { pageContent: "Texto A", score: 0.95, metadata: { id: "chunk-1", source: "Manual UniConnect" } },
        { pageContent: "Texto B", score: 0.82, metadata: { id: "chunk-2", source: "Manual UniConnect" } },
      ];

      const output = runPipelineFilter(results, baseInput);

      expect(output.referencias).toEqual([
        { id: "chunk-1", source: "Manual UniConnect", similarity: 0.95 },
        { id: "chunk-2", source: "Manual UniConnect", similarity: 0.82 },
      ]);
    });
  });

  describe("Performance simulation (Criterion 3)", () => {
    it("should execute the pipeline filter in less than 8 seconds", async () => {
      const results: Chunk[] = Array.from({ length: 5 }, (_, i) => ({
        pageContent: `Chunk de prueba número ${i + 1} con contenido relevante sobre UniConnect.`,
        score: 0.80 + i * 0.04,
        metadata: { id: `chunk-${i + 1}`, source: "Manual UniConnect" },
      }));

      const start = performance.now();
      const output = runPipelineFilter(results, baseInput);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(8000);
      expect(output.hasContext).toBe(true);
    });
  });
});
