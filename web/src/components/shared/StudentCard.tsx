import React from "react";
import { StudentSearchResultUI } from "@/types/ui";
import { Avatar } from "@/components/ui/Avatar";

interface StudentCardProps {
  student: StudentSearchResultUI;
  onViewProfile: (id: string) => void;
  actionButton?: React.ReactNode;
}

/**
 * StudentCard component for displaying student profiles in search results
 */
export function StudentCard({
  student,
  onViewProfile,
  actionButton,
}: StudentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <Avatar src={student.avatarUrl ?? undefined} name={student.fullName} />
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">{student.fullName}</h3>
          <p className="text-sm text-neutral-600">{student.programName}</p>
        </div>
      </div>

      {student.studySubjects && student.studySubjects.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-neutral-700 mb-2">
            Materias de interés:
          </p>
          <div className="flex flex-wrap gap-2">
            {student.studySubjects.slice(0, 3).map((subject) => (
              <span
                key={subject.id}
                className="inline-block px-2 py-1 bg-primary-100 text-primary-600 text-xs rounded"
              >
                {subject.name}
              </span>
            ))}
            {student.studySubjects.length > 3 && (
              <span className="inline-block px-2 py-1 text-xs text-neutral-600">
                +{student.studySubjects.length - 3} más
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onViewProfile(student.id)}
          className="flex-1 px-3 py-2 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 transition-colors"
        >
          Ver perfil
        </button>
        {actionButton}
      </div>
    </div>
  );
}

export default StudentCard;
