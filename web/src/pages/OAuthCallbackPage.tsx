import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "@/lib/supabase";
import { GATEWAY_BASE_URL, API_PREFIX } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import axios from "axios";

/**
 * Decodifica un JWT sin verificar la firma (solo para obtener claims)
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * OAuthCallbackPage - Maneja el redirect de OAuth desde Supabase
 * Supabase devuelve tokens en el hash: #access_token=...&refresh_token=...
 */
export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const processedRef = React.useRef(false);

  React.useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const processCallback = async () => {
      try {
        // Extraer tokens del hash (Supabase los devuelve así)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const supabaseAccessToken = params.get("access_token");
        const supabaseRefreshToken = params.get("refresh_token");

        if (supabaseAccessToken) {
          // Decodificar el JWT de Supabase para obtener el email
          const claims = decodeJWT(supabaseAccessToken);
          const email = claims?.email || claims?.user_email;

          if (!email) {
            console.error("[OAuthCallback] No email found in Supabase token");
            navigate("/login", { state: { error: "No se pudo obtener el email del usuario" } });
            return;
          }

          // Intercambiar token de Supabase por JWT del backend
          // NOTA: Creamos un cliente temporal sin interceptores de auth
          // porque aún no tenemos nuestro JWT válido
          const tempClient = axios.create({
            baseURL: `${GATEWAY_BASE_URL}${API_PREFIX}`,
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          });

          try {
            const response = await tempClient.post(API_ENDPOINTS.AUTH_OAUTH_CALLBACK, {
              accessToken: supabaseAccessToken,
              email,
            });

            const data = response.data;
            
            if (data.accessToken) {
              // Guardar nuestro JWT
              localStorage.setItem("accessToken", data.accessToken);
              if (data.refreshToken) {
                localStorage.setItem("refreshToken", data.refreshToken);
              }

              // Sincronizar sesión con el cliente Supabase para que auth.uid() funcione
              try {
                await supabase.auth.setSession({
                  access_token: data.accessToken,
                  refresh_token: data.refreshToken || "",
                });
              } catch (sessionErr) {
                console.warn("[OAuthCallback] setSession failed (non-critical):", sessionErr);
              }

              // Actualizar store
              if (data.user) {
                useAuthStore.setState({
                  user: {
                    id: data.user.id,
                    email: data.user.email,
                    firstName: data.user.fullName?.split(" ")[0] || "",
                    lastName: data.user.fullName?.split(" ").slice(1).join(" ") || "",
                    role: (data.user.role as any) || "estudiante",
                    profileImageUrl: undefined,
                    isVerified: true,
                    isOnboarded: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  accessToken: data.accessToken,
                  refreshToken: data.refreshToken,
                  isAuthenticated: true,
                });
              }

              // Limpiar el hash de la URL
              window.history.replaceState({}, document.title, window.location.pathname);

              // Consultar rol directamente desde Supabase (el backend puede tener caché)
              // Usamos fetch directo con el token del hash (no el cliente supabase que usa anon key)
              let role = data.user?.role;
              const sbUserId = claims?.sub;
              if (sbUserId && supabaseAccessToken) {
                try {
                  const res = await fetch(
                    `https://becitrklvpadvjwdbmck.supabase.co/rest/v1/profiles?id=eq.${sbUserId}&select=role`,
                    {
                      headers: {
                        apikey: "sb_publishable_FkHanjxqCZ7LDaQa1AomSg_xThwhZxW",
                        Authorization: `Bearer ${supabaseAccessToken}`,
                      },
                    }
                  );
                  if (res.ok) {
                    const profiles = await res.json();
                    const sbRole = profiles?.[0]?.role;
                    if (sbRole) {
                      role = sbRole;
                      // Actualizar store con el rol correcto de Supabase
                      useAuthStore.setState({
                        user: {
                          ...useAuthStore.getState().user,
                          role: sbRole,
                        } as any,
                      });
                    }
                  }
                } catch {
                  // fallback al rol del backend
                }
              }

              if (data.isNewUser) {
                sessionStorage.setItem("showWelcomeToast", "true");
              }

              // Redirigir según el rol de Supabase
              if (role === "admin") {
                navigate("/admin", { replace: true });
              } else {
                const preOAuthLocation = sessionStorage.getItem("preOAuthLocation") || "/solicitudes";
                sessionStorage.removeItem("preOAuthLocation");
                navigate(preOAuthLocation);
              }
            } else {
              console.error("[OAuthCallback] No JWT token returned from backend");
              navigate("/login", { state: { error: "No se generó el token" } });
            }
          } catch (error: any) {
            console.error("[OAuthCallback] Error exchanging OAuth token:", error.message);
            const errorMessage = error.response?.data?.error || "Error al procesar OAuth";
            navigate("/login", { state: { error: errorMessage } });
          }
        } else {
          // Sin token, redirigir a login
          console.warn("[OAuthCallback] No access token received from OAuth provider");
          navigate("/login", {
            state: { error: "No se completó la autenticación" },
          });
        }
      } catch (error) {
        console.error("[OAuthCallback] Unexpected error:", error);
        navigate("/login", {
          state: { error: "Error durante la autenticación" },
        });
      }
    };

    processCallback();
  }, [navigate]);

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
