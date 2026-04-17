import { SplashLoader } from "@/components/ui/SplashLoader";
import { useOAuthCallbackFlow } from "@/hooks/application/useOAuthCallbackFlow";

export default function OAuthCallbackScreen() {
  useOAuthCallbackFlow();

  return <SplashLoader message="Iniciando sesión..." />;
}
