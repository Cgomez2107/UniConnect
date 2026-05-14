/**
 * Índice centralizado de todos los hooks de UniConnect
 *
 * Exporta todos los hooks custom para facilitar importaciones
 *
 * @example
 * import {
 *   useAuth,
 *   useProfile,
 *   useConversations,
 *   useNotifications,
 * } from "@/hooks";
 */

export { default as useAuth } from "./useAuth";
export { default as useColorScheme } from "./useColorScheme";
export { default as useFeed } from "./useFeed";
export { default as useFaculties } from "./useFaculties";
export { default as useProfile } from "./useProfile";
export { default as useConversations } from "./useConversations";
export { default as useMessages } from "./useMessages";
export { default as useSearchStudents } from "./useSearchStudents";
export { default as useResources } from "./useResources";
export { default as useEvents } from "./useEvents";
export { default as useAdmin } from "./useAdmin";
export { default as useForm } from "./useForm";
export { default as useThemeColor } from "./useThemeColor";
export { default as useNotifications } from "./useNotifications";
export { default as useAsync } from "./useAsync";
export { usePostulationForm } from "./usePostulationForm";
