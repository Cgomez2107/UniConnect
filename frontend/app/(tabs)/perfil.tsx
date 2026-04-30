/**
 * app/(tabs)/perfil.tsx
 *
 * Perfil del estudiante - US-004.
 * ORQUESTADOR puro: conecta el hook useProfile con los componentes.
 *
 * Logica de datos  -> hooks/useProfile.ts
 * Componentes      -> components/perfil/, components/shared/
 */

import { MiniRequestCard } from "@/components/perfil/MiniRequestCard";
import { ProfileHero } from "@/components/perfil/ProfileHero";
import { StatsRow } from "@/components/perfil/StatsRow";
import { InfoRow } from "@/components/shared/InfoRow";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import { Colors } from "@/constants/Colors";
import { useProfile } from "@/hooks/application/useProfile";
import { useAuthStore } from "@/store/useAuthStore";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PerfilScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const {
    avatarUrl,
    phoneNumber,
    userPrograms,
    userSubjects,
    myRequests,
    initials,
    primaryProgramName,
    primaryFacultyName,
    hasPrimaryProgram,
    isLoading,
  } = useProfile();

  const handleSignOut = useCallback(() => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  }, [signOut]);

  const openEditProfile = useCallback(() => {
    router.push("/editar-perfil");
  }, []);

  const openNewRequest = useCallback(() => {
    router.push("/nueva-solicitud");
  }, []);

  const scrollContentStyle = useMemo(
    () => ({ paddingBottom: insets.bottom + 80 }),
    [insets.bottom],
  );

  return (
    <View style={[styles.safe, { backgroundColor: C.background, paddingTop: insets.top }]}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
      >
        <ProfileHero
          fullName={user?.fullName ?? "Estudiante"}
          email={user?.email ?? ""}
          initials={initials}
          avatarUrl={avatarUrl}
          primaryProgramName={primaryProgramName}
          hasPrimaryProgram={hasPrimaryProgram}
        />

        {isLoading ? (
          <View style={{ paddingVertical: 40 }}>
            <LoadingState message="Cargando datos académicos..." />
          </View>
        ) : (
          <>
            <SectionCard title="Información académica">
              {user?.semester ? (
                <InfoRow emoji="📅" label="Semestre" value={`${user.semester}° semestre`} />
              ) : null}
              <InfoRow emoji="🎓" label={`Programa${userPrograms.length > 1 ? "s" : ""}`}>
                {userPrograms.length === 0 ? (
                  <Text style={{ fontSize: 14, color: C.textPlaceholder }}>
                    Sin programa registrado
                  </Text>
                ) : (
                  userPrograms.map((p) => (
                    <View key={p.program_id} style={styles.programRow}>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: C.textPrimary }}>
                        {p.programs?.name ?? "-"}
                      </Text>
                      {p.is_primary && (
                        <View style={[styles.primaryBadge, { backgroundColor: C.accent + "30" }]}>
                          <Text style={[styles.primaryBadgeText, { color: C.accentDark }]}>
                            Principal
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
                <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
                  {primaryFacultyName}
                </Text>
              </InfoRow>
            </SectionCard>

            {/* Materias */}
            <SectionCard
              title="Materias actuales"
              actionLabel="Editar"
              onAction={openEditProfile}
            >
              {userSubjects.length === 0 ? (
                <Text style={{ fontSize: 13, color: C.textPlaceholder, textAlign: "center", paddingVertical: 12 }}>
                  Aun no has registrado materias
                </Text>
              ) : (
                <View style={styles.chips}>
                  {userSubjects.map((s) => (
                    <View key={s.subject_id} style={[styles.chip, { backgroundColor: C.primary + "10", borderColor: C.primary + "30" }]}>
                      <Text style={[styles.chipText, { color: C.primary }]}>
                        {s.subjects?.name ?? "-"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>

            {/* Contacto */}
            <SectionCard
              title="Contacto"
              actionLabel="Editar"
              onAction={openEditProfile}
            >
              {phoneNumber ? (
                <InfoRow emoji="📱" label="Teléfono" value={phoneNumber} />
              ) : (
                <Text style={{ fontSize: 13, color: C.textPlaceholder, textAlign: "center", paddingVertical: 12 }}>
                  Aún no has agregado un teléfono de contacto
                </Text>
              )}
            </SectionCard>

            {/* Sobre mi */}
            <SectionCard
              title="Sobre mi"
              actionLabel="Editar"
              onAction={openEditProfile}
            >
              <Text style={{ fontSize: 14, lineHeight: 22, color: C.textSecondary }}>
                {user?.bio?.trim()
                  ? user.bio
                  : "Aún no has escrito una biografía. Toca Editar para agregar una."}
              </Text>
            </SectionCard>

            {/* Publicaciones */}
            <SectionCard
              title="Mis publicaciones"
              actionLabel="+ Nueva"
              onAction={openNewRequest}
            >
              {myRequests.length === 0 ? (
                <View style={styles.emptySmall}>
                  <Text style={{ fontSize: 28 }}>📭</Text>
                  <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: "center" }}>
                    Aún no tienes solicitudes publicadas
                  </Text>
                </View>
              ) : (
                myRequests.map((r) => <MiniRequestCard key={r.id} request={r} />)
              )}
            </SectionCard>

            {/* Estadisticas */}
            <StatsRow
              requestsCount={myRequests.length}
              subjectsCount={userSubjects.length}
            />
          </>
        )}

        {/* Cerrar sesion */}
        <TouchableOpacity
          style={[styles.signOut, { borderColor: C.borderError }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={[styles.signOutText, { color: C.error }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  programRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  primaryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeText: { fontSize: 10, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" },
  emptySmall: { alignItems: "center", paddingVertical: 16, gap: 6 },
  signOut: {
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  signOutText: { fontSize: 14, fontWeight: "600" },
});