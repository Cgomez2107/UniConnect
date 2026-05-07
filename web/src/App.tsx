import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";
import { ChatPage } from "./pages/ChatPage";
import { InvitationsPage } from "./pages/InvitationsPage";
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
              <Navigate to={user?.role === "admin" ? "/admin" : "/invitaciones"} />
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
