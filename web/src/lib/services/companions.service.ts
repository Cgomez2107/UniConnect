/**
 * @deprecated Use deps.apiClients.profiles directly or import from @uniconnect/shared-api.
 * This file is kept as a thin adapter for backward compatibility.
 */
import { deps } from "@/store/deps";

export interface CompanionStudentUI {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  semester: number | null;
  programName: string | null;
  facultyName: string | null;
  subjects?: { id: string; name: string }[];
  sharedSubjectIds?: string[];
}

function mapStudent(s: any): CompanionStudentUI {
  return {
    id: s.id,
    fullName: s.fullName ?? s.full_name,
    avatarUrl: s.avatarUrl ?? s.avatar_url ?? null,
    bio: s.bio ?? null,
    semester: s.semester ?? null,
    programName: s.programName ?? s.program_name ?? null,
    facultyName: s.facultyName ?? s.faculty_name ?? null,
    subjects: s.subjects,
  };
}

export const companionsService = {
  async getAllStudents(): Promise<CompanionStudentUI[]> {
    const students = await deps.apiClients.profiles.searchStudents();
    return students.map(mapStudent);
  },

  async getStudentsBySubject(subjectId: string): Promise<CompanionStudentUI[]> {
    const students = await deps.apiClients.profiles.getBySubject(subjectId);
    return students.map(mapStudent);
  },
};

export default companionsService;
