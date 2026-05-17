import { useState, useEffect, useCallback } from "react";
import useAuth from "@/hooks/useAuth";
import profilesService from "@/lib/services/profiles.service";
import studyGroupsService from "@/lib/services/studyGroups.service";
import type { ProfileUI } from "@/types/ui";
import type { UserProgram, UserSubject } from "@/types";
import type { StudyGroup } from "@uniconnect/shared-types";

export interface UseProfileData {
  profile: ProfileUI | null;
  programs: UserProgram[];
  subjects: UserSubject[];
  publications: StudyGroup[];
  isLoading: boolean;
  error: string | null;
  primaryProgram: UserProgram | null;
  initials: string;
  refresh: () => Promise<void>;
}

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function useProfile(): UseProfileData {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileUI | null>(null);
  const [programs, setPrograms] = useState<UserProgram[]>([]);
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [publications, setPublications] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [profileData, programsData, subjectsData] = await Promise.all([
        profilesService.getProfile().catch(() => null),
        profilesService.getMyPrograms().catch(() => [] as UserProgram[]),
        profilesService.getMySubjects().catch(() => [] as UserSubject[]),
      ]);

      let publicationsData: StudyGroup[] = [];
      try {
        publicationsData = await studyGroupsService.listMyStudyRequests();
      } catch {
        publicationsData = [];
      }

      setProfile(profileData);
      setPrograms(programsData);
      setSubjects(subjectsData);
      setPublications(publicationsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error cargando datos del perfil";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const primaryProgram = programs.find((p) => p.is_primary) ?? programs[0] ?? null;
  const initials = getInitials(user?.name || user?.email || "U");

  return {
    profile,
    programs,
    subjects,
    publications,
    isLoading,
    error,
    primaryProgram,
    initials,
    refresh: loadAll,
  };
}
