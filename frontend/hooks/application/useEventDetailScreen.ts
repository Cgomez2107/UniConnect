import { DIContainer } from "@/lib/services/di/container";
import type { CampusEvent } from "@/types";
import { useEffect, useMemo, useState } from "react";

export function useEventDetailScreen(id?: string) {
  const container = useMemo(() => DIContainer.getInstance(), []);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<CampusEvent | null>(null);

  useEffect(() => {
    const eventId = typeof id === "string" ? id : "";
    if (!eventId) {
      setLoading(false);
      setEvent(null);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const useCase = container.getGetEventById();
        const result = await useCase.execute(eventId);
        setEvent(result);
      } catch {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => {
      setLoading(false);
      setEvent(null);
    });
  }, [container, id]);

  const formattedDate = useMemo(
    () =>
      event?.event_date
        ? new Date(event.event_date).toLocaleString("es-CO", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    [event?.event_date],
  );

  return {
    loading,
    event,
    formattedDate,
  };
}
