import { router } from "expo-router";
import { useState } from "react";
import { signIn, signUp } from "./useAuthActions";

const UCALDAS_REGEX = /^[a-zA-Z0-9._%+-]+@ucaldas\.edu\.co$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function useRegisterScreen() {
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
      await signUp({
        email,
        password,
        fullName,
      });

      await signIn({
        email,
        password,
      });

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

  return {
    fullName,
    email,
    password,
    confirmPassword,
    isLoading,
    registered,
    setRegistered,
    formError,
    errors,
    handleNameChange,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmChange,
    handleRegister,
    isValid,
  };
}
