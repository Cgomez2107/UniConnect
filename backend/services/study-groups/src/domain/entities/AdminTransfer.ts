export type AdminTransferStatus = "pendiente" | "aceptada" | "rechazada" | "cancelada";

export interface AdminTransfer {
  readonly id: string;
  readonly requestId: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly status: AdminTransferStatus;
  readonly createdAt: string;
  readonly respondedAt: string | null;
}
