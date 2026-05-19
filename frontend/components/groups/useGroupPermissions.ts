import { useMemo } from "react";
import type { GroupState } from "../../types";

export interface GroupPermissions {
  canJoin: boolean;
  canEdit: boolean;
  canTransfer: boolean;
  canAcceptTransfer: boolean;
  canRejectTransfer: boolean;
  canChat: boolean;
  isReadOnly: boolean;
}

const PERMISSIONS_MATRIX: Record<string, GroupPermissions> = {
  Activo: {
    canJoin: true,
    canEdit: true,
    canTransfer: true,
    canAcceptTransfer: false,
    canRejectTransfer: false,
    canChat: true,
    isReadOnly: false,
  },
  PendienteTransferencia: {
    canJoin: true,
    canEdit: false,
    canTransfer: false,
    canAcceptTransfer: true,
    canRejectTransfer: true,
    canChat: true,
    isReadOnly: false,
  },
  TransferenciaAceptada: {
    canJoin: true,
    canEdit: false,
    canTransfer: false,
    canAcceptTransfer: false,
    canRejectTransfer: false,
    canChat: true,
    isReadOnly: false,
  },
  Disuelto: {
    canJoin: false,
    canEdit: false,
    canTransfer: false,
    canAcceptTransfer: false,
    canRejectTransfer: false,
    canChat: false,
    isReadOnly: true,
  },
  Bloqueado: {
    canJoin: false,
    canEdit: false,
    canTransfer: false,
    canAcceptTransfer: false,
    canRejectTransfer: false,
    canChat: false,
    isReadOnly: true,
  },
};

const DENY_ALL: GroupPermissions = {
  canJoin: false,
  canEdit: false,
  canTransfer: false,
  canAcceptTransfer: false,
  canRejectTransfer: false,
  canChat: false,
  isReadOnly: true,
};

export function getGroupPermissions(state: string): GroupPermissions {
  return PERMISSIONS_MATRIX[state] ?? DENY_ALL;
}

export function useGroupPermissions(state: GroupState | string): GroupPermissions {
  return useMemo(() => getGroupPermissions(state), [state]);
}
