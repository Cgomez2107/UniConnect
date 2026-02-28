/**
 * app/editar-perfil.tsx
 * Modal para editar el perfil — US-004
 * Permite editar: nombre, programa, materias, biografía y foto de perfil
 * Foto: galería o cámara en tiempo real
 */

import { Colors } from "@/constants/Colors";
import type { Program, Subject } from "@/lib/services/facultyService";
import { getPrograms, getSubjectsByProgram } from "@/lib/services/facultyService";
import {
  addMySubject,
  getMyPrograms,
  getMySubjects,
  getProfile,
  removeMySubject,
  setPrimaryProgram,
  updateProfile,
  uploadAvatar,
} from "@/lib/services/profileService";
import { useAuthStore } from "@/store/useAuthStore";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

interface UserProgram {
  id: string;
  name: string;
  faculty_name: string;
  is_primary: boolean;
}

export default function EditarPerfilScreen() {
  const scheme = useColorScheme() ?? "light";
  const C = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Form state
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState("");

  // Avatar state
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  // Program state
  const [allPrograms, setAllPrograms] = useState<(Program & { faculty_name: string })[]>([]);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [showProgramSelector, setShowProgramSelector] = useState(false);

  // Subjects state
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [showAddSubjects, setShowAddSubjects] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      if (!user?.id) return;

      const profile = await getProfile(user.id);
      if (profile) {
        setFullName(profile.full_name);
        setBio(profile.bio ?? "");
        setAvatarUri(profile.avatar_url ?? null);
      }

      const myPrograms = await getMyPrograms(user.id);
      const programsList = myPrograms.map((up) => ({
        id: up.program_id,
        name: up.programs?.name ?? "",
        faculty_name: up.programs?.faculties?.name ?? "",
        is_primary: up.is_primary,
      }));
      setUserPrograms(programsList);

      const primaryProgram = programsList.find((p) => p.is_primary);
      if (primaryProgram) {
        setSelectedProgramId(primaryProgram.id);
      }

      const mySubjects = await getMySubjects(user.id);
      setUserSubjects(mySubjects.map((us) => us.subject_id));

      const programs = await getPrograms();
      setAllPrograms(programs);
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del perfil.");
    } finally {
      setIsLoadingData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadAvailableSubjects = useCallback(async (programId: string) => {
    try {
      if (!programId) {
        setAllSubjects([]);
        return;
      }
      const subjects = await getSubjectsByProgram(programId);
      setAllSubjects(subjects);
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      loadAvailableSubjects(selectedProgramId);
    }
  }, [selectedProgramId, loadAvailableSubjects]);

  // ── Foto de perfil ────────────────────────────────────────────────────────
  const processAndUpload = async (uri: string) => {
    try {
      setUploadingAvatar(true);
      const publicUrl = await uploadAvatar(user!.id, uri);
      setAvatarUri(publicUrl);
    } catch (error) {
      Alert.alert("Error", "No se pudo subir la foto. Intenta de nuevo.");
      console.error(error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePickFromGallery = async () => {
    setShowAvatarOptions(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;
    await processAndUpload(result.assets[0].uri);
  };

  const handleTakePhoto = async () => {
    setShowAvatarOptions(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara para tomar la foto.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;
    await processAndUpload(result.assets[0].uri);
  };

  // ── Programa ──────────────────────────────────────────────────────────────
  const handleAddProgram = (programId: string) => {
    setSelectedProgramId(programId);
    setShowProgramSelector(false);
    loadAvailableSubjects(programId);
  };

  // ── Materias ──────────────────────────────────────────────────────────────
  const handleToggleSubject = (subjectId: string, isSelected: boolean) => {
    if (isSelected) {
      setUserSubjects((prev) => prev.filter((s) => s !== subjectId));
    } else {
      setUserSubjects((prev) => [...prev, subjectId]);
    }
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!fullName.trim()) return;

    setIsLoading(true);
    try {
      if (!user?.id) return;

      await updateProfile(user.id, {
        full_name: fullName,
        bio: bio.trim() || undefined,
      });

      const primaryProgram = userPrograms.find((p) => p.is_primary);
      if (primaryProgram?.id !== selectedProgramId && selectedProgramId) {
        await setPrimaryProgram(user.id, selectedProgramId);
      }

      const currentSubjects = await getMySubjects(user.id);
      const oldSubjectIds = new Set(currentSubjects.map((s) => s.subject_id));
      const newSubjectIds = new Set(userSubjects);

      for (const oldId of oldSubjectIds) {
        if (!newSubjectIds.has(oldId)) {
          await removeMySubject(user.id, oldId);
        }
      }

      for (const newId of newSubjectIds) {
        if (!oldSubjectIds.has(newId)) {
          await addMySubject(user.id, newId);
        }
      }

      setUser({
        ...user,
        fullName: fullName,
        bio: bio.trim() || undefined,
      });

      Alert.alert("Perfil actualizado", "Los cambios se guardaron correctamente.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message = (error as any)?.message || "No se pudo actualizar el perfil.";
      Alert.alert("Error", message);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentSelected = allPrograms.find((p) => p.id === selectedProgramId);
  const programName = currentSelected
    ? `${currentSelected.name} — ${currentSelected.faculty_name}`
    : "Sin programa";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Foto de perfil ── */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            onPress={() => setShowAvatarOptions(true)}
            disabled={uploadingAvatar}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            )}

            {/* Overlay de carga */}
            {uploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}

            {/* Badge de editar */}
            {!uploadingAvatar && (
              <View style={[styles.avatarEditBadge, { backgroundColor: C.primary }]}>
                <Text style={styles.avatarEditIcon}>✏️</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: C.textSecondary }]}>
            Toca para cambiar la foto
          </Text>
        </View>

        {/* ── Nombre ── */}
        <Field label="Nombre completo" C={C}>
          <TextInput
            style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tu nombre completo"
            placeholderTextColor={C.textPlaceholder}
            autoCapitalize="words"
          />
        </Field>

        {/* ── Programa ── */}
        <Field label="Programa" C={C}>
          <TouchableOpacity
            style={[styles.programButton, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => setShowProgramSelector(!showProgramSelector)}
          >
            <Text style={{ color: currentSelected ? C.textPrimary : C.textPlaceholder }}>
              {programName}
            </Text>
          </TouchableOpacity>

          {showProgramSelector && (
            <View style={[styles.programList, { backgroundColor: C.background, borderColor: C.border }]}>
              {allPrograms.map((program) => (
                <TouchableOpacity
                  key={program.id}
                  style={[
                    styles.programItem,
                    {
                      borderBottomColor: C.border,
                      backgroundColor: selectedProgramId === program.id ? C.primaryLight : C.surface,
                    },
                  ]}
                  onPress={() => handleAddProgram(program.id)}
                >
                  <View>
                    <Text style={[styles.programItemName, { color: C.textPrimary }]}>
                      {program.name}
                    </Text>
                    <Text style={[styles.programItemFaculty, { color: C.textSecondary }]}>
                      {program.faculty_name}
                    </Text>
                  </View>
                  {selectedProgramId === program.id && (
                    <Text style={{ color: C.primary, fontSize: 18 }}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Field>

        {/* ── Materias ── */}
        <Field label="Materias" C={C}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: C.primary }]}
            onPress={() => setShowAddSubjects(!showAddSubjects)}
          >
            <Text style={[styles.buttonText, { color: C.textOnPrimary }]}>
              {userSubjects.length > 0 ? `${userSubjects.length} materias` : "Agregar materias"}
            </Text>
          </TouchableOpacity>

          {userSubjects.length > 0 && (
            <View style={[styles.subjectsList, { borderColor: C.border }]}>
              {userSubjects.map((subjectId) => {
                const subject = allSubjects.find((s) => s.id === subjectId);
                return (
                  <View
                    key={subjectId}
                    style={[styles.subjectItem, { backgroundColor: C.primaryLight, borderColor: C.border }]}
                  >
                    <Text style={[styles.subjectName, { color: C.textPrimary }]}>
                      {subject?.name || subjectId}
                    </Text>
                    <TouchableOpacity onPress={() => handleToggleSubject(subjectId, true)}>
                      <Text style={{ color: C.error, fontSize: 18 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {showAddSubjects && selectedProgramId && (
            <View style={[styles.subjectsSelector, { backgroundColor: C.surface, borderColor: C.border }]}>
              {allSubjects.length > 0 ? (
                allSubjects.map((subject) => {
                  const isSelected = userSubjects.includes(subject.id);
                  return (
                    <TouchableOpacity
                      key={subject.id}
                      style={[
                        styles.subjectCheckbox,
                        {
                          backgroundColor: isSelected ? C.primaryLight : "transparent",
                          borderColor: C.border,
                        },
                      ]}
                      onPress={() => handleToggleSubject(subject.id, isSelected)}
                    >
                      <Text style={{ color: C.textPrimary, fontSize: 18, marginRight: 10 }}>
                        {isSelected ? "☑" : "☐"}
                      </Text>
                      <Text style={{ color: C.textPrimary, flex: 1 }}>{subject.name}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ color: C.textSecondary, textAlign: "center", padding: 15 }}>
                  No hay materias disponibles para este programa
                </Text>
              )}
            </View>
          )}

          {showAddSubjects && !selectedProgramId && (
            <Text style={{ color: C.error, padding: 10, textAlign: "center" }}>
              Selecciona un programa primero
            </Text>
          )}
        </Field>

        {/* ── Biografía ── */}
        <Field label="Sobre mí" C={C}>
          <TextInput
            style={[styles.textArea, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Cuéntale a tus compañeros sobre ti..."
            placeholderTextColor={C.textPlaceholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={{ color: C.textSecondary, fontSize: 12, marginTop: 4 }}>
            {bio.length}/500
          </Text>
        </Field>

        {/* ── Guardar ── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: fullName.trim() ? C.primary : C.border }]}
          onPress={handleSave}
          disabled={!fullName.trim() || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { color: fullName.trim() ? C.textOnPrimary : C.textSecondary }]}>
              Guardar cambios
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal: opciones de foto ── */}
      <Modal
        transparent
        visible={showAvatarOptions}
        animationType="fade"
        onRequestClose={() => setShowAvatarOptions(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAvatarOptions(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: C.surface }]}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
              Cambiar foto de perfil
            </Text>

            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: C.border }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.modalOptionIcon}>📷</Text>
              <Text style={[styles.modalOptionText, { color: C.textPrimary }]}>
                Tomar foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: C.border }]}
              onPress={handlePickFromGallery}
            >
              <Text style={styles.modalOptionIcon}>🖼️</Text>
              <Text style={[styles.modalOptionText, { color: C.textPrimary }]}>
                Elegir de la galería
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowAvatarOptions(false)}
            >
              <Text style={[styles.modalCancelText, { color: C.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  C,
}: {
  label: string;
  children: React.ReactNode;
  C: (typeof Colors)["light"];
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: C.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 20, gap: 4, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, height: 48, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 14, minHeight: 100 },

  // Avatar
  avatarContainer: { alignItems: "center", marginBottom: 28 },
  avatarWrapper: { width: 96, height: 96, position: "relative" },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 40 },
  avatarOverlay: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditIcon: { fontSize: 14 },
  avatarHint: { fontSize: 12, marginTop: 8 },

  // Program selector
  programButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, height: 48, justifyContent: "center" },
  programList: { borderWidth: 1, borderRadius: 8, marginTop: 8, maxHeight: 300 },
  programItem: { padding: 14, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  programItemName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  programItemFaculty: { fontSize: 12 },

  // Subjects
  button: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
  buttonText: { fontSize: 14, fontWeight: "600" },
  subjectsList: { borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 10, gap: 8 },
  subjectItem: { flexDirection: "row", borderWidth: 1, borderRadius: 6, padding: 10, justifyContent: "space-between", alignItems: "center" },
  subjectName: { flex: 1, fontSize: 13, fontWeight: "500" },
  subjectsSelector: { borderWidth: 1, borderRadius: 8, marginTop: 8, padding: 8, gap: 4 },
  subjectCheckbox: { flexDirection: "row", borderWidth: 1, borderRadius: 6, padding: 12, alignItems: "center" },

  // Save button
  saveBtn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  saveBtnText: { fontSize: 15, fontWeight: "700" },

  // Modal opciones avatar
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  modalOptionIcon: { fontSize: 22 },
  modalOptionText: { fontSize: 15, fontWeight: "500" },
  modalCancel: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
  modalCancelText: { fontSize: 15 },
});