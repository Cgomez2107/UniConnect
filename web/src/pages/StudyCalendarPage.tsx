import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { deps } from "@/store/deps";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";

interface StudySessionUI {
  id: string;
  groupId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  rrule?: string | null;
  status?: "scheduled" | "cancelled";
  createdBy?: string;
}

function mapSessionDTOtoUI(dto: any): StudySessionUI {
  return {
    id: dto.id,
    groupId: dto.groupId ?? dto.group_id ?? "",
    title: dto.title,
    description: dto.description ?? "",
    startTime: dto.startTime ?? dto.start_time ?? "",
    endTime: dto.endTime ?? dto.end_time ?? "",
    rrule: dto.rrule ?? null,
    status: dto.status ?? (dto.cancelledAt || dto.cancelled_at ? "cancelled" : "scheduled"),
    createdBy: dto.createdBy ?? dto.created_by ?? undefined,
  };
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function StudyCalendarPage() {
  const [searchParams] = useSearchParams();
  const urlGroupId = searchParams.get("groupId");
  const user = useAuthStore((s) => s.user);

  const [sessions, setSessions] = useState<StudySessionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<StudySessionUI | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [sessionAttendees, setSessionAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const allSessions: StudySessionUI[] = [];

      if (!urlGroupId) {
        setSessions([]);
        setLoading(false);
        return;
      }

      try {
        const groupSessions = await deps.apiClients.studySessions.listByGroup(
          urlGroupId,
          startOfMonth,
          endOfMonth,
        );
        allSessions.push(...groupSessions.map(mapSessionDTOtoUI));
      } catch (err) {
        setError("Error al cargar sesiones del grupo");
      }

      setSessions(allSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar sesiones");
    } finally {
      setLoading(false);
    }
  }, [year, month, urlGroupId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleCancel = async (sessionId: string) => {
    try {
      await deps.apiClients.studySessions.cancel(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSelectedSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar sesión");
    }
  };

  const loadSessionAttendees = async (sessionId: string) => {
    setLoadingAttendees(true);
    try {
      const attendees = await deps.apiClients.studySessions.listSessionAttendees(sessionId);
      console.log("Loaded attendees:", attendees);
      console.log("Current user ID:", user?.id);
      setSessionAttendees(attendees);
    } catch (err) {
      console.error("Error loading session attendees:", err);
      setSessionAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleUpdateAvailability = async (sessionId: string, status: "confirmed" | "declined") => {
    if (!user) return;
    setUpdatingAvailability(true);
    try {
      const userName = `${user.firstName} ${user.lastName}`.trim();
      await deps.apiClients.studySessions.updateAvailability(sessionId, { status, userName });
      // Refresh attendees to get updated info
      await loadSessionAttendees(sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar disponibilidad");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const getSessionsForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    const startOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
    const endOfDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate() + 1);
    return sessions.filter(s => {
      const sessionDate = new Date(s.startTime);
      return sessionDate >= startOfDay && sessionDate < endOfDay && s.status !== "cancelled";
    });
  };

  const calendarDays: (number | null)[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  return (
    <div className="min-h-screen bg-neutral-50 animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">
            Calendario de Estudio
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-neutral-800">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 border-b border-neutral-200">
            {DAY_NAMES.map(day => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-neutral-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-24 p-1 bg-neutral-50/50" />;
              }
              const daySessions = getSessionsForDay(day);
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

              return (
                <div
                  key={day}
                  className={`min-h-24 p-1 border-b border-r border-neutral-100 cursor-pointer hover:bg-primary-50/30 transition-colors ${
                    isToday ? "bg-primary-50/50" : ""
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-primary-500 text-white" : "text-neutral-600"
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {daySessions.slice(0, 3).map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setSelectedSession(session);
                          loadSessionAttendees(session.id);
                        }}
                        className="w-full text-left text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 truncate hover:bg-blue-200 transition-colors"
                      >
                        {session.title}
                      </button>
                    ))}
                    {daySessions.length > 3 && (
                      <div className="text-xs text-neutral-400 px-1">
                        +{daySessions.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {loading && (
          <div className="text-center py-4 text-neutral-500">
            Cargando sesiones...
          </div>
        )}

        {selectedSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedSession(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">{selectedSession.title}</h3>
              {selectedSession.description && (
                <p className="text-sm text-neutral-600 mb-3">{selectedSession.description}</p>
              )}
              <div className="space-y-2 text-sm text-neutral-600 mb-4">
                <p><span className="font-medium">Inicio:</span> {new Date(selectedSession.startTime).toLocaleString("es-CO")}</p>
                <p><span className="font-medium">Fin:</span> {new Date(selectedSession.endTime).toLocaleString("es-CO")}</p>
                {selectedSession.rrule && (
                  <p><span className="font-medium">Recurrente:</span> Semanal</p>
                )}
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-neutral-700">Confirmados: {sessionAttendees.filter(a => a.status === "confirmed").length}</p>
                <p className="text-sm text-neutral-600">
                  Tu estado: {
                    (() => {
                      const userAttendee = sessionAttendees.find(a => a.userId === user?.id);
                      if (!userAttendee) return "Pendiente";
                      if (userAttendee.status === "confirmed") return "Confirmado";
                      if (userAttendee.status === "declined") return "Declinado";
                      return "Pendiente";
                    })()
                  }
                </p>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-neutral-700">Tu asistencia:</p>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => handleUpdateAvailability(selectedSession.id, "confirmed")}
                    disabled={updatingAvailability}
                    className="flex-1"
                  >
                    {updatingAvailability ? "Actualizando..." : "Confirmar"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateAvailability(selectedSession.id, "declined")}
                    disabled={updatingAvailability || (() => {
                      const userAttendee = sessionAttendees.find(a => a.userId === user?.id);
                      return !userAttendee || userAttendee.status !== "confirmed";
                    })()}
                    className="flex-1"
                  >
                    {updatingAvailability ? "Actualizando..." : "Declinar"}
                  </Button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedSession(null)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                {selectedSession.createdBy === user?.id && (
                  <Button
                    variant="danger"
                    onClick={() => handleCancel(selectedSession.id)}
                    className="flex-1"
                  >
                    Cancelar Sesión
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            <p className="text-lg">No hay sesiones de estudio este mes</p>
            <p className="text-sm mt-1">Crea una serie recurrente desde tu grupo de estudio</p>
          </div>
        )}
      </div>
    </div>
  );
}
