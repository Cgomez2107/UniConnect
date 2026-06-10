// Hook de datos para el panel de administración.
// Centraliza la lógica CRUD de todas las entidades del admin.

import { DIContainer } from "@/lib/services/di/container"
import type {
  AdminEvent,
  AdminMetrics,
  AdminRequest,
  AdminResource,
  AdminUser,
  CreateEventCategoryPayload,
  CreateEventPayload,
  EventCategoryRow,
  Faculty,
  Program,
  Subject,
  UserRole,
} from "@/types"
import { useEffect, useMemo, useState } from "react"
import { Alert } from "react-native"

// Tipos de estado para los modales

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

export interface EventModalState {
  visible: boolean
  mode: "create" | "edit"
  item: AdminEvent | null
  form: {
    title: string
    description: string
    event_date: string      // ISO string (YYYY-MM-DDTHH:mm)
    location: string
    category: string
    maxCapacity: string
  }
  error: string
}

export interface CategoryModalState {
  visible: boolean
  mode: "create" | "edit"
  item: EventCategoryRow | null
  form: { name: string; description: string }
  error: string
}

type SubjectWithPrograms = Subject & { programs?: Program[] }

const FACULTY_MODAL_INIT: FacultyModalState = {
  visible: false, mode: "create", item: null, form: { name: "" }, error: "",
}
const PROGRAM_MODAL_INIT: ProgramModalState = {
  visible: false, mode: "create", item: null, form: { name: "", faculty_id: "" }, error: "",
}
const SUBJECT_MODAL_INIT: SubjectModalState = {
  visible: false, mode: "create", item: null, form: { name: "", program_ids: [] }, error: "",
}
const EVENT_MODAL_INIT: EventModalState = {
  visible: false,
  mode: "create",
  item: null,
  form: { title: "", description: "", event_date: "", location: "", category: "", maxCapacity: "" },
  error: "",
}

const CATEGORY_MODAL_INIT: CategoryModalState = {
  visible: false, mode: "create", item: null, form: { name: "", description: "" }, error: "",
}


/**
 * Administra estado, validaciones y acciones CRUD del panel de administración.
 *
 * @param search Texto de búsqueda aplicado sobre facultades, programas y materias.
 * @returns API completa de datos, modales y acciones para la vista admin.
 */
export function useAdmin(search: string) {
  const adminGateway = useMemo(() => DIContainer.getInstance().getAdminPanelGateway(), [])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Secciones del panel administrativo.
  const [users, setUsers] = useState<AdminUser[]>([])
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [resources, setResources] = useState<AdminResource[]>([])
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])

  // Filtros para eventos
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const [facultyModal, setFacultyModal] = useState<FacultyModalState>(FACULTY_MODAL_INIT)
  const [programModal, setProgramModal] = useState<ProgramModalState>(PROGRAM_MODAL_INIT)
  const [subjectModal, setSubjectModal] = useState<SubjectModalState>(SUBJECT_MODAL_INIT)
  const [eventModal, setEventModal] = useState<EventModalState>(EVENT_MODAL_INIT)

  const [eventCategories, setEventCategories] = useState<EventCategoryRow[]>([])
  const [categoryModal, setCategoryModal] = useState<CategoryModalState>(CATEGORY_MODAL_INIT)

  const formatAdminError = (error: unknown) => {
    const raw = error instanceof Error ? error.message : String(error ?? "")
    const msg = raw.toLowerCase()

    if (msg.includes("more than one relationship") && msg.includes("study_requests") && msg.includes("profiles")) {
      return "Hay una configuración pendiente en la base de datos para relacionar solicitudes con perfiles."
    }

    if (msg.includes("permission denied") && msg.includes("events")) {
      return "No tienes permisos para gestionar eventos. Verifica que tu cuenta sea admin y que la migración de eventos esté aplicada."
    }

    if (msg.includes("permission denied")) {
      return "Tu sesión no tiene permisos para esta acción. Cierra sesión y vuelve a ingresar."
    }

    // Category-specific errors already have user-friendly messages from the repository
    if (msg.includes("no se puede eliminar la categoría") || msg.includes("ya existe una categoría")) {
      return raw
    }

    return raw || "Ocurrió un error inesperado."
  }

  // Carga inicial
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      const result = await Promise.allSettled([
        adminGateway.getFaculties(),
        adminGateway.getPrograms(),
        adminGateway.getSubjects(),
        adminGateway.getAllUsers(),
        adminGateway.getAllRequests(),
        adminGateway.getAllResources(),
        adminGateway.getAdminMetrics(),
        adminGateway.getAllEventCategories(),
      ])

      const [facs, progs, subs, usrs, reqs, ress, mets, cats] = result

      if (facs.status === "fulfilled") setFaculties(facs.value)
      if (progs.status === "fulfilled") setPrograms(progs.value as Program[])
      if (subs.status === "fulfilled") setSubjects(subs.value as Subject[])
      if (usrs.status === "fulfilled") setUsers(usrs.value)
      if (reqs.status === "fulfilled") setRequests(reqs.value)
      if (ress.status === "fulfilled") setResources(ress.value)
      if (mets.status === "fulfilled") setMetrics(mets.value)
      if (cats.status === "fulfilled") setEventCategories(cats.value)

      const failedSections = [
        facs.status === "rejected" ? "facultades" : null,
        progs.status === "rejected" ? "programas" : null,
        subs.status === "rejected" ? "materias" : null,
        usrs.status === "rejected" ? "usuarios" : null,
        reqs.status === "rejected" ? "solicitudes" : null,
        ress.status === "rejected" ? "recursos" : null,
        mets.status === "rejected" ? "métricas" : null,
      ].filter(Boolean)

      if (failedSections.length > 0) {
        const firstError = result.find((r): r is PromiseRejectedResult => r.status === "rejected")
        Alert.alert(
          "Carga parcial del panel",
          `Se cargaron algunos datos, pero faltan secciones (${failedSections.join(", ")}). ${formatAdminError(firstError?.reason)}`,
        )
      }

      setIsLoading(false)
    }
    load()
  }, [adminGateway])

  // Refetch eventos cuando cambia includeDeleted
  useEffect(() => {
    const refetch = async () => {
      try {
        const raw = await adminGateway.getAllEvents(includeDeleted)
        setEvents(raw)
      } catch { /* silencioso */ }
    }
    refetch()
  }, [adminGateway, includeDeleted])

  // Filtrados
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

  // Helpers
  const programsCountForFaculty = (fid: string) =>
    programs.filter((p) => p.faculty_id === fid).length

  const subjectsCountForProgram = (pid: string) =>
    subjects.filter((s) => s.programs?.some((p) => p.id === pid)).length

  const programsForSubject = (sid: string): Program[] => {
    const subject = subjects.find((s) => s.id === sid) as SubjectWithPrograms | undefined
    return subject?.programs ?? []
  }

  // Acciones de modal
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

  // CRUD Facultades
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
        const nueva = await adminGateway.createFaculty(name)
        setFaculties((p) => [...p, nueva])
      } else {
        const actualizada = await adminGateway.updateFaculty(facultyModal.item!.id, { name })
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
      setFacultyModal((p) => ({ ...p, error: formatAdminError(error) }))
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
              await adminGateway.deleteFaculty(item.id)
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
              Alert.alert("Error", formatAdminError(error))
            }
          },
        },
      ]
    )
  }

  // CRUD Programas
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
        const nuevo = await adminGateway.createProgram(name, faculty_id)
        setPrograms((p) => [...p, { ...nuevo, faculty_name }])
      } else {
        const actualizado = await adminGateway.updateProgram(programModal.item!.id, { name, faculty_id })
        setPrograms((p) =>
          p.map((pr) =>
            pr.id === actualizado.id ? { ...actualizado, faculty_name } : pr
          )
        )
      }
      closeProgramModal()
    } catch (error: unknown) {
      setProgramModal((p) => ({ ...p, error: formatAdminError(error) }))
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
              await adminGateway.deleteProgram(item.id)
              setPrograms((p) => p.filter((p) => p.id !== item.id))
              setSubjects((p) =>
                p.map((s) => ({
                  ...s,
                  programs: s.programs?.filter((pr) => pr.id !== item.id),
                }))
              )
            } catch (error: unknown) {
              Alert.alert("Error", formatAdminError(error))
            }
          },
        },
      ]
    )
  }

  // CRUD Materias
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
        const nueva = await adminGateway.createSubject(name, program_ids)
        setSubjects((p) => [...p, { ...nueva, programs: linkedPrograms }])
      } else {
        const actualizada = await adminGateway.updateSubject(subjectModal.item!.id, { name }, program_ids)
        setSubjects((p) =>
          p.map((s) =>
            s.id === actualizada.id ? { ...actualizada, programs: linkedPrograms } : s
          )
        )
      }
      closeSubjectModal()
    } catch (error: unknown) {
      setSubjectModal((p) => ({ ...p, error: formatAdminError(error) }))
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
              await adminGateway.deleteSubject(item.id)
              setSubjects((p) => p.filter((s) => s.id !== item.id))
            } catch (error: unknown) {
              Alert.alert("Error", formatAdminError(error))
            }
          },
        },
      ]
    )
  }

  // Filtrados
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase()
    return requests.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.author_name.toLowerCase().includes(q) ||
        r.subject_name.toLowerCase().includes(q)
    )
  }, [requests, search])

  const filteredResources = useMemo(() => {
    const q = search.toLowerCase()
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.author_name.toLowerCase().includes(q) ||
        r.subject_name.toLowerCase().includes(q)
    )
  }, [resources, search])

  const filteredEvents = useMemo(() => {
    const q = search.toLowerCase()
    return events.filter((e) => {
      if (includeDeleted) {
        if (!e.deleted_at) return false
      } else {
        if (e.deleted_at) return false
      }
      if (statusFilter !== "all" && (e.status ?? "published") !== statusFilter) return false
      if (categoryFilter !== "all" && e.category_id !== categoryFilter) return false
      return (
        e.title.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q) ||
        e.creator_name.toLowerCase().includes(q)
      )
    })
  }, [events, search, statusFilter, categoryFilter, includeDeleted])

  // Acciones Usuarios
  const handleToggleUserRole = (item: AdminUser) => {
    const newRole: UserRole = item.role === "admin" ? "estudiante" : "admin"
    Alert.alert(
      "Cambiar rol",
      `¿Cambiar "${item.full_name}" a ${newRole}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar", onPress: async () => {
            try {
              await adminGateway.updateUserRole(item.id, newRole)
              setUsers((p) => p.map((u) => u.id === item.id ? { ...u, role: newRole } : u))
            } catch (e: any) {
              Alert.alert("Error", e.message)
            }
          },
        },
      ]
    )
  }

  const handleToggleUserActive = (item: AdminUser) => {
    const action = item.is_active ? "suspender" : "activar"
    Alert.alert(
      item.is_active ? "Suspender usuario" : "Activar usuario",
      `¿Deseas ${action} a "${item.full_name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar", style: item.is_active ? "destructive" : "default",
          onPress: async () => {
            try {
              await adminGateway.toggleUserActive(item.id, !item.is_active)
              setUsers((p) => p.map((u) => u.id === item.id ? { ...u, is_active: !item.is_active } : u))
            } catch (e: any) {
              Alert.alert("Error", e.message)
            }
          },
        },
      ]
    )
  }

  // Acciones Solicitudes
  const handleCloseRequest = (item: AdminRequest) => {
    Alert.alert(
      "Cerrar solicitud",
      `¿Cerrar "${item.title}"? El autor ya no recibirá postulaciones.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar", style: "destructive", onPress: async () => {
            try {
              await adminGateway.closeRequest(item.id)
              setRequests((p) => p.map((r) => r.id === item.id ? { ...r, status: "cerrada" } : r))
            } catch (e: any) {
              Alert.alert("Error", e.message)
            }
          },
        },
      ]
    )
  }

  const handleDeleteRequest = (item: AdminRequest) => {
    Alert.alert(
      "Eliminar solicitud",
      `¿Eliminar "${item.title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            try {
              await adminGateway.deleteRequest(item.id)
              setRequests((p) => p.filter((r) => r.id !== item.id))
            } catch (e: any) {
              Alert.alert("Error", e.message)
            }
          },
        },
      ]
    )
  }

  // Acciones Recursos
  const handleDeleteResource = (item: AdminResource) => {
    Alert.alert(
      "Eliminar recurso",
      `¿Eliminar "${item.title}"? El archivo también será eliminado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            try {
              await adminGateway.deleteResource(item.id)
              setResources((p) => p.filter((r) => r.id !== item.id))
            } catch (e: any) {
              Alert.alert("Error", e.message)
            }
          },
        },
      ]
    )
  }

  // Acciones y modal de Eventos
  const openCreateEvent = () => setEventModal({ ...EVENT_MODAL_INIT, visible: true })
  const openEditEvent = (item: AdminEvent) =>
    setEventModal({
      visible: true,
      mode: "edit",
      item,
      form: {
        title: item.title,
        description: "",
        event_date: item.event_date.slice(0, 16), // "YYYY-MM-DDTHH:mm"
        location: item.location ?? "",
        category: item.category,
        maxCapacity: item.max_capacity ? String(item.max_capacity) : "",
      },
      error: "",
    })
  const closeEventModal = () => setEventModal((p) => ({ ...p, visible: false }))

  const saveEvent = async () => {
    const { title, description, event_date, location, category, maxCapacity } = eventModal.form
    if (!title.trim())
      return setEventModal((p) => ({ ...p, error: "El título no puede estar vacío." }))
    if (!event_date)
      return setEventModal((p) => ({ ...p, error: "La fecha del evento es obligatoria." }))

    const parsedCapacity = maxCapacity.trim() ? parseInt(maxCapacity.trim(), 10) : undefined
    if (maxCapacity.trim() && (isNaN(parsedCapacity!) || parsedCapacity! <= 0))
      return setEventModal((p) => ({ ...p, error: "La capacidad máxima debe ser un número mayor a 0." }))

    const payload: CreateEventPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      event_date: new Date(event_date).toISOString(),
      location: location.trim() || undefined,
      category,
      maxCapacity: parsedCapacity,
    }

    setIsSubmitting(true)
    try {
      if (eventModal.mode === "create") {
        const nuevo = await adminGateway.createEvent(payload)
        const adminEvt: AdminEvent = {
          id: nuevo.id,
          title: nuevo.title,
          event_date: nuevo.event_date,
          location: nuevo.location,
          category: nuevo.category,
          category_id: nuevo.category_id,
          created_at: nuevo.created_at,
          creator_name: nuevo.creator?.full_name ?? "Admin",
          status: nuevo.status ?? "draft",
          deleted_at: null,
          max_capacity: (nuevo as any).max_capacity ?? (nuevo as any).maxCapacity ?? parsedCapacity ?? null,
        }
        setEvents((p) => [...p, adminEvt].sort(
          (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        ))
      } else {
        const actualizado = await adminGateway.updateEvent(eventModal.item!.id, payload)
        const adminEvt: AdminEvent = {
          id: actualizado.id,
          title: actualizado.title,
          event_date: actualizado.event_date,
          location: actualizado.location,
          category: actualizado.category,
          category_id: actualizado.category_id,
          created_at: actualizado.created_at,
          creator_name: actualizado.creator?.full_name ?? "Admin",
          status: (actualizado as any).status ?? eventModal.item?.status ?? "published",
          deleted_at: (actualizado as any).deleted_at ?? eventModal.item?.deleted_at ?? null,
          max_capacity: (actualizado as any).max_capacity ?? (actualizado as any).maxCapacity ?? eventModal.item?.max_capacity ?? null,
        }
        setEvents((p) => p.map((e) => (e.id === adminEvt.id ? adminEvt : e)))
      }
      closeEventModal()
    } catch (e: any) {
      setEventModal((p) => ({ ...p, error: formatAdminError(e) }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Category CRUD ────────────────────────────────────────
  const openCreateCategory = () => setCategoryModal({ ...CATEGORY_MODAL_INIT, visible: true })
  const openEditCategory = (item: EventCategoryRow) =>
    setCategoryModal({
      visible: true, mode: "edit", item,
      form: { name: item.name, description: item.description ?? "" }, error: "",
    })
  const closeCategoryModal = () => setCategoryModal((p) => ({ ...p, visible: false }))

  const saveCategory = async () => {
    const name = categoryModal.form.name.trim()
    if (!name)
      return setCategoryModal((p) => ({ ...p, error: "El nombre no puede estar vacío." }))
    if (
      eventCategories.find(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== categoryModal.item?.id
      )
    )
      return setCategoryModal((p) => ({ ...p, error: "Ya existe una categoría con ese nombre." }))

    setIsSubmitting(true)
    try {
      const payload: CreateEventCategoryPayload = {
        name,
        description: categoryModal.form.description.trim() || undefined,
      }
      if (categoryModal.mode === "create") {
        const nueva = await adminGateway.createEventCategory(payload)
        setEventCategories((p) => [...p, nueva])
      } else {
        const actualizada = await adminGateway.updateEventCategory(categoryModal.item!.id, payload)
        setEventCategories((p) => p.map((c) => (c.id === actualizada.id ? actualizada : c)))
      }
      closeCategoryModal()
    } catch (error: unknown) {
      setCategoryModal((p) => ({ ...p, error: formatAdminError(error) }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = (item: EventCategoryRow) => {
    Alert.alert(
      "Eliminar categoría",
      `¿Eliminar "${item.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            try {
              await adminGateway.deleteEventCategory(item.id)
              setEventCategories((p) => p.filter((c) => c.id !== item.id))
            } catch (error: unknown) {
              const message = formatAdminError(error)
              Alert.alert("No se puede eliminar", message)
            }
          },
        },
      ]
    )
  }

  const handleDeleteEvent = (item: AdminEvent) => {
    Alert.alert(
      "Eliminar evento",
      `¿Eliminar "${item.title}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar", style: "destructive", onPress: async () => {
            try {
              await adminGateway.deleteEvent(item.id)
              setEvents((p) => p.filter((e) => e.id !== item.id))
            } catch (e: any) {
              Alert.alert("Error", e.message)
            }
          },
        },
      ]
    )
  }

  const handlePublishEvent = (item: AdminEvent) => {
    Alert.alert(
      "Publicar evento",
      `¿Publicar "${item.title}"?\nEl evento será visible para todos los estudiantes.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Publicar", onPress: async () => {
            try {
              await adminGateway.publishEvent(item.id)
              setEvents((p) => p.map((e) => e.id === item.id ? { ...e, status: "published" } : e))
            } catch (e: any) {
              Alert.alert("Error", e.message)
            }
          },
        },
      ]
    )
  }

  const handleCancelEvent = (item: AdminEvent) => {
    Alert.alert(
      "Cancelar evento",
      `¿Cancelar "${item.title}"?\nLos estudiantes ya no podrán acceder a este evento.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar", style: "destructive", onPress: async () => {
            try {
              await adminGateway.cancelEvent(item.id)
              setEvents((p) => p.map((e) => e.id === item.id ? { ...e, status: "cancelled" } : e))
            } catch (e: any) {
              Alert.alert("Error", e.message)
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
    // Secciones administrativas
    users,
    requests,
    resources,
    metrics,
    filteredUsers,
    filteredRequests,
    filteredResources,
    handleToggleUserRole,
    handleToggleUserActive,
    handleCloseRequest,
    handleDeleteRequest,
    handleDeleteResource,
    // Eventos
    events,
    filteredEvents,
    eventModal,
    setEventModal,
    openCreateEvent,
    openEditEvent,
    closeEventModal,
    saveEvent,
    handleDeleteEvent,
    handlePublishEvent,
    handleCancelEvent,
    // Filtros de eventos
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    includeDeleted,
    setIncludeDeleted,
    // Categorías
    eventCategories,
    categoryModal,
    setCategoryModal,
    openCreateCategory,
    openEditCategory,
    closeCategoryModal,
    saveCategory,
    handleDeleteCategory,
  }
}
