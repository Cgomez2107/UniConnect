import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

/**
 * PerfilPage - User profile view and edit
 */
export function PerfilPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No autenticado</p>
          <Button onClick={() => navigate("/login")}>Ir a login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar src={user.profileImage} name={user.name} size="lg" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {user.program?.name}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Guardar" : "Editar perfil"}
            </Button>
          </div>

          {/* Profile Details */}
          <div className="grid md:grid-cols-2 gap-6 border-t pt-6">
            <div>
              <p className="text-sm text-gray-600 font-medium">Carrera</p>
              <p className="text-gray-900">{user.program?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Semestre</p>
              <p className="text-gray-900">{user.semester || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Email</p>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Rol</p>
              <p className="text-gray-900 capitalize">
                {user?.role === "admin" ? "Administrador" : "Estudiante"}
              </p>
            </div>
          </div>

          {/* Study Subjects */}
          {user.studySubjects && user.studySubjects.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600 font-medium mb-3">
                Materias de interés
              </p>
              <div className="flex flex-wrap gap-2">
                {user.studySubjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="px-3 py-1 bg-uc-blue-light text-uc-blue rounded-full text-sm"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Acciones</h2>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              📝 Ver historial de actividad
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              🔐 Cambiar contraseña
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
              ⚙️ Preferencias
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerfilPage;
