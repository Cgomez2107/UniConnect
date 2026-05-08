import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

/**
 * OAuthCallbackPage - Maneja el redirect de OAuth desde Supabase
 * Supabase devuelve tokens en el hash: #access_token=...&refresh_token=...
 */
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  React.useEffect(() => {
    const processCallback = async () => {
      try {
        // Extraer tokens del hash (Supabase los devuelve así)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken) {
          // Guardar tokens
          localStorage.setItem("accessToken", accessToken);
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
          }

          // Obtener información del usuario desde el backend
          try {
            const response = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/auth/session`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.session?.user) {
                const userData = {
                  id: data.session.user.id,
                  email: data.session.user.email,
                  full_name: data.session.user.user_metadata?.full_name || "",
                  avatar_url: data.session.user.user_metadata?.avatar_url || "",
                  role: "estudiante" as const,
                };
                localStorage.setItem("user", JSON.stringify(userData));
                setUser(userData);
              }
            }
          } catch (error) {
            console.error("Error fetching user session:", error);
            // Continuar de todas formas
          }

          // Redirigir a donde estaba antes o al dashboard
          const preOAuthLocation = sessionStorage.getItem("preOAuthLocation") || "/admin";
          sessionStorage.removeItem("preOAuthLocation");

          // Limpiar el hash de la URL
          window.history.replaceState({}, document.title, window.location.pathname);

          navigate(preOAuthLocation);
        } else {
          // Sin token, redirigir a login
          navigate("/login", {
            state: { error: "No se completó la autenticación" },
          });
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        navigate("/login", {
          state: { error: "Error durante la autenticación" },
        });
      }
    };

    processCallback();
  }, [navigate, setUser]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#666" }}>Procesando autenticación...</p>
        <div style={{ marginTop: "1rem", animation: "spin 1s linear infinite" }}>
          <div
            style={{
              border: "4px solid #ddd",
              borderTop: "4px solid #0d2852",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              margin: "0 auto",
            }}
          ></div>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default OAuthCallbackPage;
