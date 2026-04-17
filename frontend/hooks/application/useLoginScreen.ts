import { useGoogleAuth } from "@/hooks/application/useGoogleAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

const UCALDAS_REGEX = /^[a-zA-Z0-9._%+-]+@ucaldas\.edu\.co$/;

export function useLoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const lastRedirectKeyRef = useRef<string | null>(null);

  const {
    loading: googleLoading,
    error: googleError,
    signInWithGoogle,
  } = useGoogleAuth();

  useEffect(() => {
    if (isHydrating) return;
    if (!isAuthenticated || !user) return;

    const redirectKey = `${user.id}:${user.role}`;
    if (lastRedirectKeyRef.current === redirectKey) {
      return;
    }
    lastRedirectKeyRef.current = redirectKey;

    if (user.role === "admin") {
      router.replace("/(admin)" as any);
    } else {
      router.replace("/(tabs)" as any);
    }
  }, [isHydrating, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      lastRedirectKeyRef.current = null;
    }
  }, [isAuthenticated]);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(
      value.length > 0 && !UCALDAS_REGEX.test(value)
        ? "Debe ser un correo @ucaldas.edu.co"
        : "",
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
    } catch (error: any) {
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

  const isValid = UCALDAS_REGEX.test(email) && password.length >= 6;

  return {
    email,
    setEmail,
    password,
    setPassword,
    emailError,
    formError,
    handleEmailChange,
    handleLogin,
    isValid,
    isLoading,
    googleLoading,
    googleError,
    signInWithGoogle,
  };
}
