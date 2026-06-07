import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { ViewerPage } from "./pages/ViewerPage";
import { SubirRecursoPage } from "./pages/SubirRecursoPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { FacultadesPage } from "./pages/admin/FacultadesPage";
import { ProgramasPage } from "./pages/admin/ProgramasPage";
import { MateriasPage } from "./pages/admin/MateriasPage";
import { UsuariosPage } from "./pages/admin/UsuariosPage";
import { AdminSolicitudesPage } from "./pages/admin/SolicitudesPage";
import { AdminRecursosPage } from "./pages/admin/RecursosPage";
import { AdminEventosPage } from "./pages/admin/EventosPage";
import { MetricasPage } from "./pages/admin/MetricasPage";
import { ChatPage } from "./pages/ChatPage";
import { InvitationsPage } from "./pages/InvitationsPage";
import { SolicitudesPage } from "./pages/SolicitudesPage";
import { SolicitudDetailPage } from "./pages/SolicitudDetailPage";
import { StudentProfilePage } from "./pages/StudentProfilePage";
import { GroupDashboardPage } from "./pages/GroupAdminPage";
import { NuevaSolicitudPage } from "./pages/NuevaSolicitudPage";
import { PostularPage } from "./pages/PostularPage";
import { EventosPage } from "./pages/EventosPage";
import { EventoDetallePage } from "./pages/EventoDetallePage";
import { CrearEventoPage } from "./pages/CrearEventoPage";
import { RecursosPage } from "./pages/RecursosPage";
import { RecursoDetallePage } from "./pages/RecursoDetallePage";
import { PerfilPage } from "./pages/PerfilPage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { MensajesPage } from "./pages/MensajesPage";
import { CompanionsPage } from "./pages/CompanionsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import DirectorioPage from "./pages/DirectorioPage";
import { StudyGroupsMobilePage } from "./pages/StudyGroupsMobilePage";
import { ForumPage } from "./pages/ForumPage";
import { ForumQuestionPage } from "./pages/ForumQuestionPage";
import { StudyCalendarPage } from "./pages/StudyCalendarPage";
import { AppLayout } from "./components/layout/AppLayout";
import { ToastContainer } from "./components/notifications/ToastContainer";
import { fetchNotifications } from "./lib/services/notifications.service";
import { useRealtimeNotifications } from "./hooks/useRealtimeNotifications";
import { useGlobalSync } from "./hooks/useGlobalSync";
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

function GroupAdminRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/grupo/${id}`} replace />;
}

function GroupChatRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/grupo/${id}`} replace />;
}

function App() {
  const { isAuthenticated, hydrate, user } = useAuthStore();
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await hydrate();
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [hydrate]);

  useRealtimeNotifications();
  useGlobalSync();

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="facultades" replace />} />
          <Route path="facultades" element={<FacultadesPage />} />
          <Route path="programas" element={<ProgramasPage />} />
          <Route path="materias" element={<MateriasPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="solicitudes" element={<AdminSolicitudesPage />} />
          <Route path="recursos" element={<AdminRecursosPage />} />
          <Route path="eventos" element={<AdminEventosPage />} />
          <Route path="metricas" element={<MetricasPage />} />
        </Route>
        <Route
          path="/chat/:conversationId"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <ChatPage />
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
          <Route path="/grupo/:id" element={<GroupDashboardPage />} />
          <Route path="/grupo/:id/admin" element={<GroupAdminRedirect />} />
          <Route path="/grupo/:id/chat" element={<GroupChatRedirect />} />
          <Route path="/eventos" element={<EventosPage />} />
          <Route path="/eventos/:id" element={<EventoDetallePage />} />
          <Route path="/crear-evento" element={<CrearEventoPage />} />
          <Route path="/recursos" element={<RecursosPage />} />
          <Route path="/recursos/:id" element={<RecursoDetallePage />} />
          <Route path="/subir-recurso" element={<SubirRecursoPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
          <Route path="/edit-profile" element={<EditProfilePage />} />
          <Route path="/mensajes" element={<MensajesPage />} />
          <Route path="/directorio" element={<CompanionsPage />} />
          <Route path="/companions" element={<CompanionsPage />} />
          <Route path="/perfil-estudiante/:id" element={<StudentProfilePage />} />
          <Route path="/notificaciones" element={<NotificationsPage />} />
          <Route path="/ajustes/notificaciones" element={<NotificationSettingsPage />} />
          <Route path="/ui/study-groups" element={<StudyGroupsMobilePage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/pregunta/:id" element={<ForumQuestionPage />} />
          <Route path="/calendario-estudio" element={<StudyCalendarPage />} />
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
