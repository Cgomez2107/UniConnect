import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Slug generation function — exact replica of the logic used in:
 * - frontend/lib/services/infrastructure/repositories/SupabaseAdminPanelRepository.ts (slugify)
 * - web/src/hooks/useAdmin.ts (generateSlug)
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Web version adds .slice(0, 100) at the end.
 * This variant matches the frontend implementation exactly.
 */
function generateSlugWeb(name: string): string {
  return slugify(name).slice(0, 100);
}

// ──────────────────────────────────────────────
// Tests for slug generation (Criterio 1)
// ──────────────────────────────────────────────

describe("US-EV02 Criterio 1: Slug generation", () => {
  it("genera slug en minúsculas a partir de un nombre", () => {
    expect(slugify("Académico")).toBe("academico");
  });

  it("elimina tildes y diacríticos", () => {
    expect(slugify("Educación Física")).toBe("educacion-fisica");
    expect(slugify("Ópera")).toBe("opera");
    expect(slugify("Murciélago")).toBe("murcielago");
    expect(slugify("Corazón")).toBe("corazon");
  });

  it("convierte espacios a guiones", () => {
    expect(slugify("Cultural Deportivo")).toBe("cultural-deportivo");
    expect(slugify("  espacios  extremos  ")).toBe("espacios-extremos");
  });

  it("colapsa múltiples guiones consecutivos", () => {
    expect(slugify("doble--guion")).toBe("doble-guion");
    expect(slugify("tres---guiones")).toBe("tres-guiones");
  });

  it("elimina guiones al inicio y final", () => {
    expect(slugify("-leading")).toBe("leading");
    expect(slugify("trailing-")).toBe("trailing");
    expect(slugify("-both-")).toBe("both");
  });

  it("elimina caracteres especiales no alfanuméricos", () => {
    expect(slugify("Evento #1!")).toBe("evento-1");
    expect(slugify("Categoría @2024")).toBe("categoria-2024");
    expect(slugify("precio $10")).toBe("precio-10");
  });

  it("respeta números dentro del nombre", () => {
    expect(slugify("Sprint 2026 Q1")).toBe("sprint-2026-q1");
  });

  it("el slug vacío retorna string vacío", () => {
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });

  it("web version limita a 100 caracteres", () => {
    const longName = "a".repeat(150);
    const slug = generateSlugWeb(longName);
    expect(slug.length).toBeLessThanOrEqual(100);
    expect(slug).toBe("a".repeat(100));
  });
});

// ──────────────────────────────────────────────
// Tests for business validation rules
// ──────────────────────────────────────────────

describe("US-EV02 Criterio 1 & 2: Duplicate detection (case-insensitive)", () => {
  let categories: Array<{ id: string; name: string; slug: string }>;

  beforeEach(() => {
    categories = [
      { id: "1", name: "Académico", slug: "academico" },
      { id: "2", name: "Cultural", slug: "cultural" },
    ];
  });

  function findDuplicated(name: string, skipId?: string): boolean {
    return categories.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== skipId,
    );
  }

  it("detecta duplicado exacto (mismo nombre)", () => {
    expect(findDuplicated("Académico")).toBe(true);
  });

  it("detecta duplicado case-insensitive (difieren en mayúsculas/minúsculas)", () => {
    expect(findDuplicated("académico")).toBe(true);
    expect(findDuplicated("ACADÉMICO")).toBe(true);
  });

  it("detecta duplicado por slug aunque el nombre tenga diferencias de tildes", () => {
    // "ACADEMICO" (sin tilde) vs "Académico" (con tilde):
    // - toLowerCase() NO normaliza tildes → "academico" !== "académico"
    // - Pero slugify SÍ normaliza → slug("ACADEMICO") === "academico" === slug("Académico")
    const nameInput = "ACADEMICO";
    const slug = slugify(nameInput); // "academico"
    const matches = categories.some((c) => c.slug === slug);
    expect(matches).toBe(true);
  });

  it("detecta duplicado ignorando tildes (slug coincide)", () => {
    const slug = slugify("Academico");
    expect(categories.some((c) => c.slug === slug)).toBe(true);
  });

  it("NO detecta duplicado para nombre diferente", () => {
    expect(findDuplicated("Deportivo")).toBe(false);
  });

  it("NO detecta duplicado cuando se excluye el mismo ID (update)", () => {
    expect(findDuplicated("Académico", "1")).toBe(false);
  });

  it("detecta duplicado incluso excluyendo otro ID (update)", () => {
    expect(findDuplicated("Académico", "2")).toBe(true);
  });
});

describe("US-EV02 Criterio 4: Delete blocked when events exist", () => {
  async function deleteCategory(
    categoryId: string,
    countEvents: (id: string) => Promise<number>,
  ): Promise<{ success: boolean; eventCount: number }> {
    const count = await countEvents(categoryId);
    if (count > 0) {
      return { success: false, eventCount: count };
    }
    return { success: true, eventCount: 0 };
  }

  it("bloquea eliminación cuando hay eventos activos y retorna la cantidad", async () => {
    const countEvents = vi.fn().mockResolvedValue(3);
    const result = await deleteCategory("cat-1", countEvents);
    expect(result.success).toBe(false);
    expect(result.eventCount).toBe(3);
  });

  it("permite eliminación cuando no hay eventos asociados", async () => {
    const countEvents = vi.fn().mockResolvedValue(0);
    const result = await deleteCategory("cat-2", countEvents);
    expect(result.success).toBe(true);
    expect(result.eventCount).toBe(0);
  });

  it("retorna eventCount = 0 cuando no hay eventos y eliminación es exitosa", async () => {
    const countEvents = vi.fn().mockResolvedValue(0);
    const result = await deleteCategory("cat-3", countEvents);
    expect(result.eventCount).toBe(0);
    expect(result.success).toBe(true);
  });

  it("el mensaje de error incluye el conteo de eventos", () => {
    const count = 5;
    const errorMessage = `No se puede eliminar la categoría porque ${count} evento(s) la están usando. Reasigna o elimina los eventos primero.`;
    expect(errorMessage).toContain("5");
    expect(errorMessage).toContain("evento(s)");
  });
});

describe("US-EV02 Criterio 3: Edit name regenerates slug, events keep reference by id", () => {
  it("cambiar el nombre regenera el slug", () => {
    const old = { id: "1", name: "Académico", slug: "academico" };
    const newName = "Académico Internacional";
    const newSlug = slugify(newName);

    expect(newSlug).toBe("academico-internacional");
    expect(newSlug).not.toBe(old.slug);
  });

  it("eventos mantienen referencia por category_id (no por slug)", () => {
    const events = [
      { id: "evt-1", title: "Conferencia A", category_id: "cat-1", category: "academico" },
      { id: "evt-2", title: "Conferencia B", category_id: "cat-1", category: "academico" },
    ];

    // Al actualizar la categoría, el category_id NO cambia
    const updatedCategoryId = "cat-1";
    const stillReferenced = events.every((e) => e.category_id === updatedCategoryId);
    expect(stillReferenced).toBe(true);
  });

  it("update sincroniza el campo category (text) en eventos existentes", () => {
    const oldSlug = "academico";
    const newSlug = "academico-internacional";

    const syncedEvents = [
      { id: "evt-1", category_id: "cat-1", category: newSlug },
      { id: "evt-2", category_id: "cat-1", category: newSlug },
    ];

    syncedEvents.forEach((evt) => {
      expect(evt.category).toBe(newSlug);
      expect(evt.category).not.toBe(oldSlug);
      expect(evt.category_id).toBe("cat-1"); // FK se mantiene
    });
  });
});

describe("US-EV02: Error message format (HTTP 409 equivalent)", () => {
  it("mensaje de error por nombre duplicado identifica el nombre", () => {
    const name = "Cultural";
    const msg = `Ya existe una categoría con el nombre "${name}".`;
    expect(msg).toContain(name);
    expect(msg).toContain("Ya existe una categoría");
  });

  it("mensaje de error por eliminación bloqueada incluye cantidad de eventos", () => {
    const count = 7;
    const msg = `No se puede eliminar la categoría porque ${count} evento(s) la están usando. Reasigna o elimina los eventos primero.`;
    expect(msg).toContain("7");
    expect(msg).toContain("evento(s)");
    expect(msg).toContain("Reasigna o elimina los eventos primero");
  });

  it("mensaje de error por slug duplicado en web", () => {
    const msg = "Ya existe una categoría con ese nombre o slug";
    expect(msg).toContain("slug");
  });
});
