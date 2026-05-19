/**
 * @deprecated Use deps.apiClients.profiles directly or import from @uniconnect/shared-api.
 * This file is kept as a thin adapter for backward compatibility.
 */
import { deps } from "@/store/deps";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import apiClient from "@/lib/api/client";
import type { ProfileUI } from "@/types/ui";

function mapProfile(p: any): ProfileUI {
  return {
    id: p.id,
    fullName: p.fullName ?? p.full_name,
    avatarUrl: p.avatarUrl ?? p.avatar_url ?? null,
    bio: p.bio ?? null,
    phoneNumber: p.phoneNumber ?? p.phone_number ?? null,
    role: p.role ?? "estudiante",
    semester: p.semester ?? null,
    isActive: p.isActive ?? p.is_active ?? true,
    createdAt: p.createdAt?.toISOString?.() ?? p.created_at ?? p.createdAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updated_at ?? p.updatedAt,
  };
}

function mapDecoratedToProfileUI(raw: any): ProfileUI {
  const base = mapProfile(raw);
  return {
    ...base,
    semester: raw.semestre ?? raw.semester ?? null,
    indicadores: raw.indicadores
      ? {
          gruposBajoAdministracion: raw.indicadores.gruposBajoAdministracion ?? 0,
          gruposParticipa: raw.indicadores.gruposParticipa ?? 0,
          mensajesEnviados: raw.indicadores.mensajesEnviados ?? 0,
        }
      : undefined,
    insignias: Array.isArray(raw.insignias)
      ? raw.insignias.map((i: any) => ({
          id: i.id,
          nombre: i.nombre,
          descripcion: i.descripcion ?? "",
          iconoUrl: i.iconoUrl ?? "",
          fechaObtenida: i.fechaObtenida ?? "",
        }))
      : undefined,
  };
}

const profilesService = {
  async getProfile(): Promise<ProfileUI> {
    const profile = await deps.apiClients.profiles.getMyProfile();
    return mapProfile(profile);
  },

  async getFullProfile(userId: string): Promise<any> {
    return deps.apiClients.profiles.getProfileById(userId);
  },

  async updateProfile(data: { fullName?: string; bio?: string; phone?: string; semester?: number }): Promise<ProfileUI> {
    const profile = await deps.apiClients.profiles.updateProfile({
      fullName: data.fullName,
      bio: data.bio,
      phone: data.phone,
      semester: data.semester,
    });
    return mapProfile(profile);
  },

  async getProfileById(userId: string): Promise<ProfileUI> {
    const profile = await deps.apiClients.profiles.getProfileById(userId);
    return mapProfile(profile);
  },

  async getPublicProfile(userId: string): Promise<any> {
    return deps.apiClients.profiles.getProfileById(userId);
  },

  /** D02: Obtiene perfil decorado con estadísticas e insignias (?vista=completa) */
  async getDecoratedProfile(userId: string): Promise<ProfileUI | null> {
    try {
      const endpoint = API_ENDPOINTS.PROFILE_DECORATED(userId);
      const response = await apiClient.get(endpoint, { params: { vista: "completa" } });
      const data = response.data?.data ?? response.data;
      if (!data) return null;
      return mapDecoratedToProfileUI(data);
    } catch {
      return null;
    }
  },

  async searchStudents(subjectId?: string): Promise<any[]> {
    return deps.apiClients.profiles.searchStudents(subjectId);
  },

  async getMyPrograms(): Promise<any[]> {
    return deps.apiClients.profiles.getMyPrograms();
  },

  async getMySubjects(): Promise<any[]> {
    return deps.apiClients.profiles.getMySubjects();
  },

  async setPrimaryProgram(programId: string): Promise<void> {
    return deps.apiClients.profiles.setPrimaryProgram(programId);
  },

  async uploadAvatar(userId: string, base64Data: string): Promise<string> {
    return deps.apiClients.profiles.uploadAvatar(userId, base64Data);
  },

  async addMySubject(subjectId: string): Promise<void> {
    return deps.apiClients.profiles.addMySubject(subjectId);
  },

  async removeMySubject(subjectId: string): Promise<void> {
    return deps.apiClients.profiles.removeMySubject(subjectId);
  },

  async getPrograms(): Promise<any[]> {
    return deps.apiClients.profiles.getPrograms();
  },

  async getSubjectsByProgram(programId: string): Promise<any[]> {
    return deps.apiClients.profiles.getSubjectsByProgram(programId);
  },
};

export default profilesService;
