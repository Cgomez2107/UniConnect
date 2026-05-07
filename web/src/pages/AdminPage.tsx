import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { apiClient } from "../lib/httpClient";

interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  memberCount: number;
}

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchGroups();
  }, [user, navigate]);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/study-groups");
      setGroups(response.data?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar grupos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-uc-blue text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span>{user?.fullName}</span>
            <button
              onClick={handleLogout}
              className="bg-uc-gold text-uc-blue px-4 py-2 rounded hover:bg-uc-gold-dark"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-uc-blue mb-6">
          Grupos de Estudio
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-uc-blue mb-2">
                  {group.name}
                </h3>
                <p className="text-gray-600 mb-2">{group.subject}</p>
                <p className="text-sm text-gray-500">
                  Miembros: {group.memberCount}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
