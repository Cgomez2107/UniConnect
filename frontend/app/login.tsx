import { Link, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { AuthInput } from "@/components/ui/AuthInput";
import { ErrorBanner } from "@/components/ui/Errorbanner";
import { PrimaryButton } from "@/components/ui/Primarybutton";
import { Colors } from "@/constants/Colors";
import { useLoginScreen } from "@/hooks/application/useLoginScreen";

export default function LoginScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const { error_type } = useLocalSearchParams<{ error_type?: string | string[] }>();
  const {
    email,
    password,
    emailError,
    formError,
    handleEmailChange,
    handleLogin,
    isValid,
    isLoading,
    googleLoading,
    googleError,
    signInWithGoogle,
    setPassword,
  } = useLoginScreen();

  const oauthErrorCode = useMemo(() => {
    if (Array.isArray(error_type)) return error_type[0] ?? "";
    return error_type ?? "";
  }, [error_type]);

  const oauthCallbackError = useMemo(() => {
    if (oauthErrorCode === "domain_rejected") {
      return "Debes usar tu correo institucional (@ucaldas.edu.co) para ingresar con Google.";
    }
    if (oauthErrorCode === "oauth_cancelled") {
      return "La autenticación con Google fue cancelada.";
    }
    if (oauthErrorCode === "oauth_failed") {
      return "La autenticación con Google falló. Intenta nuevamente.";
    }
    return "";
  }, [oauthErrorCode]);

  const topErrorMessage = oauthCallbackError || googleError || formError;
  const [dismissedErrorMessage, setDismissedErrorMessage] = useState("");

  useEffect(() => {
    if (topErrorMessage && topErrorMessage !== dismissedErrorMessage) {
      return;
    }
    if (!topErrorMessage) {
      setDismissedErrorMessage("");
    }
  }, [topErrorMessage, dismissedErrorMessage]);

  const visibleErrorMessage =
    topErrorMessage && topErrorMessage !== dismissedErrorMessage
      ? topErrorMessage
      : "";

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: C.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoBox, { borderColor: C.primary }]}>
            <Text style={[styles.logoText, { color: C.primary }]}>UC</Text>
            <View style={[styles.logoDot, { backgroundColor: C.accent }]} />
          </View>
          <Text style={[styles.appName, { color: C.primary }]}>UniConnect</Text>
          <Text style={[styles.tagline, { color: C.textSecondary }]}>
            La red académica de la Universidad de Caldas
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
            Inicia sesión
          </Text>

          <ErrorBanner
            message={visibleErrorMessage}
            onClose={() => setDismissedErrorMessage(visibleErrorMessage)}
          />

          <AuthInput
            label="Correo institucional"
            placeholder="tu.nombre@ucaldas.edu.co"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            error={emailError}
          />

          <AuthInput
            label="Contraseña"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <PrimaryButton
            label="Ingresar"
            onPress={handleLogin}
            isLoading={isLoading}
            disabled={!isValid}
            style={styles.submitBtn}
          />

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
            <Text style={[styles.dividerText, { color: C.textPlaceholder }]}>
              o continúa con
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          </View>

          <TouchableOpacity
            style={[
              styles.googleBtn,
              { borderColor: C.border, backgroundColor: C.surface },
              googleLoading && styles.googleBtnDisabled,
            ]}
            onPress={signInWithGoogle}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={C.primary} />
            ) : (
              <View style={styles.googleBtnInner}>
                <Text style={styles.googleIcon}>G</Text>
                <View>
                  <Text style={[styles.googleBtnText, { color: C.textPrimary }]}>
                    Iniciar sesión con Google
                  </Text>
                  <Text style={[styles.googleDomain, { color: C.textSecondary }]}>
                    @ucaldas.edu.co
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          <View style={[styles.registerRow, { marginTop: 20 }]}>
            <Text style={[styles.registerText, { color: C.textSecondary }]}>
              ¿No tienes cuenta?{" "}
            </Text>
            <Link href="/register" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.registerLink, { color: C.primary }]}>
                  Regístrate
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: 32 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16, position: "relative",
  },
  logoText: { fontSize: 22, fontWeight: "800", letterSpacing: 1 },
  logoDot: {
    width: 8, height: 8, borderRadius: 4,
    position: "absolute", bottom: 8, right: 8,
  },
  appName: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 13, textAlign: "center", lineHeight: 18, paddingHorizontal: 16 },
  card: {
    borderRadius: 12, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  submitBtn: { marginTop: 16 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 13 },

  // Google button
  googleBtn: {
    borderWidth: 1, borderRadius: 10,
    paddingVertical: 14, paddingHorizontal: 16,
    alignItems: "center", justifyContent: "center",
    minHeight: 52,
  },
  googleBtnDisabled: { opacity: 0.5 },
  googleBtnInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  googleIcon: {
    fontSize: 20, fontWeight: "800", color: "#4285F4",
    width: 24, textAlign: "center",
  },
  googleBtnText: { fontSize: 15, fontWeight: "600" },
  googleDomain: { fontSize: 11, marginTop: 1 },

  registerRow: { flexDirection: "row", justifyContent: "center" },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: "600" },
  footer: { textAlign: "center", fontSize: 12, marginTop: 16 },
});