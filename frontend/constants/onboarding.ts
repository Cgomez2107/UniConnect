/**
 * constants/onboarding.ts
 *
 * Datos de los slides del onboarding separados de la lógica de UI.
 * Si en el futuro se traen de una API (A/B testing, contenido dinámico),
 * solo se cambia este archivo — ningún componente se toca.
 */

export interface OnboardingSlide {
  id: string
  emoji: string
  title: string
  body: string
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    emoji: "🎓",
    title: "Bienvenido a UniConnect",
    body: "La red académica exclusiva para estudiantes de la Universidad de Caldas.",
  },
  {
    id: "2",
    emoji: "🤝",
    title: "Forma tu equipo ideal",
    body: "Publica solicitudes de estudio, encuentra compañeros y forma grupos por materia o proyecto.",
  },
  {
    id: "3",
    emoji: "🚀",
    title: "Empieza a conectar",
    body: "Solo necesitas tu correo @ucaldas.edu.co para unirte a la comunidad.",
  },
]
