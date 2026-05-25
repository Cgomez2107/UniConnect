import React, { useState } from "react";

interface PollCreatorProps {
  onCancel: () => void;
  onCreate: (poll: {
    question: string;
    options: string[];
    closesInMinutes: number;
  }) => void;
}

export function PollCreator({ onCancel, onCreate }: PollCreatorProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesInMinutes, setClosesInMinutes] = useState(60);

  const addOption = () => {
    if (options.length < 20) setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const isValid =
    question.trim().length > 0 &&
    options.filter((o) => o.trim().length > 0).length >= 2;

  const handleCreate = () => {
    if (!isValid) return;
    onCreate({
      question: question.trim(),
      options: options.filter((o) => o.trim().length > 0).map((o) => o.trim()),
      closesInMinutes,
    });
  };

  return (
    <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
      <p className="text-xs font-semibold text-neutral-700 mb-2">
        Crear encuesta
      </p>

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Escribe la pregunta..."
        className="w-full px-3 py-1.5 border border-neutral-300 rounded-lg text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <div className="space-y-1.5 mb-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Opción ${i + 1}`}
              className="flex-1 px-2.5 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {options.length > 2 && (
              <button
                onClick={() => removeOption(i)}
                className="text-neutral-400 hover:text-error-600 text-sm px-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {options.length < 20 && (
        <button
          onClick={addOption}
          className="text-xs text-primary-600 hover:text-primary-700 mb-2"
        >
          + Añadir opción
        </button>
      )}

      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-neutral-600">Cierra en:</label>
        <select
          value={closesInMinutes}
          onChange={(e) => setClosesInMinutes(Number(e.target.value))}
          className="px-2 py-1 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value={5}>5 min</option>
          <option value={15}>15 min</option>
          <option value={30}>30 min</option>
          <option value={60}>1 hora</option>
          <option value={180}>3 horas</option>
          <option value={1440}>24 horas</option>
          <option value={43200}>30 días</option>
        </select>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-800"
        >
          Cancelar
        </button>
        <button
          onClick={handleCreate}
          disabled={!isValid}
          className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isValid
            ? `Enviar encuesta (${options.filter((o) => o.trim()).length} opciones)`
            : "Completa la pregunta y al menos 2 opciones"}
        </button>
      </div>
    </div>
  );
}

export default PollCreator;
