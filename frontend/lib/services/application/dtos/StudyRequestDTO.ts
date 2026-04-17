export interface CreateStudyRequestDTO {
  title: string
  description: string
  subject_id: string
  max_members: number
}

export interface UpdateStudyRequestDTO {
  title?: string
  description?: string
  status?: "abierta" | "cerrada" | "expirada"
}

export interface StudyRequestResponseDTO {
  id: string
  author_id: string
  subject_id: string
  title: string
  description: string
  max_members: number
  status: "abierta" | "cerrada" | "expirada"
  is_active: boolean
  created_at: string
  updated_at?: string
  subject_name: string
  applications_count?: number
}

export interface FeedStudyRequestDTO extends StudyRequestResponseDTO {
  faculty_name?: string
}
