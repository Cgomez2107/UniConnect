import { Redirect, useLocalSearchParams } from "expo-router";

export default function AdminFallback() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = typeof id === "string" ? id : "";

  return <Redirect href={`/study-groups/${requestId}`} />;
}
