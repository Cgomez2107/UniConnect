import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { LoginPage } from "./pages/LoginPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { AdminPage } from "./pages/AdminPage";
import { ChatPage } from "./pages/ChatPage";
import { InvitationsPage } from "./pages/InvitationsPage";
import { SolicitudesPage } from "./pages/SolicitudesPage";
import { SolicitudDetailPage } from "./pages/SolicitudDetailPage";
import { NuevaSolicitudPage } from "./pages/NuevaSolicitudPage";
import { EventosPage } from "./pages/EventosPage";
import { RecursosPage } from "./pages/RecursosPage";
import { PerfilPage } from "./pages/PerfilPage";
import { MensajesPage } from "./pages/MensajesPage";
import { ToastContainer } from "./components/notifications/ToastContainer";
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
  const { isAuthenticated, restoreSession, user } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated} requiredRole="admin">
              <AdminPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/invitaciones"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <InvitationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <SolicitudesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/solicitud/:id"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <SolicitudDetailPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/nueva-solicitud"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <NuevaSolicitudPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/eventos"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <EventosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/recursos"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <RecursosPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <PerfilPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/mensajes"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <MensajesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <ChatPage />
            </PrivateRoute>
          }
        />
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
