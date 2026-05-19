import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useEditProfileForm from "@/hooks/useEditProfileForm";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    state,
    errors,
    error,
    loading,
    saving,
    isFormValid,
    availablePrograms,
    availableSubjects,
    subjectSearch,
    setSubjectSearch,
    programChangeConfirm,
    bioRemaining,
    handleSemesterChange,
    handleNameChange,
    handlePhoneChange,
    handleBioChange,
    handleAvatarChange,
    handleSelectProgram,
    confirmProgramChange,
    cancelProgramChange,
    handleToggleSubject,
    handleSave,
  } = useEditProfileForm();

  const [showSubjectModal, setShowSubjectModal] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-300">No autenticado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando datos del perfil...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleSave();
    if (success) navigate("/perfil");
  };

  const currentProgramName = availablePrograms.find((p) => p.id === state.selectedProgramId)?.name || "Seleccionar programa";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Editar Perfil</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <Avatar
                src={state.avatarPreview || undefined}
                name={state.name}
                size="lg"
                className="mb-3"
              />
              <label className="cursor-pointer">
                <span className="inline-block px-4 py-2 bg-neutral-200 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-500 transition-colors">
                  Cambiar foto
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarChange(file);
                    e.target.value = "";
                  }}
                  aria-label="Seleccionar foto de perfil"
                />
              </label>
              {errors.avatar && (
                <p className="text-error-500 text-sm mt-2">{errors.avatar}</p>
              )}
            </div>

            {/* Name Field */}
            <Input
              label="Nombre Completo"
              value={state.name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={errors.name}
              required
              disabled={saving}
              placeholder="Tu nombre completo"
              name="name"
            />

            {/* Phone Field */}
            <Input
              type="tel"
              label="Teléfono"
              value={state.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              error={errors.phone}
              placeholder="+57 300..."
              disabled={saving}
              name="phone"
            />

            {/* Bio Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Biografía
              </label>
              <textarea
                value={state.bio}
                onChange={(e) => handleBioChange(e.target.value)}
                disabled={saving}
                placeholder="Cuéntanos sobre ti..."
                maxLength={500}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none transition-colors dark:bg-neutral-700 dark:text-white dark:border-neutral-600 ${
                  errors.bio
                    ? "border-error-500 focus:ring-error-500"
                    : "border-neutral-300 dark:border-neutral-600 focus:ring-primary-500"
                }`}
                aria-label="Biografía"
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && <p className="text-error-500 text-sm">{errors.bio}</p>}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">{bioRemaining}/500</p>
              </div>
            </div>

            {/* Semester Field */}
            <Input
              type="number"
              label="Semestre"
              value={state.semester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              placeholder="Ej: 5"
              disabled={saving}
              name="semester"
            />

            {/* Program Selector */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Programa principal
              </label>
              <select
                value={state.selectedProgramId}
                onChange={(e) => handleSelectProgram(e.target.value)}
                disabled={saving || availablePrograms.length === 0}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-white disabled:bg-neutral-100 dark:disabled:bg-neutral-800"
                aria-label="Seleccionar programa principal"
              >
                <option value="">Seleccionar programa</option>
                {availablePrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Management */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Materias
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!state.selectedProgramId || saving}
                  onClick={() => setShowSubjectModal(true)}
                >
                  Agregar materias
                </Button>
              </div>

              {state.selectedSubjectIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {state.selectedSubjectIds.map((subjectId) => {
                    const subject = availableSubjects.find((s) => s.id === subjectId);
                    return (
                      <span
                        key={subjectId}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 rounded-full text-sm"
                      >
                        {subject?.name || subjectId}
                        <button
                          type="button"
                          onClick={() => handleToggleSubject(subjectId)}
                          className="ml-1 text-primary-500 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-100 focus:outline-none"
                          aria-label={`Remover ${subject?.name || subjectId}`}
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-400 dark:text-neutral-500 italic text-sm">
                  Aún no has registrado materias
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-3 text-error-700 dark:text-error-300 text-sm">
                {error}
              </div>
            )}

            {/* Form Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/perfil")}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isFormValid || saving}
                loading={saving}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Subject Selection Modal */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title="Agregar materias"
      >
        <div className="py-2">
          <input
            type="search"
            placeholder="Buscar materia..."
            value={subjectSearch}
            onChange={(e) => setSubjectSearch(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-white"
            aria-label="Buscar materias"
            autoFocus
          />

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {availableSubjects.length === 0 ? (
              <p className="text-neutral-400 dark:text-neutral-500 text-sm text-center py-4">
                No hay materias disponibles para este programa
              </p>
            ) : (
              availableSubjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={state.selectedSubjectIds.includes(subject.id)}
                    onChange={() => handleToggleSubject(subject.id)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-900 dark:text-white">{subject.name}</span>
                </label>
              ))
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={() => setShowSubjectModal(false)}>
              Listo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Program Change Confirmation Modal */}
      <Modal
        isOpen={programChangeConfirm.show}
        onClose={cancelProgramChange}
        title="Cambiar programa"
        footer={
          <>
            <Button variant="secondary" onClick={cancelProgramChange}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmProgramChange}>
              Cambiar programa
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-300">
          Al cambiar a <strong>{programChangeConfirm.newProgramName}</strong>, se limpiarán las materias seleccionadas.
        </p>
      </Modal>
    </div>
  );
}

export default EditProfilePage;
