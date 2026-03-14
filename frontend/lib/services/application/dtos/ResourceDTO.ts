/**
 * DTOs para Study Resources (US-006)
 */
export interface UploadResourceDTO {
  subject_id: string
  title: string
  description?: string
  file_url: string
  file_name: string
  file_type?: string
  file_size_kb?: number
}

export interface ResourceResponseDTO {
  id: string
  user_id: string
  program_id: string
  subject_id: string
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_type: string | null
  file_size_kb: number | null
  created_at: string
  updated_at: string
  author_name?: string
  author_avatar?: string | null
}
