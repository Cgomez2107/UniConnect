import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useAuth from "@/hooks/useAuth";
import profilesService from "@/lib/services/profiles.service";
import type { Program, Subject, UserProgram, UserSubject } from "@/types";

const PHONE_REGEX = /^(\+?\d{1,3}[\s-]?)?\d{7,14}$/;
const MAX_BIO_LENGTH = 500;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface EditProfileFormState {
  name: string;
  phone: string;
  bio: string;
  semester: string;
  avatarFile: File | null;
  avatarPreview: string;
  selectedProgramId: string;
  selectedSubjectIds: string[];
}

export interface EditProfileFormErrors {
  name?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export interface ProgramChangeConfirm {
  show: boolean;
  newProgramId: string;
  newProgramName: string;
}

export function isPhoneValid(phone: string): boolean {
  if (!phone) return true;
  return PHONE_REGEX.test(phone.trim());
}

export default function useEditProfileForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<EditProfileFormState>({
    name: user?.name || user?.email?.split("@")[0] || "",
    phone: "",
    bio: "",
    semester: "",
    avatarFile: null,
    avatarPreview: "",
    selectedProgramId: "",
    selectedSubjectIds: [],
  });

  const [errors, setErrors] = useState<EditProfileFormErrors>({});

  const [programChangeConfirm, setProgramChangeConfirm] = useState<ProgramChangeConfirm>({
    show: false,
    newProgramId: "",
    newProgramName: "",
  });

  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");

  const initialProgramId = useRef("");
  const initialSubjectIds = useRef<string[]>([]);
  const avatarChanged = useRef(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [profileData, programsData, subjectsData, allPrograms] = await Promise.all([
          profilesService.getProfile().catch(() => null),
          profilesService.getMyPrograms().catch(() => [] as UserProgram[]),
          profilesService.getMySubjects().catch(() => [] as UserSubject[]),
          profilesService.getPrograms().catch(() => [] as Program[]),
        ]);

        if (cancelled) return;

        loaded.current = true;

        const primaryProgram = programsData.find((p) => p.is_primary) ?? programsData[0];
        const currentSubjects = subjectsData.map((s) => s.subject_id).filter(Boolean);

        setState((prev) => ({
          ...prev,
          name: profileData?.full_name || user?.name || "",
          phone: profileData?.phone_number || "",
          bio: profileData?.bio || "",
          semester: profileData?.semester ? String(profileData.semester) : "",
          avatarPreview: profileData?.avatar_url || user?.profileImage || "",
          selectedProgramId: primaryProgram?.program_id || "",
          selectedSubjectIds: currentSubjects,
        }));

        initialProgramId.current = primaryProgram?.program_id || "";
        initialSubjectIds.current = currentSubjects;

        setAvailablePrograms(allPrograms);
      } catch (err) {
        if (!cancelled) setError("Error cargando datos del formulario");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!state.selectedProgramId) return;
    let cancelled = false;

    profilesService.getSubjectsByProgram(state.selectedProgramId)
      .then((subjects) => { if (!cancelled) setAvailableSubjects(subjects); })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [state.selectedProgramId]);

  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) return "El nombre es obligatorio";
    if (value.length > 100) return "El nombre es demasiado largo";
    return undefined;
  }, []);

  const validatePhone = useCallback((value: string): string | undefined => {
    if (!value) return undefined;
    if (!PHONE_REGEX.test(value.trim())) return "Formato de teléfono inválido";
    return undefined;
  }, []);

  const validateBio = useCallback((value: string): string | undefined => {
    if (value.length > MAX_BIO_LENGTH) return `Máximo ${MAX_BIO_LENGTH} caracteres`;
    return undefined;
  }, []);

  const validateAvatarFile = useCallback((file: File): string | undefined => {
    if (file.size > MAX_AVATAR_SIZE) return "El archivo debe ser menor a 5MB";
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return "Solo se aceptan JPG, PNG o WebP";
    return undefined;
  }, []);

  const isFormValid = useMemo(() => {
    return (
      state.name.trim().length > 0 &&
      isPhoneValid(state.phone) &&
      state.bio.length <= MAX_BIO_LENGTH
    );
  }, [state.name, state.phone, state.bio]);

  const handleSemesterChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, semester: value }));
  }, []);

  const handleNameChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, name: value }));
    setErrors((prev) => ({ ...prev, name: validateName(value) }));
  }, [validateName]);

  const handlePhoneChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, phone: value }));
    setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
  }, [validatePhone]);

  const handleBioChange = useCallback((value: string) => {
    if (value.length > MAX_BIO_LENGTH) return;
    setState((prev) => ({ ...prev, bio: value }));
    setErrors((prev) => ({ ...prev, bio: validateBio(value) }));
  }, [validateBio]);

  const handleAvatarChange = useCallback((file: File | null) => {
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setErrors((prev) => ({ ...prev, avatar: validationError }));
      return;
    }

    setErrors((prev) => ({ ...prev, avatar: undefined }));
    setState((prev) => ({ ...prev, avatarFile: file }));
    avatarChanged.current = true;

    const reader = new FileReader();
    reader.onload = (e) => {
      setState((prev) => ({ ...prev, avatarPreview: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }, [validateAvatarFile]);

  const handleSelectProgram = useCallback((programId: string) => {
    const program = availablePrograms.find((p) => p.id === programId);
    if (!program) return;

    if (state.selectedSubjectIds.length > 0) {
      setProgramChangeConfirm({
        show: true,
        newProgramId: programId,
        newProgramName: program.name,
      });
    } else {
      setState((prev) => ({
        ...prev,
        selectedProgramId: programId,
        selectedSubjectIds: [],
      }));
    }
  }, [availablePrograms, state.selectedSubjectIds.length]);

  const confirmProgramChange = useCallback(() => {
    const { newProgramId } = programChangeConfirm;
    setState((prev) => ({
      ...prev,
      selectedProgramId: newProgramId,
      selectedSubjectIds: [],
    }));
    setProgramChangeConfirm({ show: false, newProgramId: "", newProgramName: "" });
  }, [programChangeConfirm]);

  const cancelProgramChange = useCallback(() => {
    setProgramChangeConfirm({ show: false, newProgramId: "", newProgramName: "" });
  }, []);

  const handleToggleSubject = useCallback((subjectId: string) => {
    setState((prev) => {
      const exists = prev.selectedSubjectIds.includes(subjectId);
      return {
        ...prev,
        selectedSubjectIds: exists
          ? prev.selectedSubjectIds.filter((id) => id !== subjectId)
          : [...prev.selectedSubjectIds, subjectId],
      };
    });
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return availableSubjects;
    const query = subjectSearch.toLowerCase();
    return availableSubjects.filter((s) => s.name.toLowerCase().includes(query));
  }, [availableSubjects, subjectSearch]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!isFormValid) return false;
    setSaving(true);
    setError(null);

    try {
      await profilesService.updateProfile({
        full_name: state.name.trim(),
        bio: state.bio.trim() || undefined,
        phone_number: state.phone.trim() || undefined,
        semester: state.semester ? Number(state.semester) : undefined,
      });

      if (avatarChanged.current && state.avatarFile && user?.id) {
        try {
          const file = state.avatarFile;
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          await profilesService.uploadAvatar(user.id, base64);
        } catch (avatarErr) {
          console.warn("Avatar upload failed, but profile was saved:", avatarErr);
        }
      }

      if (state.selectedProgramId && state.selectedProgramId !== initialProgramId.current) {
        await profilesService.setPrimaryProgram(state.selectedProgramId);
      }

      const currentIds = new Set(state.selectedSubjectIds);
      const initialIds = new Set(initialSubjectIds.current);

      const toRemove = initialSubjectIds.current.filter((id) => !currentIds.has(id));
      const toAdd = state.selectedSubjectIds.filter((id) => !initialIds.has(id));

      await Promise.all([
        ...toRemove.map((id) => profilesService.removeMySubject(id)),
        ...toAdd.map((id) => profilesService.addMySubject(id)),
      ]);

      return true;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        window.location.href = "/login";
        return false;
      }
      setError(err?.response?.data?.message || err?.message || "Error al guardar los cambios");
      return false;
    } finally {
      setSaving(false);
    }
  }, [isFormValid, state, user?.id]);

  const resetForm = useCallback(() => {
    setState({
      name: user?.name || "",
      phone: "",
      bio: "",
      avatarFile: null,
      avatarPreview: "",
      selectedProgramId: initialProgramId.current,
      selectedSubjectIds: [...initialSubjectIds.current],
    });
    setErrors({});
    setError(null);
    avatarChanged.current = false;
  }, [user?.name]);

  return {
    state,
    errors,
    error,
    loading,
    saving,
    isFormValid,
    availablePrograms,
    availableSubjects: filteredSubjects,
    subjectSearch,
    setSubjectSearch,
    programChangeConfirm,
    bioRemaining: MAX_BIO_LENGTH - state.bio.length,
    handleSemesterChange,
    handleNameChange,
    handlePhoneChange,
    handleBioChange,
    handleAvatarChange,
    handleSelectProgram,
    confirmProgramChange,
    cancelProgramChange,
    handleToggleSubject,
    handleSave,
    resetForm,
  };
}
