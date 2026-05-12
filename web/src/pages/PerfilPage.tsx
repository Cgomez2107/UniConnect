import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import useProfile from "@/hooks/useProfile";
import ProfileHero from "@/components/profile/ProfileHero";
import SectionCard from "@/components/profile/SectionCard";
import StatsRow from "@/components/profile/StatsRow";
import InfoRow from "@/components/profile/InfoRow";
import MiniRequestCard from "@/components/profile/MiniRequestCard";
import LoadingState from "@/components/profile/LoadingState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function PerfilPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, programs, subjects, publications, isLoading, error, primaryProgram } = useProfile();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600 dark:text-neutral-300 mb-4">No autenticado</p>
          <Button onClick={() => navigate("/login")}>Ir a login</Button>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingState />;

  const displayName = profile?.full_name || user?.name || user?.email?.split("@")[0] || "Usuario";
  const primaryProgramName = primaryProgram?.programs?.name || primaryProgram?.program_id || "";
  const facultyName = primaryProgram?.programs?.faculties?.name || "";
  const displayPhone = profile?.phone_number;
  const displayBio = profile?.bio;
  const displaySemester = profile?.semester ?? user?.semester;
  const studySubjects = subjects
    .map((s) => s.subjects)
    .filter(Boolean) as { id: string; name: string }[];
  const publicationCount = publications.length;
  const subjectCount = subjects.length;
  const groupCount = 0;

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // Ignore error, still navigate
    }
    navigate("/login");
    setShowSignOutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4 mb-6 text-error-700 dark:text-error-300 text-sm">
            {error}
          </div>
        )}

        <ProfileHero
          name={displayName}
          email={user?.email || ""}
          avatarUrl={profile?.avatar_url || user?.profileImage || undefined}
          primaryProgram={primaryProgramName}
        />

        <SectionCard
          title="Información Académica"
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate("/edit-profile")}>
              Editar
            </Button>
          }
        >
          <InfoRow
            label="Semestre"
            value={displaySemester ? `${displaySemester}°` : "No registrado"}
          />
          <InfoRow
            label="Programas"
            value={
              programs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {programs.map((p) => (
                    <span key={p.program_id} className="inline-flex items-center gap-1">
                      <span>{p.programs?.name || p.program_id}</span>
                      {p.is_primary && (
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200 rounded-full text-xs font-medium">
                          Principal
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-neutral-400 dark:text-neutral-500 italic">Sin programa registrado</span>
              )
            }
          />
          {facultyName && <InfoRow label="Facultad" value={facultyName} />}
        </SectionCard>

        <SectionCard
          title="Materias actuales"
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate("/edit-profile")}>
              Editar
            </Button>
          }
        >
          {studySubjects.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {studySubjects.map((s) => (
                <span
                  key={s.id}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-200 rounded-full text-sm font-medium"
                >
                  {s.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-neutral-400 dark:text-neutral-500 italic text-sm">Aún no has registrado materias</p>
          )}
        </SectionCard>

        <SectionCard
          title="Contacto"
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate("/edit-profile")}>
              Editar
            </Button>
          }
        >
          {displayPhone ? (
            <InfoRow label="Teléfono" value={<span>📱 {displayPhone}</span>} />
          ) : (
            <p className="text-neutral-400 dark:text-neutral-500 italic text-sm">Aún no has agregado un teléfono de contacto</p>
          )}
        </SectionCard>

        <SectionCard
          title="Sobre mí"
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate("/edit-profile")}>
              Editar
            </Button>
          }
        >
          {displayBio ? (
            <p className="text-neutral-700 dark:text-neutral-300 text-sm whitespace-pre-wrap">{displayBio}</p>
          ) : (
            <p className="text-neutral-400 dark:text-neutral-500 italic text-sm">Aún no has escrito una biografía</p>
          )}
        </SectionCard>

        <SectionCard
          title="Mis publicaciones"
          action={
            <Button variant="primary" size="sm" onClick={() => navigate("/nueva-solicitud")}>
              + Nueva
            </Button>
          }
        >
          {publications.length > 0 ? (
            <div className="space-y-3">
              {publications.map((pub) => (
                <MiniRequestCard
                  key={pub.id}
                  title={pub.title}
                  subjectName={pub.subjectName}
                  status={pub.status}
                  applicationsCount={pub.applicationsCount}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-400 dark:text-neutral-500 text-sm">Aún no tienes solicitudes publicadas</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => navigate("/nueva-solicitud")}
              >
                Crear primera solicitud
              </Button>
            </div>
          )}
        </SectionCard>

        <StatsRow publications={publicationCount} groups={groupCount} subjects={subjectCount} />

        <div className="text-center mt-8">
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="px-8 py-3 bg-error-500 hover:bg-error-600 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <Modal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        title="Cerrar sesión"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSignOutConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleSignOut}>
              Cerrar sesión
            </Button>
          </>
        }
      >
        <p className="text-neutral-600 dark:text-neutral-300">¿Estás seguro de que deseas cerrar sesión?</p>
      </Modal>
    </div>
  );
}

export default PerfilPage;
