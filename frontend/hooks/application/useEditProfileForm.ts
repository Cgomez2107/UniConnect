import { useAuthStore } from "@/store/useAuthStore";
import type { Program, Subject } from "@/types";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  addMySubject,
  getMyPrograms,
  getMySubjects,
  getProfile,
  getPrograms,
  getSubjectsByProgram,
  removeMySubject,
  setPrimaryProgram,
  updateProfile,
  uploadAvatar,
} from "./useProfileEditor";

interface UserProgram {
  id: string;
  name: string;
  faculty_name: string;
  is_primary: boolean;
}

interface UseEditProfileFormParams {
  onSaved?: () => void;
}

export function useEditProfileForm({ onSaved }: UseEditProfileFormParams) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);

  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);
  const [showAddSubjects, setShowAddSubjects] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState("");

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

  const processAndUpload = async (uri: string) => {
    try {
      if (!user?.id) return;
      setUploadingAvatar(true);
      const publicUrl = await uploadAvatar(user.id, uri);
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
      return;
    }
    try {
      if (!user?.id) return;
      await setPrimaryProgram(user.id, programId);
      setSelectedProgramId(programId);
      setUserSubjects([]);
    } catch {
      Alert.alert("Error", "No se pudo actualizar el programa. Intenta de nuevo.");
    }
  };

  const handleToggleSubject = (subjectId: string, isSelected: boolean) => {
    if (isSelected) {
      setUserSubjects((prev) => prev.filter((s) => s !== subjectId));
    } else {
      setUserSubjects((prev) => [...prev, subjectId]);
    }
  };

  const isPhoneValid = (phone: string): boolean => {
    if (!phone) return true;
    return /^(\+\d{1,3})?\s?\d{7,14}$/i.test(phone.replace(/\s/g, ""));
  };

  const handleSave = async () => {
    if (!isPhoneValid(phoneNumber)) {
      Alert.alert("Teléfono inválido", "Por favor ingresa un teléfono válido (ej: +57 3001234567)");
      return;
    }

    setIsLoading(true);
    try {
      if (!user?.id) return;

      await updateProfile(user.id, {
        bio: bio.trim() || undefined,
        phone_number: phoneNumber.trim() || null,
      });

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
        { text: "OK", onPress: () => onSaved?.() },
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

  const isFormValid = bio.trim() || phoneNumber.trim();

  return {
    user,
    bio,
    setBio,
    phoneNumber,
    setPhoneNumber,
    avatarUri,
    uploadingAvatar,
    showAvatarOptions,
    setShowAvatarOptions,
    userPrograms,
    selectedProgramId,
    handleSelectProgram,
    allPrograms,
    allSubjects,
    userSubjects,
    showAddSubjects,
    setShowAddSubjects,
    subjectSearch,
    setSubjectSearch,
    isLoading,
    isLoadingData,
    isPhoneValid,
    handleTakePhoto,
    handlePickFromGallery,
    handleToggleSubject,
    handleSave,
    filteredAvailableSubjects,
    isFormValid,
  };
}
