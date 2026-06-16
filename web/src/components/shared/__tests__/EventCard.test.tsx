import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "../EventCard";
import type { CampusEventUI } from "@/types/ui";

vi.mock("@/hooks/useEventCategories", () => ({
  useEventCategories: () => [
    { id: "1", name: "Académico", slug: "academico", description: "", created_at: "2026-01-01" },
    { id: "2", name: "Cultural", slug: "cultural", description: "", created_at: "2026-01-01" },
    { id: "3", name: "Deportes", slug: "deportes", description: "", created_at: "2026-01-01" },
  ],
}));

function makeEvent(overrides: Partial<CampusEventUI> = {}): CampusEventUI {
  return {
    id: "evt-001",
    title: "Seminario de Redes",
    description: "Charla sobre redes neuronales y deep learning",
    eventDate: "2026-06-15T14:00:00.000Z",
    location: "Auditorio Central",
    category: "academico",
    imageUrl: null,
    createdBy: "user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "published",
    maxCapacity: 100,
    registeredCount: 0,
    isFull: false,
    ...overrides,
  };
}

describe("EventCard — Criterio 4: Cupo agotado / botón deshabilitado", () => {

  it("must show 'Cupo agotado' badge when isFull=true", () => {
    render(
      <EventCard
        event={makeEvent({ isFull: true, registeredCount: 100, maxCapacity: 100 })}
        onViewDetails={vi.fn()}
      />
    );
    expect(screen.getByText("Cupo agotado")).toBeDefined();
  });

  it("must NOT show 'Cupo agotado' badge when isFull=false", () => {
    render(
      <EventCard
        event={makeEvent({ isFull: false, registeredCount: 0, maxCapacity: 100 })}
        onViewDetails={vi.fn()}
      />
    );
    expect(screen.queryByText("Cupo agotado")).toBeNull();
  });

  it("must disable attend button and show 'No disponible' when isFull=true", () => {
    render(
      <EventCard
        event={makeEvent({ isFull: true, registeredCount: 100, maxCapacity: 100 })}
        onViewDetails={vi.fn()}
        onAttend={vi.fn()}
      />
    );
    const btn = screen.getByText("No disponible");
    expect(btn).toBeDefined();
    expect(btn.closest("button")).toHaveProperty("disabled", true);
  });

  it("must show enabled 'Asistir' button when isFull=false", () => {
    render(
      <EventCard
        event={makeEvent({ isFull: false, registeredCount: 25, maxCapacity: 100 })}
        onViewDetails={vi.fn()}
        onAttend={vi.fn()}
      />
    );
    const btn = screen.getByText("Asistir");
    expect(btn).toBeDefined();
    expect(btn.closest("button")).toHaveProperty("disabled", false);
  });

  it("must keep the event card visible even when full", () => {
    render(
      <EventCard
        event={makeEvent({ isFull: true, registeredCount: 100, maxCapacity: 100 })}
        onViewDetails={vi.fn()}
        onAttend={vi.fn()}
      />
    );
    expect(screen.getByText("Seminario de Redes")).toBeDefined();
    expect(screen.getByText("Ver detalles")).toBeDefined();
  });

  it("must show 'Cancelado' badge and event is visible when status=cancelled", () => {
    render(
      <EventCard
        event={makeEvent({ status: "cancelled", isFull: false })}
        onViewDetails={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("Cancelado")).toBeDefined();
    expect(screen.getByText("Seminario de Redes")).toBeDefined();
    expect(screen.getByText("Ver detalles")).toBeDefined();
  });
});

describe("EventCard — Highlight de texto (Criterio 3)", () => {

  it("must highlight matching terms in title with <mark>", () => {
    render(
      <EventCard
        event={makeEvent()}
        onViewDetails={vi.fn()}
        highlight="Redes"
      />
    );
    const title = screen.getByText((content, element) => {
      return element?.tagName === "MARK" && content === "Redes";
    });
    expect(title).toBeDefined();
  });

  it("must render title plain when no highlight term is given", () => {
    render(
      <EventCard
        event={makeEvent()}
        onViewDetails={vi.fn()}
      />
    );
    expect(screen.getByText("Seminario de Redes")).toBeDefined();
  });

  it("must highlight matching terms in description with <mark>", () => {
    render(
      <EventCard
        event={makeEvent()}
        onViewDetails={vi.fn()}
        highlight="neuronales"
      />
    );
    const mark = screen.getByText((content, element) => {
      return element?.tagName === "MARK" && content.toLowerCase() === "neuronales";
    });
    expect(mark).toBeDefined();
  });

  it("must be case-insensitive when highlighting", () => {
    render(
      <EventCard
        event={makeEvent()}
        onViewDetails={vi.fn()}
        highlight="REDES"
      />
    );
    const marks = screen.getAllByText((content, element) => {
      return element?.tagName === "MARK" && content.toLowerCase() === "redes";
    });
    expect(marks.length).toBe(2);
    expect(marks[0]).toBeDefined();
    expect(marks[1]).toBeDefined();
  });
});

describe("EventCard — Badges de estado", () => {

  it("must show 'Publicado' badge for published status", () => {
    render(
      <EventCard
        event={makeEvent({ status: "published" })}
        onViewDetails={vi.fn()}
      />
    );
    expect(screen.getByText("Publicado")).toBeDefined();
  });

  it("must show 'Cancelado' badge for cancelled status", () => {
    render(
      <EventCard
        event={makeEvent({ status: "cancelled" })}
        onViewDetails={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("Cancelado")).toBeDefined();
  });

  it("must show category badge with resolved name", () => {
    render(
      <EventCard
        event={makeEvent({ category: "academico" })}
        onViewDetails={vi.fn()}
      />
    );
    expect(screen.getByText("Académico")).toBeDefined();
  });

  it("must fallback to category slug when name not found", () => {
    render(
      <EventCard
        event={makeEvent({ category: "unknown-category" })}
        onViewDetails={vi.fn()}
      />
    );
    expect(screen.getByText("unknown-category")).toBeDefined();
  });
});
