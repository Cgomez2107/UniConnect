import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { EventosPage } from "../EventosPage";
import eventsService from "@/lib/services/events.service";
import type { CampusEventUI } from "@/types/ui";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/lib/services/events.service");

vi.mock("@/hooks/useEventCategories", () => ({
  useEventCategories: () => [
    { id: "1", name: "Académico", slug: "academico", description: "", created_at: "2026-01-01" },
    { id: "2", name: "Cultural", slug: "cultural", description: "", created_at: "2026-01-01" },
    { id: "3", name: "Deportes", slug: "deportes", description: "", created_at: "2026-01-01" },
    { id: "4", name: "Arte", slug: "arte", description: "", created_at: "2026-01-01" },
  ],
}));

vi.mock("@/store/useAuthStore", () => ({
  useAuthStore: (selector: any) => selector({ user: { id: "test-user" } }),
}));

vi.mock("@/store/useEventSubscriptionStore", () => ({
  useEventSubscriptionStore: (selector: any) =>
    selector({ subscribedCategories: [], toggle: vi.fn() }),
}));

vi.mock("@/hooks", () => ({
  useEventsSync: vi.fn(),
}));

vi.mock("@/hooks/useNotifications", () => ({
  default: () => ({ success: vi.fn(), error: vi.fn() }),
}));

function makeEvent(id: string, overrides: Partial<CampusEventUI> = {}): CampusEventUI {
  return {
    id,
    title: `Evento ${id}`,
    description: `Descripción del evento ${id}`,
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

function renderPage() {
  return render(<EventosPage />);
}

describe("EventosPage — Criterio 1: Paginación y orden", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("C1a: must request page=1 and perPage=10 on initial load", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(1);
    });

    const filters = mockList.mock.calls[0][0];
    expect(filters.page).toBe(1);
    expect(filters.perPage).toBe(10);
    expect(filters.status).toBe("published");
  });

  it("C1b: must show pagination controls when totalPages > 1", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    const events = Array.from({ length: 10 }, (_, i) => makeEvent(`evt-${i + 1}`));
    mockList.mockResolvedValue({
      data: events,
      meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1 / 3")).toBeDefined();
    });

    expect(screen.getByText("← Anterior")).toBeDefined();
    expect(screen.getByText("Siguiente →")).toBeDefined();
  });

  it("C1c: must disable 'Anterior' button on page 1", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    const events = Array.from({ length: 10 }, (_, i) => makeEvent(`evt-${i + 1}`));
    mockList.mockResolvedValue({
      data: events,
      meta: { total: 25, page: 1, limit: 10, totalPages: 3 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1 / 3")).toBeDefined();
    });

    const prevBtn = screen.getByText("← Anterior");
    expect(prevBtn.closest("button")).toHaveProperty("disabled", true);
  });

  it("C1d: must disable 'Siguiente' button on last page", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);

    mockList.mockResolvedValueOnce({
      data: Array.from({ length: 10 }, (_, i) => makeEvent(`evt-${i + 1}`)),
      meta: { total: 12, page: 1, limit: 10, totalPages: 2 },
    });

    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeDefined();
    });

    const nextBtn = screen.getByText("Siguiente →");
    expect(nextBtn.closest("button")).toHaveProperty("disabled", false);

    mockList.mockResolvedValueOnce({
      data: [makeEvent("evt-11"), makeEvent("evt-12")],
      meta: { total: 12, page: 2, limit: 10, totalPages: 2 },
    });

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText("2 / 2")).toBeDefined();
    });

    expect(nextBtn.closest("button")).toHaveProperty("disabled", true);
  });

  it("C1e: must NOT show pagination when totalPages <= 1", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Evento 1")).toBeDefined();
    });

    expect(screen.queryByText("← Anterior")).toBeNull();
    expect(screen.queryByText("Siguiente →")).toBeNull();
  });
});

describe("EventosPage — Criterio 2: Filtros por categoría", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("C2a: must list category pills from useEventCategories", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Todas")).toBeDefined();
    });

    expect(screen.getAllByText("Académico").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Cultural")).toBeDefined();
    expect(screen.getByText("Deportes")).toBeDefined();
    expect(screen.getByText("Arte")).toBeDefined();
  });

  it("C2b: clicking a category must reset page to 1 and call API with categories", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Todas")).toBeDefined();
    });

    mockList.mockClear();
    mockList.mockResolvedValue({
      data: [makeEvent("2", { category: "deportes" })],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    fireEvent.click(screen.getByText("Deportes"));

    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });

    const filters = mockList.mock.calls[0][0];
    expect(filters.categories).toContain("deportes");
    expect(filters.page).toBe(1);
  });

  it("C2c: clicking 'Todas' must clear all category filters", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Todas")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Deportes"));

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledTimes(2);
    });

    mockList.mockClear();
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    fireEvent.click(screen.getByText("Todas"));

    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });

    const filters = mockList.mock.calls[0][0];
    expect(filters.categories).toBeUndefined();
  });
});

describe("EventosPage — Criterio 1+2: Contador de resultados", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("must show 'X eventos encontrados' when there are results", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 5, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("5 eventos encontrados")).toBeDefined();
    });
  });

  it("must show '1 evento encontrado' when total is 1", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("1 evento encontrado")).toBeDefined();
    });
  });
});

describe("EventosPage — Criterio 3: Búsqueda con debounce", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function waitForDebounce(): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
  }

  it("C3a: must NOT trigger search when input has < 3 characters", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));

    mockList.mockClear();
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const searchInput = screen.getByPlaceholderText("Buscar eventos...");
    fireEvent.change(searchInput, { target: { value: "ab" } });

    await waitForDebounce();

    const searchCalls = mockList.mock.calls.filter((c: any) => c[0]?.search);
    expect(searchCalls.length).toBe(0);
  });

  it("C3b: must trigger search after 300ms debounce when input has >= 3 characters", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));

    mockList.mockClear();
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const searchInput = screen.getByPlaceholderText("Buscar eventos...");
    fireEvent.change(searchInput, { target: { value: "redes" } });

    await waitForDebounce();

    const searchCalls = mockList.mock.calls.filter((c: any) => c[0]?.search);
    expect(searchCalls.length).toBe(1);
    expect(searchCalls[0][0].search).toBe("redes");
  });

  it("C3c: must reset debounce timer when user types quickly", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));

    mockList.mockClear();
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    const searchInput = screen.getByPlaceholderText("Buscar eventos...");

    fireEvent.change(searchInput, { target: { value: "red" } });
    await new Promise((r) => setTimeout(r, 200));

    fireEvent.change(searchInput, { target: { value: "redes neuronales" } });
    await new Promise((r) => setTimeout(r, 200));

    const callsBeforeFinal = mockList.mock.calls.filter((c: any) => c[0]?.search);
    expect(callsBeforeFinal.length).toBe(0);

    await waitForDebounce();

    const searchCalls = mockList.mock.calls.filter((c: any) => c[0]?.search);
    expect(searchCalls.length).toBe(1);
    expect(searchCalls[0][0].search).toBe("redes neuronales");
  });
});

describe("EventosPage — Limpiar filtros", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("must show 'Limpiar filtros' when a filter is active", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Todas")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Deportes"));

    await waitFor(() => {
      expect(screen.getByText("Limpiar filtros")).toBeDefined();
    });
  });

  it("must clear all filters when 'Limpiar filtros' is clicked", async () => {
    const mockList = vi.mocked(eventsService.listEventsPaginated);
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    vi.mocked(eventsService.listEvents).mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Todas")).toBeDefined();
    });

    fireEvent.click(screen.getByText("Deportes"));

    await waitFor(() => {
      expect(screen.getByText("Limpiar filtros")).toBeDefined();
    });

    mockList.mockClear();
    mockList.mockResolvedValue({
      data: [makeEvent("1")],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });

    fireEvent.click(screen.getByText("Limpiar filtros"));

    await waitFor(() => {
      expect(mockList).toHaveBeenCalled();
    });

    const filters = mockList.mock.calls[0][0];
    expect(filters.categories).toBeUndefined();
    expect(filters.search).toBeUndefined();
  });
});
