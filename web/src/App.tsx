import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { ViewerPage } from "./pages/ViewerPage";
import { AdminPage } from "./pages/AdminPage";
import { ChatPage } from "./pages/ChatPage";
import { InvitationsPage } from "./pages/InvitationsPage";
import { SolicitudesPage } from "./pages/SolicitudesPage";
import { SolicitudDetailPage } from "./pages/SolicitudDetailPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { NuevaSolicitudPage } from "./pages/NuevaSolicitudPage";
import { PostularPage } from "./pages/PostularPage";
import { EventosPage } from "./pages/EventosPage";
import { RecursosPage } from "./pages/RecursosPage";
import { PerfilPage } from "./pages/PerfilPage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { MensajesPage } from "./pages/MensajesPage";
import { CompanionsPage } from "./pages/CompanionsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import DirectorioPage from "./pages/DirectorioPage";
import { AppLayout } from "./components/layout/AppLayout";
import { ToastContainer } from "./components/notifications/ToastContainer";
import { useNotificationStore } from "./store/useNotificationStore";
import "./App.css";

function PrivateRoute({
  children,
  isAuthenticated,
  requiredRole,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
  requiredRole?: "admin" | "estudiante";
}) {
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, hydrate, user } = useAuthStore();
  const [isHydrating, setIsHydrating] = useState(true);

  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    (async () => {
      try {
        await hydrate();
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Block rendering until hydration completes
  if (isHydrating) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/viewer" element={<ViewerPage />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} requiredRole="admin">
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/invitaciones" element={<InvitationsPage />} />
          <Route path="/solicitudes" element={<SolicitudesPage />} />
          <Route path="/solicitud/:id" element={<SolicitudDetailPage />} />
          <Route path="/nueva-solicitud" element={<NuevaSolicitudPage />} />
          <Route path="/postular/:id" element={<PostularPage />} />
          <Route path="/grupo/:id" element={<GroupDetailPage />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="/recursos" element={<RecursosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/mensajes" element={<MensajesPage />} />
          <Route path="/chat/:conversationId" element={<ChatPage />} />
          <Route path="/directorio" element={<CompanionsPage />} />
          <Route path="/companions" element={<CompanionsPage />} />
          <Route path="/notificaciones" element={<NotificationsPage />} />
        </Route>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === "admin" ? "/admin" : "/solicitudes"} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
