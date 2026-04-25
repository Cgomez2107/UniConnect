import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useCallback, useMemo } from "react";

WebBrowser.maybeCompleteAuthSession();

export type AuthPersistenceMode = "browser-managed" | "secure-store" | "async-storage";

export type OAuthStartResult =
  | { type: "callback"; url: string }
  | { type: "redirected" }
  | { type: "cancelled" };

/**
 * Platform-aware auth helpers for OAuth redirect and persistence strategy.
 * Avoids directly using browser globals and keeps mobile flow isolated.
 */
export function usePlatformAuth() {
  const isWeb = Platform.OS === "web";

  const persistenceMode = useMemo<AuthPersistenceMode>(() => {
    if (isWeb) return "browser-managed";
    return __DEV__ ? "async-storage" : "secure-store";
  }, [isWeb]);

  const getOAuthRedirectUrl = useCallback(() => {
    if (isWeb) {
      return AuthSession.makeRedirectUri({ path: "oauth-callback" });
    }

    if (Constants.appOwnership === "expo" || Constants.appOwnership === "guest") {
      return AuthSession.makeRedirectUri({ path: "oauth-callback" });
    }

    return AuthSession.makeRedirectUri({
      scheme: "com.juanse108.uniconnet",
      path: "oauth-callback",
    });
  }, [isWeb]);

  const startOAuthSignIn = useCallback(
    async (authUrl: string, redirectUrl: string): Promise<OAuthStartResult> => {
      if (isWeb) {
        await Linking.openURL(authUrl);
        return { type: "redirected" };
      }

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      if (result.type === "success" && result.url) {
        return { type: "callback", url: result.url };
      }

      return { type: "cancelled" };
    },
    [isWeb],
  );

  return {
    isWeb,
    persistenceMode,
    getOAuthRedirectUrl,
    startOAuthSignIn,
  };
}
