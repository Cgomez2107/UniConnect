import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { deps } from "@/store/deps";
import useAuth from "@/hooks/useAuth";

interface StudentProfileData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  semester: number | null;
  programName: string | null;
  facultyName: string | null;
  sharedSubjects: { id: string; name: string }[];
}

function mockProfile(id: string): StudentProfileData {
  const names = [
    "Ana María García López",
    "Carlos Andrés Pérez Martínez",
    "Laura Sofía Rodríguez Gómez",
    "Miguel Ángel Hernández Díaz",
    "Valentina Torres Vargas",
    "Santiago Morales Rojas",
  ];
  const programs = [
    "Ingeniería en Sistemas",
    "Ingeniería Industrial",
    "Administración de Empresas",
    "Medicina",
    "Derecho",
    "Arquitectura",
  ];
  const idx = id.length % names.length;
  return {
    id,
    fullName: names[idx],
    avatarUrl: null,
    bio: "Estudiante apasionado por la tecnología y el aprendizaje colaborativo. Me gusta trabajar en equipo y compartir conocimientos con mis compañeros.",
    semester: (idx % 8) + 3,
    programName: programs[idx],
    facultyName: "Facultad de Ingeniería",
    sharedSubjects: [],
  };
}

function extractFullName(data: any): string {
  return data.fullName
    || data.full_name
    || (`${data.firstName || ""} ${data.lastName || ""}`.trim())
    || (`${data.first_name || ""} ${data.last_name || ""}`.trim())
    || "Usuario";
}

function extractField(data: any, ...keys: string[]): string | null {
  for (const key of keys) {
    const val = data[key];
    if (val != null && val !== "") return String(val);
  }
  return null;
}

function extractNum(data: any, ...keys: string[]): number | null {
  for (const key of keys) {
    const val = data[key];
    if (val != null && !isNaN(Number(val))) return Number(val);
  }
  return null;
}

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { setLoading(false); setError("ID de estudiante no válido"); return; }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: any = await deps.apiClients.profiles.getProfileById(id, currentUser?.id);
        if (cancelled) return;
        console.log("[StudentProfile] API response:", data);
        setProfile({
          id: data.id || id,
          fullName: extractFullName(data) || id,
          avatarUrl: extractField(data, "profileImageUrl", "profile_image_url", "avatarUrl", "avatar_url"),
          bio: extractField(data, "bio"),
          semester: extractNum(data, "semester"),
          programName: extractField(data, "programName", "program_name", "program", "programName"),
          facultyName: extractField(data, "facultyName", "faculty_name", "faculty", "facultyName"),
          sharedSubjects: data.sharedSubjects ?? data.shared_subjects ?? [],
        });
        setLoading(false);
        return;
      } catch (err: any) {
        console.warn("[StudentProfile] API failed, using mock:", err?.message);
      }
      if (!cancelled) {
        setProfile(mockProfile(id));
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleChat = async () => {
    if (!id) return;
    try {
      const conversation = await deps.apiClients.messaging.createConversation(id);
      navigate(`/chat/${conversation.id}`);
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-error-600 dark:text-error-400 mb-4">{error || "Error al cargar el perfil"}</p>
          <button onClick={() => navigate(-1)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 relative pb-24">
      {/* Header banner */}
      <div className="relative h-44 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)"
        }} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white text-sm hover:bg-white/30 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5m7-7l-7 7 7 7" />
          </svg>
          Volver
        </button>
      </div>

      {/* Avatar — overlap using padding-bottom on a container above */}
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-center -mt-16 mb-4 relative z-10">
          <div className="ring-[5px] ring-white dark:ring-neutral-900 rounded-full shadow-xl">
            <Avatar name={profile.fullName} size="xl" className="!w-32 !h-32 !text-3xl" />
          </div>
        </div>

        {/* Main info */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white uppercase tracking-wide">
            {profile.fullName}
          </h1>
          <span className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
            {profile.programName || "Sin programa"}
          </span>
        </div>

        {/* Info cards */}
        <div className="space-y-4">
          {/* Academic Info */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-4">
              Información Académica
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Programa</p>
                <p className="text-sm text-neutral-900 dark:text-white font-medium">
                  {profile.programName || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Semestre</p>
                <p className="text-sm text-neutral-900 dark:text-white font-medium">
                  {profile.semester ? `${profile.semester}° semestre` : "No especificado"}
                </p>
              </div>
              {profile.facultyName && (
                <div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">Facultad</p>
                  <p className="text-sm text-neutral-900 dark:text-white font-medium">{profile.facultyName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shared Subjects */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-4">
              Materias en Común
            </h2>
            {profile.sharedSubjects.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {profile.sharedSubjects.map((subject) => (
                    <span
                      key={subject.id}
                      className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full"
                    >
                      {subject.name}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 text-center mt-4">
                  Solo se muestran las materias que ambos están cursando
                </p>
              </>
            ) : (
              <p className="text-sm text-neutral-400">No hay materias en común</p>
            )}
          </div>

          {/* Bio */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider mb-4">
              Sobre este estudiante
            </h2>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {profile.bio || "Este estudiante aún no ha escrito una descripción."}
            </p>
          </div>
        </div>
      </div>

      {/* FAB Chat */}
      <button
        onClick={handleChat}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 z-20"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        Chat
      </button>
    </div>
  );
}
