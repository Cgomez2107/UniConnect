export interface ApplyToRequestDTO {
  request_id: string
  message: string
}

export interface ReviewApplicationDTO {
  application_id: string
  decision: "aceptada" | "rechazada"
}

export interface ApplicationResponseDTO {
  id: string
  request_id: string
  applicant_id: string
  message: string
  status: "pendiente" | "aceptada" | "rechazada"
  reviewed_at?: string
  created_at: string
  applicant_name?: string
  applicant_avatar?: string | null
  request_title?: string
}
