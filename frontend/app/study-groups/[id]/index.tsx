import { useLocalSearchParams } from "expo-router";

import { StudyGroupDetailScreen } from "@/components/solicitud/StudyGroupDetailScreen";

export default function StudyGroupDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = typeof id === "string" ? id : undefined;

  return <StudyGroupDetailScreen requestId={requestId} />;
}
