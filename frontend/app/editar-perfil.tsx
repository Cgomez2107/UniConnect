/**
 * app/editar-perfil.tsx
 * 
 * Pantalla de edición de perfil — US-004: Completar perfil público
 * 
 */

import { Colors } from "@/constants/Colors";
import type { Program, Subject } from "@/types";
import {
  getPrograms,
  getSubjectsByProgram,
  addMySubject,
  getMyPrograms,
  getMySubjects,
  getProfile,
  removeMySubject,
  setPrimaryProgram,
  updateProfile,
  uploadAvatar,
} from "@/hooks/application/useProfileEditor";
import { useAuthStore } from "@/store/useAuthStore";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  // Form state — SOLO CAMPOS EDITABLES
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");

  // Avatar state
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  // Program state
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [showProgramSelector, setShowProgramSelector] = useState(false);

  // Subjects state
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [showAddSubjects, setShowAddSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      if (!user?.id) return;

      const profile = await getProfile(user.id);
      if (profile) {
        setBio(profile.bio ?? "");
        setPhoneNumber(profile.phone_number ?? "");
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
      mediaTypes: ["images"] as any,
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

  const handleSelectProgram = async (programId: string) => {
    if (programId === selectedProgramId) {
      setShowProgramSelector(false);
      return;
    }
    try {
      await setPrimaryProgram(user!.id, programId);
      setSelectedProgramId(programId);
      setUserSubjects([]); // limpiar materias al cambiar programa
      setShowProgramSelector(false);
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el programa. Intenta de nuevo.");
    }
  };

  // ── Materias ──────────────────────────────────────────────────────────
  const handleToggleSubject = (subjectId: string, isSelected: boolean) => {
    if (isSelected) {
      setUserSubjects((prev) => prev.filter((s) => s !== subjectId));
    } else {
      setUserSubjects((prev) => [...prev, subjectId]);
    }
  };

  // ── Validación del teléfono ───────────────────────────────────────────────
  const isPhoneValid = (phone: string): boolean => {
    if (!phone) return true; // Opcional
    // Permitir formato: +57 3XX XXXXXXX o similares
    return /^(\+\d{1,3})?\s?\d{7,14}$/i.test(phone.replace(/\s/g, ""));
  };

  // ── Guardar ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isPhoneValid(phoneNumber)) {
      Alert.alert("Teléfono inválido", "Por favor ingresa un teléfono válido (ej: +57 3001234567)");
      return;
    }

    setIsLoading(true);
    try {
      if (!user?.id) return;

      // Actualizar solo los campos permitidos: bio y teléfono
      await updateProfile(user.id, {
        bio: bio.trim() || undefined,
        phone_number: phoneNumber.trim() || null,
      });

      // Actualizar materias si cambiaron
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
        bio: bio.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        avatarUrl: avatarUri ?? null,
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

  const filteredAvailableSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    if (!query) return allSubjects;
    return allSubjects.filter((subject) => subject.name.toLowerCase().includes(query));
  }, [allSubjects, subjectSearch]);

  if (isLoadingData) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isFormValid = bio.trim() || phoneNumber.trim();

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

        {/* ── Nombre (SOLO LECTURA) ── */}
        <Field label="Nombre completo" C={C}>
          <View style={[styles.readOnlyInput, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.readOnlyText, { color: C.textPrimary }]}>
              {user?.fullName || "No disponible"}
            </Text>
            <Text style={[styles.readOnlyHint, { color: C.textSecondary }]}>
              No se puede editar desde aquí
            </Text>
          </View>
        </Field>

        {/* ── Programa (SOLO LECTURA) ── */}
        <Field label="Programa académico" C={C}>
          <View style={[styles.readOnlyInput, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.readOnlyText, { color: C.textPrimary }]}>
              {userPrograms.find((p) => p.is_primary)
                ? `${userPrograms.find((p) => p.is_primary)!.name} — ${userPrograms.find((p) => p.is_primary)!.faculty_name}`
                : "Sin programa asignado"}
            </Text>
            <Text style={[styles.readOnlyHint, { color: C.textSecondary }]}>
              No se puede editar desde aquí
            </Text>
          </View>
        </Field>

        {/* ── Teléfono (EDITABLE) ── */}
        <Field label="Teléfono de contacto" C={C}>
          <Text style={[styles.inputHint, { color: C.textSecondary }]}>
            Formato: +57 3001234567
          </Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: C.surface, 
                borderColor: !isPhoneValid(phoneNumber) ? C.error : C.border, 
                color: C.textPrimary 
              }
            ]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+57 300 1234567"
            placeholderTextColor={C.textPlaceholder}
            keyboardType="phone-pad"
          />
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

          {showAddSubjects && selectedProgramId && (
            <View style={[styles.subjectsSelector, { backgroundColor: C.surface, borderColor: C.border }]}>
              <TextInput
                style={[
                  styles.subjectSearchInput,
                  { backgroundColor: C.background, borderColor: C.border, color: C.textPrimary },
                ]}
                value={subjectSearch}
                onChangeText={setSubjectSearch}
                placeholder="Buscar materia..."
                placeholderTextColor={C.textPlaceholder}
              />

              <ScrollView
                style={styles.subjectsSelectorScroll}
                contentContainerStyle={styles.subjectsSelectorContent}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {allSubjects.length === 0 ? (
                  <Text style={{ color: C.textSecondary, textAlign: "center", padding: 15 }}>
                    No hay materias disponibles para este programa
                  </Text>
                ) : filteredAvailableSubjects.length === 0 ? (
                  <Text style={{ color: C.textSecondary, textAlign: "center", padding: 15 }}>
                    No hay materias que coincidan con la búsqueda
                  </Text>
                ) : (
                  filteredAvailableSubjects.map((subject) => {
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
                )}
              </ScrollView>
            </View>
          )}

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

          {showAddSubjects && !selectedProgramId && (
            <Text style={{ color: C.error, padding: 10, textAlign: "center" }}>
              Asigna un programa primero
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
          style={[styles.saveBtn, { backgroundColor: isFormValid && isPhoneValid(phoneNumber) ? C.primary : C.border }]}
          onPress={handleSave}
          disabled={!isFormValid || isLoading || !isPhoneValid(phoneNumber)}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveBtnText, { color: isFormValid && isPhoneValid(phoneNumber) ? C.textOnPrimary : C.textSecondary }]}>
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
  inputHint: { fontSize: 12, marginBottom: 6 },
  textArea: { borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 14, minHeight: 100 },

  // Read-only fields
  readOnlyInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48, justifyContent: "center", opacity: 0.6 },
  readOnlyText: { fontSize: 15, fontWeight: "500" },
  readOnlyHint: { fontSize: 11, marginTop: 4, fontStyle: "italic" },

  // Program selector
  selectorBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectorBtnText: { fontSize: 15, flex: 1 },
  programList: { borderWidth: 1, borderRadius: 8, marginTop: 4, overflow: "hidden" },
  programOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },

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

  // Subjects
  button: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, alignItems: "center" },
  buttonText: { fontSize: 14, fontWeight: "600" },
  subjectsList: { borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 10, gap: 8 },
  subjectItem: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subjectName: { fontSize: 14, fontWeight: "500", flex: 1 },
  subjectsSelector: { borderWidth: 1, borderRadius: 8, marginTop: 8, maxHeight: 300, overflow: "hidden" },
  subjectSearchInput: { borderWidth: 1, borderRadius: 8, margin: 10, paddingHorizontal: 12, height: 42, fontSize: 14 },
  subjectsSelectorScroll: { maxHeight: 220 },
  subjectsSelectorContent: { paddingBottom: 6 },
  subjectCheckbox: { padding: 14, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", borderBottomColor: "transparent" },

  // Save button
  saveBtn: { borderRadius: 8, paddingVertical: 14, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", marginTop: 20 },
  saveBtnText: { fontSize: 16, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 15,
    flex: 1,
  },
  modalCancel: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
