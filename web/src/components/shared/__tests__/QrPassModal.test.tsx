import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QrPassModal } from "../QrPassModal";

const QR_CONTENT = "uniconnect://access?rid=test-token&sig=abc123def456";
const EVENT_TITLE = "Seminario de Redes";

describe("QrPassModal — Criterio 1: Visualización del QR", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza el canvas del QR cuando está abierto", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    expect(screen.getByText("Pase de Acceso")).toBeDefined();
    expect(document.body.textContent).toContain(`Pase de acceso para: ${EVENT_TITLE}`);
    const canvas = document.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("no renderiza nada cuando isOpen=false", () => {
    render(
      <QrPassModal isOpen={false} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    expect(screen.queryByText("Pase de Acceso")).toBeNull();
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("muestra el título del evento en el modal", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    expect(screen.getByText(EVENT_TITLE)).toBeDefined();
  });
});

describe("QrPassModal — Criterio 1: Zoom del QR", () => {
  afterEach(() => {
    cleanup();
  });

  it("inicia con zoom 1x", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    expect(screen.getByText("1x")).toBeDefined();
  });

  it("incrementa el zoom al hacer clic en +", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    const zoomInBtn = screen.getByTitle("Acercar");
    fireEvent.click(zoomInBtn);

    expect(screen.getByText("1.5x")).toBeDefined();
  });

  it("decrementa el zoom al hacer clic en −", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    const zoomInBtn = screen.getByTitle("Acercar");
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);

    expect(screen.getByText("2x")).toBeDefined();

    const zoomOutBtn = screen.getByTitle("Alejar");
    fireEvent.click(zoomOutBtn);

    expect(screen.getByText("1.5x")).toBeDefined();
  });

  it("no permite zoom menor a 1x (botón − se deshabilita)", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    const zoomOutBtn = screen.getByTitle("Alejar") as HTMLButtonElement;
    expect(zoomOutBtn.disabled).toBe(true);
  });

  it("no permite zoom mayor a 3x (botón + se deshabilita)", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    const zoomInBtn = screen.getByTitle("Acercar") as HTMLButtonElement;
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);

    expect(screen.getByText("3x")).toBeDefined();
    expect(zoomInBtn.disabled).toBe(true);
  });

  it("restablece el zoom al hacer clic en el indicador de zoom", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    const zoomInBtn = screen.getByTitle("Acercar");
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomInBtn);
    expect(screen.getByText("2x")).toBeDefined();

    const resetBtn = screen.getByTitle("Restablecer zoom");
    fireEvent.click(resetBtn);
    expect(screen.getByText("1x")).toBeDefined();
  });
});

describe("QrPassModal — Criterio 1: Descarga como PNG", () => {
  afterEach(() => {
    cleanup();
  });

  it("descarga el QR como PNG al hacer clic en 'Descargar PNG'", () => {
    const toDataURLSpy = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL");

    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    fireEvent.click(screen.getByText("Descargar PNG"));

    expect(toDataURLSpy).toHaveBeenCalledWith("image/png");
  });

  it("el nombre del archivo descargado está formateado correctamente", () => {
    render(
      <QrPassModal isOpen={true} onClose={vi.fn()} qrContent={QR_CONTENT} eventTitle={EVENT_TITLE} />,
    );

    const downloadBtn = screen.getByText("Descargar PNG");
    expect(downloadBtn).toBeDefined();
  });
});
