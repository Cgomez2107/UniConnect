import { useState, useEffect } from "react";
import { deps } from "@/store/deps";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  preselectedGroupId?: string;
}

interface GroupOption {
  id: string;
  title: string;
  subjectName: string;
  subjectId: string;
}

export function CreateSessionModal({ isOpen, onClose, onCreated, preselectedGroupId }: CreateSessionModalProps) {
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupId, setGroupId] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [weekCount, setWeekCount] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  const selectedGroup = groups.find(g => g.id === groupId);

  const subjectOptions = Array.from(
    new Map(groups.map(g => [g.subjectId, { id: g.subjectId, name: g.subjectName }])).values()
  );

  const filteredGroups = subjectFilter
    ? groups.filter(g => g.subjectId === subjectFilter)
    : groups;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSuccess(false);
    setSubmitting(false);
    setTitle("");
    setDescription("");
    setStartDate("");
    setStartTime("");
    setDurationMinutes(60);
    setReminderMinutes(30);
    setIsRecurring(false);
    setWeekCount(8);
    setSubjectFilter("");
    setGroupId(preselectedGroupId || "");

    const loadData = async () => {
      try {
        const [listData, singleData] = await Promise.all([
          deps.apiClients.studyGroups.listMyStudyRequests().catch(() => []),
          preselectedGroupId
            ? deps.apiClients.studyGroups.getById(preselectedGroupId).catch(() => null)
            : Promise.resolve(null),
        ]);

        const allItems = Array.isArray(listData) ? listData : [];

        if (singleData) {
          const exists = allItems.some((g: any) => g.id === singleData.id);
          if (!exists) {
            allItems.unshift(singleData);
          }
        }

        setGroups(allItems.map((g: any) => ({
          id: g.id,
          title: g.title || g.name || "Grupo",
          subjectName: g.subjectName || "Sin materia",
          subjectId: g.subjectId || "",
        })));

        if (!preselectedGroupId && allItems.length > 0) {
          setGroupId(allItems[0].id);
        }
      } catch {
        setGroups([]);
      }
    };

    loadData();
  }, [isOpen]);

  const handleSubmit = async () => {
    if (submitting) return; // Prevent double submission

    setError(null);
    if (!groupId) { setError("Selecciona un grupo"); return; }
    if (!title.trim()) { setError("El título es obligatorio"); return; }
    if (!startDate || !startTime) { setError("Selecciona fecha y hora de inicio"); return; }
    if (!durationMinutes || durationMinutes < 15) { setError("La duración debe ser de al menos 15 minutos"); return; }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    if (isNaN(startDateTime.getTime())) { setError("Fecha de inicio inválida"); return; }
    if (isNaN(endDateTime.getTime())) { setError("Fecha de fin inválida"); return; }

    if (startDateTime <= new Date()) {
      setError("La fecha de inicio debe ser en el futuro");
      return;
    }

    // Calculate remindAt if reminderMinutes is set
    const remindAt = reminderMinutes > 0
      ? new Date(startDateTime.getTime() - reminderMinutes * 60 * 1000).toISOString()
      : undefined;

    setSubmitting(true);
    try {
      await deps.apiClients.studySessions.createSeries(groupId, {
        title: title.trim(),
        description: description.trim(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        remindAt,
        ...(isRecurring ? { rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU", weekCount } : {}),
      });
      setSuccess(true);
      setTimeout(() => {
        onCreated();
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "";
      if (msg.includes("Start time must be in the future")) {
        setError("La fecha de inicio debe ser en el futuro");
      } else if (msg.includes("End time must be after start time")) {
        setError("La fecha de fin debe ser posterior a la de inicio");
      } else if (msg.includes("Title is required")) {
        setError("El título es obligatorio");
      } else if (msg.includes("Invalid startTime")) {
        setError("Fecha de inicio inválida");
      } else if (msg.includes("Invalid endTime")) {
        setError("Fecha de fin inválida");
      } else {
        setError(msg || "Error al crear la serie de sesiones");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear serie de sesiones">
      <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-2">
        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-medium">
            ¡Sesiones creadas correctamente!
          </div>
        ) : (
          <>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        {preselectedGroupId && selectedGroup && (
          <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="text-sm">
              <span className="text-neutral-500">Grupo:</span>{" "}
              <span className="font-medium text-neutral-800">{selectedGroup.title}</span>
            </div>
            <div className="text-sm">
              <span className="text-neutral-500">Materia:</span>{" "}
              <span className="font-medium text-neutral-800">{selectedGroup.subjectName}</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Lunes de Álgebra"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el propósito de la sesión..."
            rows={3}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha inicio</label>
            <input
              type="date"
              value={startDate}
              min={todayStr}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Hora inicio</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Duración (minutos)</label>
          <input
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            min={15}
            max={480}
            step={15}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-neutral-500 mt-1">Mínimo 15 minutos, máximo 8 horas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Recordatorio (minutos antes)</label>
          <input
            type="number"
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(Number(e.target.value))}
            min={0}
            max={1440}
            step={5}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-neutral-500 mt-1">0 para sin recordatorio, máximo 24 horas</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-neutral-700">Repetir semanalmente</span>
          </label>
          {isRecurring && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-neutral-600">por</label>
              <input
                type="number"
                min={1}
                max={52}
                value={weekCount}
                onChange={(e) => setWeekCount(Number(e.target.value))}
                className="w-16 rounded-lg border border-neutral-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <label className="text-sm text-neutral-600">semanas</label>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting} className="flex-1">Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting} disabled={submitting} className="flex-1">Crear sesiones</Button>
        </div>
          </>
        )}
      </div>
    </Modal>
  );
}
