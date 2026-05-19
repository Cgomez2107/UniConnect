import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { IncomingRequestsList } from "../components/requests/IncomingRequestsList";
import { MyApplicationsList } from "../components/requests/MyApplicationsList";

type TabKey = "mis-solicitudes" | "mis-postulaciones" | "mis-recursos";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "mis-solicitudes", label: "Mis solicitudes", icon: "📋" },
  { key: "mis-postulaciones", label: "Mis postulaciones", icon: "📬" },
  { key: "mis-recursos", label: "Mis recursos", icon: "📁" },
];

export const InvitationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("mis-solicitudes");

  if (!user) {
    return (
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-900">Mis Solicitudes</h1>
        </div>
        <div className="text-center py-12 text-neutral-500">
          <p>Inicia sesión para ver tus solicitudes.</p>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: TabKey) => {
    if (tab === "mis-recursos") {
      navigate("/recursos");
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 mb-4">Gestión de Grupos</h1>
        <div className="flex gap-1 border-b border-neutral-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "text-primary-700 border-primary-700"
                  : "text-neutral-500 border-transparent hover:text-neutral-700"
              }`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "mis-solicitudes" && <IncomingRequestsList />}
      {activeTab === "mis-postulaciones" && <MyApplicationsList />}
    </div>
  );
};
