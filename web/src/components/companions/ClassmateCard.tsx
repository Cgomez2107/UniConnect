import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export interface ClassmateData {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  programName: string | null;
  semester: number | null;
  bio: string | null;
  sharedSubjectNames?: string[];
}

interface ClassmateCardProps {
  classmate: ClassmateData;
  onViewProfile: (id: string) => void;
  onSendMessage: (id: string) => void;
}

export function ClassmateCard({ classmate, onViewProfile, onSendMessage }: ClassmateCardProps) {
  return (
    <div className="card-hover p-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar name={classmate.fullName} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
            {classmate.fullName}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
            {classmate.programName || "Sin programa"}
          </p>
        </div>
      </div>

      {classmate.semester && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          {classmate.semester}° semestre
        </p>
      )}

      {classmate.bio && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-3">
          {classmate.bio}
        </p>
      )}

      {classmate.sharedSubjectNames && classmate.sharedSubjectNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {classmate.sharedSubjectNames.slice(0, 3).map((name, i) => (
            <span key={i} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-[10px] font-medium rounded-full">
              {name}
            </span>
          ))}
          {classmate.sharedSubjectNames.length > 3 && (
            <span className="px-2 py-0.5 text-neutral-400 text-[10px]">
              +{classmate.sharedSubjectNames.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={() => onViewProfile(classmate.id)}>
          Ver perfil
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onSendMessage(classmate.id)}>
          Chat
        </Button>
      </div>
    </div>
  );
}
