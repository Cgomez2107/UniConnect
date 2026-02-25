/**
 * app/(tabs)/register.tsx  →  mover a  app/(auth)/register.tsx
 *
 * Pantalla de registro — UniConnect
 * Diseño: minimalista / LinkedIn-inspired
 */

import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
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
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Colors } from "@/constants/Colors";
import { supabase } from "@/lib/supabase";

// ── Validación ────────────────────────────────────────────────────────────────
const UCALDAS_REGEX = /^[a-zA-Z0-9._%+-]+@ucaldas\.edu\.co$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [formError, setFormError] = useState("");

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleNameChange = (v: string) => {
    setFullName(v);
    setErrors((p) => ({
      ...p,
      fullName:
        v.length > 0 && v.trim().split(" ").filter(Boolean).length < 2
          ? "Escribe tu nombre y apellido"
          : "",
    }));
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    setErrors((p) => ({
      ...p,
      email:
        v.length > 0 && !UCALDAS_REGEX.test(v)
          ? "Debe ser un correo @ucaldas.edu.co"
          : "",
    }));
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    setErrors((p) => ({
      ...p,
      password:
        v.length > 0 && !PASSWORD_REGEX.test(v)
          ? "Mín. 8 caracteres, 1 mayúscula y 1 número"
          : "",
      confirmPassword:
        confirmPassword.length > 0 && v !== confirmPassword
          ? "Las contraseñas no coinciden"
          : "",
    }));
  };

  const handleConfirmChange = (v: string) => {
    setConfirmPassword(v);
    setErrors((p) => ({
      ...p,
      confirmPassword:
        v.length > 0 && v !== password ? "Las contraseñas no coinciden" : "",
    }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setFormError("");

    const next = {
      fullName:
        fullName.trim().split(" ").filter(Boolean).length < 2
          ? "Escribe tu nombre y apellido"
          : "",
      email: !UCALDAS_REGEX.test(email)
        ? "Debe ser un correo @ucaldas.edu.co"
        : "",
      password: !PASSWORD_REGEX.test(password)
        ? "Mín. 8 caracteres, 1 mayúscula y 1 número"
        : "",
      confirmPassword:
        password !== confirmPassword ? "Las contraseñas no coinciden" : "",
    };

    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setIsLoading(true);
    try {
      // Registrar usuario
      const { error: signUpError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;

      // Auto-login inmediatamente después del registro
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      // Redirigir al home
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Registration error:", error);
      const msg: string = error?.message ?? "";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("user already registered")) {
        setErrors((p) => ({ ...p, email: "Este correo ya está registrado" }));
      } else {
        setFormError(`Error: ${msg || "Ocurrió un error al registrarte. Intenta de nuevo."}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isValid =
    fullName.trim().split(" ").filter(Boolean).length >= 2 &&
    UCALDAS_REGEX.test(email) &&
    PASSWORD_REGEX.test(password) &&
    password === confirmPassword;

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (registered) {
    return (
      <View
        style={[styles.successContainer, { backgroundColor: C.background }]}
      >
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />

        <View
          style={[styles.successIconBox, { backgroundColor: C.successBackground }]}
        >
          <Text style={styles.successIcon}>📧</Text>
        </View>

        <Text style={[styles.successTitle, { color: C.textPrimary }]}>
          ¡Revisa tu correo!
        </Text>
        <Text style={[styles.successBody, { color: C.textSecondary }]}>
          Enviamos un enlace de confirmación a{"\n"}
          <Text style={{ color: C.primary, fontWeight: "600" }}>{email}</Text>
          {"\n\n"}
          Confirma tu cuenta para empezar a usar UniConnect.
        </Text>

        <PrimaryButton
          label="Ir al inicio de sesión"
          onPress={() => router.replace("/login")}
          style={styles.successBtn}
        />
      </View>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────
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
        {/* ── Logo + Título ──────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={[styles.logoBox, { borderColor: C.primary }]}>
            <Text style={[styles.logoText, { color: C.primary }]}>UC</Text>
            <View style={[styles.logoDot, { backgroundColor: C.accent }]} />
          </View>
          <Text style={[styles.appName, { color: C.primary }]}>UniConnect</Text>
          <Text style={[styles.tagline, { color: C.textSecondary }]}>
            Crea tu cuenta con tu correo institucional
          </Text>
        </View>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: C.surface }]}>
          <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
            Regístrate
          </Text>

          <ErrorBanner message={formError} />

          <AuthInput
            label="Nombre completo"
            placeholder="Ej: Juan Pérez López"
            value={fullName}
            onChangeText={handleNameChange}
            autoCapitalize="words"
            error={errors.fullName}
          />

          <AuthInput
            label="Correo institucional"
            placeholder="tu.nombre@ucaldas.edu.co"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            error={errors.email}
          />

          <AuthInput
            label="Contraseña"
            placeholder="Mín. 8 caracteres"
            value={password}
            onChangeText={handlePasswordChange}
            isPassword
            error={errors.password}
          />

          <AuthInput
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={handleConfirmChange}
            isPassword
            error={errors.confirmPassword}
          />

          {/* Nota de política */}
          <Text style={[styles.policyNote, { color: C.textPlaceholder }]}>
            Al registrarte aceptas los términos de uso de UniConnect.
          </Text>

          <PrimaryButton
            label="Crear cuenta"
            onPress={handleRegister}
            isLoading={isLoading}
            disabled={!isValid}
            style={styles.submitBtn}
          />

          {/* Ir a login */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: C.textSecondary }]}>
              ¿Ya tienes cuenta?{" "}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.loginLink, { color: C.primary }]}>
                  Inicia sesión
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

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    justifyContent: "center",
  },

  // Header
  header: { alignItems: "center", marginBottom: 28 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    position: "relative",
  },
  logoText: { fontSize: 22, fontWeight: "800", letterSpacing: 1 },
  logoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    bottom: 8,
    right: 8,
  },
  appName: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5, marginBottom: 4 },
  tagline: { fontSize: 13, textAlign: "center", lineHeight: 18 },

  // Card
  card: {
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },

  policyNote: { fontSize: 12, marginBottom: 4, lineHeight: 16 },
  submitBtn: { marginTop: 8 },

  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "600" },

  footer: { textAlign: "center", fontSize: 12, marginTop: 24 },

  // Éxito
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successIcon: { fontSize: 36 },
  successTitle: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  successBody: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  successBtn: { width: "100%" },
});