import React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommunityGuidelinesDialog } from "../CommunityGuidelinesDialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("CommunityGuidelinesDialog", () => {
  it("should render spam prevention guidelines when errorCode is MO_003", () => {
    render(
      <CommunityGuidelinesDialog open={true} onClose={() => {}} errorCode="MO_003" />
    );

    expect(screen.getByText("Normas de la Comunidad")).toBeDefined();
    expect(screen.getByText("Prevención de Spam")).toBeDefined();
    expect(screen.getByText(/El envío rápido y masivo de mensajes/)).toBeDefined();
    expect(screen.getByText("Entendido")).toBeDefined();
  });

  it("should render human review guidelines when errorCode is MO_004", () => {
    render(
      <CommunityGuidelinesDialog open={true} onClose={() => {}} errorCode="MO_004" />
    );

    expect(screen.getByText("Normas de la Comunidad")).toBeDefined();
    expect(screen.getByText("Revisión Humana")).toBeDefined();
    expect(screen.getByText(/restringida y tu caso ha sido escalado/)).toBeDefined();
  });

  it("should render default spam guidelines when errorCode is null", () => {
    render(
      <CommunityGuidelinesDialog open={true} onClose={() => {}} errorCode={null} />
    );

    expect(screen.getByText("Normas de la Comunidad")).toBeDefined();
    expect(screen.getByText("Prevención de Spam")).toBeDefined();
  });

  it("should render length limit guidelines when errorCode is MO_001", () => {
    render(
      <CommunityGuidelinesDialog open={true} onClose={() => {}} errorCode="MO_001" />
    );

    expect(screen.getByText("Límite de Longitud")).toBeDefined();
    expect(screen.getByText(/Los mensajes demasiado largos/)).toBeDefined();
  });

  it("should render forbidden content guidelines when errorCode is MO_002", () => {
    render(
      <CommunityGuidelinesDialog open={true} onClose={() => {}} errorCode="MO_002" />
    );

    expect(screen.getByText("Lenguaje y Respeto")).toBeDefined();
    expect(screen.getByText(/No se permiten palabras ofensivas/)).toBeDefined();
  });

  it("should call onClose when 'Entendido' button is clicked", () => {
    const onClose = vi.fn();
    render(
      <CommunityGuidelinesDialog open={true} onClose={onClose} errorCode="MO_003" />
    );

    fireEvent.click(screen.getByText("Entendido"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should return null when open is false", () => {
    const { container } = render(
      <CommunityGuidelinesDialog open={false} onClose={() => {}} errorCode="MO_003" />
    );

    expect(container.innerHTML).toBe("");
  });
});
