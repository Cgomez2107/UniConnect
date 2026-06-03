import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { deps } from "@/store/deps";
import { Button } from "@/components/ui/Button";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";

interface StudySessionUI {
  id: string;
  groupId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  rrule?: string | null;
  cancelledAt?: string | null;
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
    cancelledAt: dto.cancelledAt ?? dto.cancelled_at ?? null,
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

  const [sessions, setSessions] = useState<StudySessionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<StudySessionUI | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const allSessions: StudySessionUI[] = [];

      const studyGroupsClient = deps.apiClients.studyGroups;
      const groupsResponse = await studyGroupsClient.listMyStudyRequests();
      const groups = Array.isArray(groupsResponse) ? groupsResponse : [];

      const groupIds = new Set<string>();

      for (const group of groups) {
        groupIds.add((group as any).id);
      }

      if (urlGroupId && !groupIds.has(urlGroupId)) {
        groupIds.add(urlGroupId);
      }

      for (const gid of groupIds) {
        try {
          const groupSessions = await deps.apiClients.studySessions.listByGroup(
            gid,
            startOfMonth,
            endOfMonth,
          );
          allSessions.push(...groupSessions.map(mapSessionDTOtoUI));
        } catch {
          // skip groups without sessions
        }
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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const getSessionsForDay = (day: number) => {
    const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
    return sessions.filter(s => s.startTime.slice(0, 10) === dateStr && !s.cancelledAt);
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
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + Crear sesión
          </Button>
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
                        onClick={() => setSelectedSession(session)}
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
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedSession(null)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleCancel(selectedSession.id)}
                  className="flex-1"
                >
                  Cancelar Sesión
                </Button>
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

        <CreateSessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadSessions}
        />
      </div>
    </div>
  );
}
