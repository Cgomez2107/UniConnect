export interface StudyGroupMember {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: "autor" | "admin" | "miembro";
  joinedAt: string | null;
}

export interface GroupMessage {
  id: string;
  requestId: string;
  senderId: string;
  content: string;
  createdAt: string;
  senderFullName: string | null;
  senderAvatarUrl: string | null;
  // Soporte para Decorator Pattern
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
  mentions?: any[];
  reactions?: any[];
}

export interface AdminTransfer {
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  status: "pendiente" | "aceptada" | "rechazada" | "cancelada";
  createdAt: string;
  respondedAt: string | null;
}

export interface UserNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
}
