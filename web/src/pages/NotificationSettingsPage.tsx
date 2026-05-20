import { useState, useEffect, useCallback } from "react";
import {
  getPreferences,
  updatePreference,
} from "@/lib/services/notifications.service";
import useNotifications from "@/hooks/useNotifications";

interface PreferenceEntry {
  eventType: string;
  label: string;
  channels: {
    in_app_websocket: boolean;
    email_institucional: boolean;
    push_movil: boolean;
  };
}

const CHANNEL_LABELS: Record<string, string> = {
  in_app_websocket: "En la app",
  email_institucional: "Correo",
  push_movil: "Push",
};

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<PreferenceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { success, error: showError } = useNotifications();

  useEffect(() => {
    (async () => {
      try {
        const prefs = await getPreferences();
        setPreferences(prefs as PreferenceEntry[]);
      } catch {
        showError("Error al cargar preferencias");
      } finally {
        setLoading(false);
      }
    })();
  }, [showError]);

  const handleToggle = useCallback(
    async (eventType: string, canal: string, active: boolean) => {
      const key = `${eventType}:${canal}`;
      setSaving(key);

      setPreferences((prev) =>
        prev.map((p) =>
          p.eventType === eventType
            ? { ...p, channels: { ...p.channels, [canal]: active } }
            : p,
        ),
      );

      try {
        await updatePreference({ eventType, canal, active });
        success("Preferencia actualizada");
      } catch {
        showError("Error al actualizar preferencia");
        setPreferences((prev) =>
          prev.map((p) =>
            p.eventType === eventType
              ? { ...p, channels: { ...p.channels, [canal]: !active } }
              : p,
          ),
        );
      } finally {
        setSaving(null);
      }
    },
    [success, showError],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
          <p className="text-neutral-500 text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Configuración de Notificaciones
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
            Elige qué notificaciones quieres recibir y por qué canal.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="text-left py-3 pr-4 text-neutral-600 dark:text-neutral-400 font-medium">
                    Evento
                  </th>
                  {Object.values(CHANNEL_LABELS).map((label) => (
                    <th
                      key={label}
                      className="text-center py-3 px-2 text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preferences.map((pref) => (
                  <tr
                    key={pref.eventType}
                    className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                  >
                    <td className="py-3 pr-4 text-neutral-800 dark:text-neutral-200">
                      {pref.label}
                    </td>
                    {Object.entries(pref.channels).map(([canal, active]) => {
                      const key = `${pref.eventType}:${canal}`;
                      const isSaving = saving === key;
                      return (
                        <td
                          key={canal}
                          className="text-center py-3 px-2"
                        >
                          <label className="inline-flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={active}
                              disabled={isSaving}
                              onChange={(e) =>
                                handleToggle(
                                  pref.eventType,
                                  canal,
                                  e.target.checked,
                                )
                              }
                              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50"
                            />
                            {isSaving && (
                              <span className="ml-1 inline-block w-3 h-3 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                            )}
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}