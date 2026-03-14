/**
 * hooks/useAdmin.ts
 *
 * Hook de datos para el panel de administración.
 * Extrae toda la lógica CRUD de faculties / programs / subjects
 * que antes vivía inline en app/(admin)/index.tsx (731 líneas).
 *
 * La pantalla solo orquesta: recibe estos valores y llama estas funciones.
 */

import {
  createFaculty,
  createProgram,
  createSubject,
  deleteFaculty as sbDeleteFaculty,
  deleteProgram as sbDeleteProgram,
  deleteSubject as sbDeleteSubject,
  getFaculties,
  getPrograms,
  getSubjects,
  updateFaculty,
  updateProgram,
  updateSubject,
} from "@/lib/services/facultyService"
import type { Faculty, Program, Subject } from "@/types"
import { useEffect, useMemo, useState } from "react"
import { Alert } from "react-native"

type SubjectWithPrograms = Subject & { programs?: Program[] }

// ── Tipos de estado para los modales ──────────────────────────────────────────

export interface FacultyModalState {
  visible: boolean
  mode: "create" | "edit"
  item: Faculty | null
  form: { name: string }
  error: string
}

export interface ProgramModalState {
  visible: boolean
  mode: "create" | "edit"
  item: Program | null
  form: { name: string; faculty_id: string }
  error: string
}

export interface SubjectModalState {
  visible: boolean
  mode: "create" | "edit"
  item: Subject | null
  form: { name: string; program_ids: string[] }
  error: string
}

export interface UseAdminResult {
  isLoading: boolean
  isSubmitting: boolean
  faculties: Faculty[]
  programs: Program[]
  subjects: Subject[]
  filteredFaculties: Faculty[]
  filteredPrograms: Program[]
  filteredSubjects: Subject[]
  programsCountForFaculty: (fid: string) => number
  subjectsCountForProgram: (pid: string) => number
  programsForSubject: (sid: string) => Program[]
  facultyModal: FacultyModalState
  programModal: ProgramModalState
  subjectModal: SubjectModalState
  setFacultyModal: React.Dispatch<React.SetStateAction<FacultyModalState>>
  setProgramModal: React.Dispatch<React.SetStateAction<ProgramModalState>>
  setSubjectModal: React.Dispatch<React.SetStateAction<SubjectModalState>>
  openCreateFaculty: () => void
  openEditFaculty: (item: Faculty) => void
  closeFacultyModal: () => void
  openCreateProgram: () => void
  openEditProgram: (item: Program) => void
  closeProgramModal: () => void
  openCreateSubject: () => void
  openEditSubject: (item: Subject) => void
  closeSubjectModal: () => void
  saveFaculty: () => Promise<void>
  deleteFaculty: (item: Faculty) => void
  saveProgram: () => Promise<void>
  deleteProgram: (item: Program) => void
  saveSubject: () => Promise<void>
  deleteSubject: (item: Subject) => void
}

const FACULTY_MODAL_INIT: FacultyModalState = {
  visible: false, mode: "create", item: null, form: { name: "" }, error: "",
}
const PROGRAM_MODAL_INIT: ProgramModalState = {
  visible: false, mode: "create", item: null, form: { name: "", faculty_id: "" }, error: "",
}
const SUBJECT_MODAL_INIT: SubjectModalState = {
  visible: false, mode: "create", item: null, form: { name: "", program_ids: [] }, error: "",
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return "Ocurrió un error inesperado."
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Administra estado, validaciones y acciones CRUD del panel de administración.
 *
 * @param search Texto de búsqueda aplicado sobre facultades, programas y materias.
 * @returns API completa de datos, modales y acciones para la vista admin.
 */
export function useAdmin(search: string): UseAdminResult {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  const [facultyModal, setFacultyModal] = useState<FacultyModalState>(FACULTY_MODAL_INIT)
  const [programModal, setProgramModal] = useState<ProgramModalState>(PROGRAM_MODAL_INIT)
  const [subjectModal, setSubjectModal] = useState<SubjectModalState>(SUBJECT_MODAL_INIT)

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [facs, progs, subs] = await Promise.all([
          getFaculties(),
          getPrograms(),
          getSubjects(),
        ])
        setFaculties(facs)
        setPrograms(progs)
        setSubjects(subs)
      } catch (error: unknown) {
        Alert.alert("Error", "No se pudieron cargar los datos: " + getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // ── Filtrados ──────────────────────────────────────────────────────────────
  const filteredFaculties = useMemo(() => {
    const q = search.toLowerCase()
    return faculties.filter((f) => f.name.toLowerCase().includes(q))
  }, [faculties, search])

  const filteredPrograms = useMemo(() => {
    const q = search.toLowerCase()
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.faculty_name ?? "").toLowerCase().includes(q)
    )
  }, [programs, search])

  const filteredSubjects = useMemo(() => {
    const q = search.toLowerCase()
    return subjects.filter((s) => s.name.toLowerCase().includes(q))
  }, [subjects, search])

  // ── Helpers de conteo ─────────────────────────────────────────────────────
  const programsCountForFaculty = (fid: string) =>
    programs.filter((p) => p.faculty_id === fid).length

  const subjectsCountForProgram = (pid: string) =>
    subjects.filter((s) => s.programs?.some((p) => p.id === pid)).length

  const programsForSubject = (sid: string): Program[] => {
    const subject = subjects.find((s): s is SubjectWithPrograms => s.id === sid)
    return subject?.programs ?? []
  }

  // ── Acciones de modal ─────────────────────────────────────────────────────
  const openCreateFaculty = () => setFacultyModal({ ...FACULTY_MODAL_INIT, visible: true })
  const openEditFaculty = (item: Faculty) =>
    setFacultyModal({ visible: true, mode: "edit", item, form: { name: item.name }, error: "" })
  const closeFacultyModal = () => setFacultyModal((p) => ({ ...p, visible: false }))

  const openCreateProgram = () => setProgramModal({ ...PROGRAM_MODAL_INIT, visible: true })
  const openEditProgram = (item: Program) =>
    setProgramModal({
      visible: true, mode: "edit", item,
      form: { name: item.name, faculty_id: item.faculty_id }, error: "",
    })
  const closeProgramModal = () => setProgramModal((p) => ({ ...p, visible: false }))

  const openCreateSubject = () => setSubjectModal({ ...SUBJECT_MODAL_INIT, visible: true })
  const openEditSubject = (item: Subject) =>
    setSubjectModal({
      visible: true, mode: "edit", item,
      form: {
        name: item.name,
        program_ids: (item.programs ?? []).map((p) => p.id),
      },
      error: "",
    })
  const closeSubjectModal = () => setSubjectModal((p) => ({ ...p, visible: false }))

  // ── CRUD Facultades ────────────────────────────────────────────────────────
  const saveFaculty = async () => {
    const name = facultyModal.form.name.trim()
    if (!name)
      return setFacultyModal((p) => ({ ...p, error: "El nombre no puede estar vacío." }))
    if (
      faculties.find(
        (f) =>
          f.name.toLowerCase() === name.toLowerCase() &&
          f.id !== facultyModal.item?.id
      )
    )
      return setFacultyModal((p) => ({
        ...p, error: "Ya existe una facultad con ese nombre.",
      }))

    setIsSubmitting(true)
    try {
      if (facultyModal.mode === "create") {
        const nueva = await createFaculty(name)
        setFaculties((p) => [...p, nueva])
      } else {
        const actualizada = await updateFaculty(facultyModal.item!.id, { name })
        setFaculties((p) =>
          p.map((f) => (f.id === actualizada.id ? actualizada : f))
        )
        setPrograms((p) =>
          p.map((pr) =>
            pr.faculty_id === facultyModal.item!.id
              ? { ...pr, faculty_name: name }
              : pr
          )
        )
      }
      closeFacultyModal()
    } catch (error: unknown) {
      setFacultyModal((p) => ({ ...p, error: getErrorMessage(error) }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteFaculty = (item: Faculty) => {
    const count = programsCountForFaculty(item.id)
    Alert.alert(
      "Eliminar facultad",
      count > 0
        ? `"${item.name}" tiene ${count} programa(s) vinculado(s). Al eliminarla también se eliminarán sus programas.`
        : `¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            try {
              await sbDeleteFaculty(item.id)
              const progIds = programs.filter((p) => p.faculty_id === item.id).map((p) => p.id)
              setFaculties((p) => p.filter((f) => f.id !== item.id))
              setPrograms((p) => p.filter((p) => p.faculty_id !== item.id))
              setSubjects((p) =>
                p.map((s) => ({
                  ...s,
                  programs: s.programs?.filter((pr) => !progIds.includes(pr.id)),
                }))
              )
            } catch (error: unknown) {
              Alert.alert("Error", getErrorMessage(error))
            }
          },
        },
      ]
    )
  }

  // ── CRUD Programas ─────────────────────────────────────────────────────────
  const saveProgram = async () => {
    const name = programModal.form.name.trim()
    const faculty_id = programModal.form.faculty_id
    if (!name)
      return setProgramModal((p) => ({ ...p, error: "El nombre no puede estar vacío." }))
    if (!faculty_id)
      return setProgramModal((p) => ({ ...p, error: "Selecciona una facultad." }))
    if (
      programs.find(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() &&
          p.faculty_id === faculty_id &&
          p.id !== programModal.item?.id
      )
    )
      return setProgramModal((p) => ({
        ...p, error: "Ya existe ese programa en esa facultad.",
      }))

    setIsSubmitting(true)
    try {
      const faculty_name = faculties.find((f) => f.id === faculty_id)?.name ?? ""
      if (programModal.mode === "create") {
        const nuevo = await createProgram(name, faculty_id)
        setPrograms((p) => [...p, { ...nuevo, faculty_name }])
      } else {
        const actualizado = await updateProgram(programModal.item!.id, { name, faculty_id })
        setPrograms((p) =>
          p.map((pr) =>
            pr.id === actualizado.id ? { ...actualizado, faculty_name } : pr
          )
        )
      }
      closeProgramModal()
    } catch (error: unknown) {
      setProgramModal((p) => ({ ...p, error: getErrorMessage(error) }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteProgram = (item: Program) => {
    const count = subjectsCountForProgram(item.id)
    Alert.alert(
      "Eliminar programa",
      count > 0
        ? `"${item.name}" tiene ${count} materia(s) vinculada(s). Se eliminarán los vínculos.`
        : `¿Eliminar "${item.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            try {
              await sbDeleteProgram(item.id)
              setPrograms((p) => p.filter((p) => p.id !== item.id))
              setSubjects((p) =>
                p.map((s) => ({
                  ...s,
                  programs: s.programs?.filter((pr) => pr.id !== item.id),
                }))
              )
            } catch (error: unknown) {
              Alert.alert("Error", getErrorMessage(error))
            }
          },
        },
      ]
    )
  }

  // ── CRUD Materias ──────────────────────────────────────────────────────────
  const saveSubject = async () => {
    const name = subjectModal.form.name.trim()
    const program_ids = subjectModal.form.program_ids
    if (!name)
      return setSubjectModal((p) => ({ ...p, error: "El nombre no puede estar vacío." }))
    if (program_ids.length === 0)
      return setSubjectModal((p) => ({ ...p, error: "Vincula al menos un programa." }))
    if (
      subjects.find(
        (s) =>
          s.name.toLowerCase() === name.toLowerCase() &&
          s.id !== subjectModal.item?.id
      )
    )
      return setSubjectModal((p) => ({
        ...p, error: "Ya existe una materia con ese nombre.",
      }))

    setIsSubmitting(true)
    try {
      const linkedPrograms = programs.filter((p) => program_ids.includes(p.id))
      if (subjectModal.mode === "create") {
        const nueva = await createSubject(name, program_ids)
        setSubjects((p) => [...p, { ...nueva, programs: linkedPrograms }])
      } else {
        const actualizada = await updateSubject(subjectModal.item!.id, { name }, program_ids)
        setSubjects((p) =>
          p.map((s) =>
            s.id === actualizada.id ? { ...actualizada, programs: linkedPrograms } : s
          )
        )
      }
      closeSubjectModal()
    } catch (error: unknown) {
      setSubjectModal((p) => ({ ...p, error: getErrorMessage(error) }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteSubject = (item: Subject) => {
    Alert.alert(
      "Eliminar materia",
      `¿Eliminar "${item.name}"?\n\nLas solicitudes de estudio vinculadas también se verán afectadas.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            try {
              await sbDeleteSubject(item.id)
              setSubjects((p) => p.filter((s) => s.id !== item.id))
            } catch (error: unknown) {
              Alert.alert("Error", getErrorMessage(error))
            }
          },
        },
      ]
    )
  }

  return {
    // Estado
    isLoading,
    isSubmitting,
    faculties,
    programs,
    subjects,
    // Filtrados
    filteredFaculties,
    filteredPrograms,
    filteredSubjects,
    // Helpers
    programsCountForFaculty,
    subjectsCountForProgram,
    programsForSubject,
    // Modales
    facultyModal,
    programModal,
    subjectModal,
    setFacultyModal,
    setProgramModal,
    setSubjectModal,
    openCreateFaculty,
    openEditFaculty,
    closeFacultyModal,
    openCreateProgram,
    openEditProgram,
    closeProgramModal,
    openCreateSubject,
    openEditSubject,
    closeSubjectModal,
    // Acciones CRUD
    saveFaculty,
    deleteFaculty,
    saveProgram,
    deleteProgram,
    saveSubject,
    deleteSubject,
  }
}
