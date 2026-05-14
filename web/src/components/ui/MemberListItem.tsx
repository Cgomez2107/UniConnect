import type { Member } from "@/types";
import { Avatar } from "./Avatar";
import { RoleBadge } from "./RoleBadge";

interface MemberListItemProps {
  member: Member;
  isCurrentUser?: boolean;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function MemberListItem({ member, isCurrentUser }: MemberListItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
      <Avatar
        name={member.fullName || "Usuario"}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-primary-900 dark:text-white text-sm truncate">
          {member.fullName || "Usuario"}
          {isCurrentUser && (
            <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1">
              (tú)
            </span>
          )}
        </p>
        {member.joinedAt && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Desde {formatDate(member.joinedAt)}
          </p>
        )}
      </div>
      <RoleBadge role={member.role} />
    </div>
  );
}
