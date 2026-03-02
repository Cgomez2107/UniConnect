/**
 * app/login.tsx
 * Login con splash diferenciado por rol y redirección robusta
 * Incluye autenticación con Google (@ucaldas.edu.co)
 */

import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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
import { SplashLoader } from "@/components/ui/SplashLoader";
import { Colors } from "@/constants/Colors";
import { useGoogleAuth } from "@/lib/services/googleAuthService";
import type { UserRole } from "@/store/useAuthStore";
import { useAuthStore } from "@/store/useAuthStore";

const UCALDAS_REGEX = /^[a-zA-Z0-9._%+-]+@ucaldas\.edu\.co$/;

export default function LoginScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const signIn = useAuthStore((s) => s.signIn);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [splashRole, setSplashRole] = useState<UserRole | null>(null);

  // ── Google Auth ─────────────────────────────────────────────────────────────
  const {
    request: googleRequest,
    loading: googleLoading,
    error: googleError,
    signInWithGoogle,
  } = useGoogleAuth();

  // ── Login con email/password ────────────────────────────────────────────────
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(
      value.length > 0 && !UCALDAS_REGEX.test(value)
        ? "Debe ser un correo @ucaldas.edu.co"
        : ""
    );
  };

  const handleLogin = async () => {
    setFormError("");
    if (!email || !password) {
      setFormError("Completa todos los campos.");
      return;
    }
    if (!UCALDAS_REGEX.test(email)) {
      setEmailError("Debe ser un correo @ucaldas.edu.co");
      return;
    }

    try {
      await signIn(email, password);

      const role = useAuthStore.getState().user?.role ?? "estudiante";
      setSplashRole(role);

      setTimeout(() => {
        if (role === "admin") {
          router.replace("/(admin)" as any);
        } else {
          router.replace("/(tabs)" as any);
        }
      }, 1200);

    } catch (error: any) {
      setSplashRole(null);
      const msg: string = error?.message ?? "";
      if (msg.includes("Email not confirmed")) {
        setFormError("Confirma tu correo institucional antes de ingresar.");
      } else if (msg.includes("Invalid login credentials")) {
        setFormError("Correo o contraseña incorrectos.");
      } else {
        setFormError("Ocurrió un error. Intenta de nuevo.");
      }
    }
  };

  // ── Splash mientras navega ──────────────────────────────────────────────────
  if (splashRole !== null) {
    return (
      <SplashLoader
        role={splashRole}
        message={
          splashRole === "admin"
            ? "Cargando panel de administración..."
            : "Cargando tu feed de estudio..."
        }
      />
    );
  }

  const isValid = UCALDAS_REGEX.test(email) && password.length >= 6;

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
        {/* ── Logo ── */}
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

        {/* ── Card ── */}
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
            Inicia sesión
          </Text>

          <ErrorBanner message={formError} />

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

          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={[styles.forgotText, { color: C.primary }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <PrimaryButton
            label="Ingresar"
            onPress={handleLogin}
            isLoading={isLoading}
            disabled={!isValid}
            style={styles.submitBtn}
          />

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
            <Text style={[styles.dividerText, { color: C.textPlaceholder }]}>
              o continúa con
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          </View>

          {/* ── Botón Google ── */}
          {googleError ? (
            <Text style={[styles.googleError, { color: C.error }]}>
              {googleError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.googleBtn,
              { borderColor: C.border, backgroundColor: C.surface },
              (!googleRequest || googleLoading) && styles.googleBtnDisabled,
            ]}
            onPress={signInWithGoogle}
            disabled={!googleRequest || googleLoading}
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

          {/* ── Registro ── */}
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

        <Text style={[styles.footer, { color: C.textPlaceholder }]}>
          Solo accesible con correo @ucaldas.edu.co
        </Text>
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
  forgotBtn: { alignSelf: "flex-end", marginBottom: 4, marginTop: -8 },
  forgotText: { fontSize: 13, fontWeight: "500" },
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
  googleError: { fontSize: 13, textAlign: "center", marginBottom: 10 },

  registerRow: { flexDirection: "row", justifyContent: "center" },
  registerText: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: "600" },
  footer: { textAlign: "center", fontSize: 12, marginTop: 16 },
});