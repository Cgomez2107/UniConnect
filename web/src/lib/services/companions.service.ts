import { apiClient } from "@/lib/api/client";

export interface CompanionStudent {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  semester: number | null;
  program_name: string | null;
  faculty_name: string | null;
  subjects?: { id: string; name: string }[];
}

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

function mapToUI(s: CompanionStudent): CompanionStudentUI {
  return {
    id: s.id,
    fullName: s.full_name,
    avatarUrl: s.avatar_url,
    bio: s.bio,
    semester: s.semester,
    programName: s.program_name,
    facultyName: s.faculty_name,
    subjects: s.subjects,
  };
}

export const companionsService = {
  async getAllStudents(): Promise<CompanionStudentUI[]> {
    try {
      const response = await apiClient.get<{ data: CompanionStudent[] }>("/students");
      return (response.data.data || []).map(mapToUI);
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  async getStudentsBySubject(subjectId: string): Promise<CompanionStudentUI[]> {
    try {
      const response = await apiClient.get<{ data: CompanionStudent[] }>(
        `/students?subjectId=${subjectId}`
      );
      return (response.data.data || []).map(mapToUI);
    } catch (error) {
      console.error(`Error fetching students for subject ${subjectId}:`, error);
      throw error;
    }
  },
};

export default companionsService;
