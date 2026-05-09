import React from "react";
import { Button } from "@/components/ui/Button";

/**
 * NotFoundPage - 404 page
 */
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <p className="text-2xl font-semibold text-neutral-900 mb-2">
          Página no encontrada
        </p>
        <p className="text-neutral-600 mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button onClick={() => (window.location.href = "/")}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
