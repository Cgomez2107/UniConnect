import { useLocalSearchParams } from "expo-router";

import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";

export default function StudyGroupAdminRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = typeof id === "string" ? id : undefined;

  return <AdminDashboardLayout requestId={requestId} />;
}
