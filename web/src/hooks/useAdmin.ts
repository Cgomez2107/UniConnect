import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Faculty, Program, Subject, AdminUser, AdminRequest, AdminResource, AdminEvent, AdminMetrics, CreateEventPayload, CreateEventCategoryPayload, EventCategoryRow, UserRole } from "@/types";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export default function useAdmin() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [profiles, setProfiles] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategoryRow[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFaculties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("faculties")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (err) throw new Error(err.message);
      setFaculties(data as Faculty[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar facultades");
    } finally {
      setLoading(false);
    }
  }, []);

  const getPrograms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("programs")
        .select("*, faculties ( name )")
        .eq("is_active", true)
        .order("name");
      if (err) throw new Error(err.message);
      const mapped = (data ?? []).map((p: any) => ({
        ...p,
        faculty_name: p.faculties?.name ?? "",
      })) as Program[];
      setPrograms(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar programas");
    } finally {
      setLoading(false);
    }
  }, []);

  const getSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("subjects")
        .select("*, program_subjects ( programs ( id, name, faculty_id ) )")
        .eq("is_active", true)
        .order("name");
      if (err) throw new Error(err.message);
      const mapped = (data ?? []).map((s: any) => ({
        ...s,
        programs: (s.program_subjects ?? [])
          .map((ps: any) => ps.programs)
          .filter(Boolean),
        program_subjects: undefined,
      })) as Subject[];
      setSubjects(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar materias");
    } finally {
      setLoading(false);
    }
  }, []);

  const getProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_active, semester, avatar_url, created_at")
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);
      const mapped = (data ?? []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        email: "Correo no disponible",
        role: u.role ?? "estudiante",
        is_active: u.is_active ?? true,
        semester: u.semester,
        avatar_url: u.avatar_url,
        created_at: u.created_at,
      })) as AdminUser[];
      setProfiles(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("study_requests")
        .select("id, title, status, created_at, author_id, subjects ( name ), applications ( id )")
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);

      const rows: any[] = data ?? [];
      const authorIds = rows.map((r) => r.author_id).filter(Boolean);
      let authorsById: Record<string, string> = {};

      if (authorIds.length > 0) {
        const { data: authors } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", authorIds);
        for (const a of authors ?? []) {
          authorsById[a.id] = a.full_name ?? "Desconocido";
        }
      }

      const mapped = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        created_at: r.created_at,
        author_name: authorsById[r.author_id] ?? "Desconocido",
        subject_name: r.subjects?.name ?? "—",
        applications_count: Array.isArray(r.applications) ? r.applications.length : 0,
      })) as AdminRequest[];
      setRequests(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, []);

  const getResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("study_resources")
        .select("id, title, file_type, file_size_kb, created_at, profiles ( full_name ), subjects ( name )")
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);
      const mapped = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        file_type: r.file_type,
        file_size_kb: r.file_size_kb,
        created_at: r.created_at,
        author_name: r.profiles?.full_name ?? "Desconocido",
        subject_name: r.subjects?.name ?? "—",
      })) as AdminResource[];
      setResources(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar recursos");
    } finally {
      setLoading(false);
    }
  }, []);

  const getEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("events")
        .select("id, title, event_date, location, category, category_id, created_at, creator:created_by ( full_name )")
        .order("event_date", { ascending: true });
      if (err) throw new Error(err.message);
      const mapped = (data ?? []).map((e: any) => ({
        id: e.id,
        title: e.title,
        event_date: e.event_date,
        location: e.location,
        category: e.category,
        category_id: e.category_id,
        created_at: e.created_at,
        creator_name: e.creator?.full_name ?? "Admin",
      })) as AdminEvent[];
      setEvents(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, studentsRes, requestsRes, resourcesRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "estudiante").eq("is_active", true),
        supabase.from("study_requests").select("id", { count: "exact", head: true }).eq("status", "abierta"),
        supabase.from("study_resources").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
      ]);
      setMetrics({
        totalUsers: usersRes.count ?? 0,
        activeStudents: studentsRes.count ?? 0,
        openRequests: requestsRes.count ?? 0,
        totalResources: resourcesRes.count ?? 0,
        totalMessages: messagesRes.count ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  // Mutations - Faculties
  const createFaculty = useCallback(async (name: string): Promise<Faculty> => {
    setSubmitting(true);
    try {
      const { data, error: err } = await supabase
        .from("faculties")
        .insert({ name: name.trim(), code: null })
        .select()
        .single();
      if (err) throw new Error(err.message);
      setFaculties((prev) => [...prev, data as Faculty].sort((a, b) => a.name.localeCompare(b.name)));
      return data as Faculty;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateFaculty = useCallback(async (id: string, updates: { name?: string }): Promise<Faculty> => {
    setSubmitting(true);
    try {
      const { data, error: err } = await supabase
        .from("faculties")
        .update({ name: updates.name?.trim() })
        .eq("id", id)
        .select()
        .single();
      if (err) throw new Error(err.message);
      const updated = data as Faculty;
      setFaculties((prev) => prev.map((f) => (f.id === id ? updated : f)));
      return updated;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteFaculty = useCallback(async (id: string): Promise<void> => {
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("faculties").delete().eq("id", id);
      if (err) throw new Error(err.message);
      setFaculties((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Mutations - Programs
  const createProgram = useCallback(async (name: string, facultyId: string): Promise<Program> => {
    setSubmitting(true);
    try {
      const { data, error: err } = await supabase
        .from("programs")
        .insert({ name: name.trim(), faculty_id: facultyId, code: null })
        .select("*, faculties ( name )")
        .single();
      if (err) throw new Error(err.message);
      const mapped = { ...data, faculty_name: data.faculties?.name ?? "" } as Program;
      setPrograms((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
      return mapped;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateProgram = useCallback(async (id: string, updates: { name?: string; faculty_id?: string }): Promise<Program> => {
    setSubmitting(true);
    try {
      const { data, error: err } = await supabase
        .from("programs")
        .update({ name: updates.name?.trim(), faculty_id: updates.faculty_id })
        .eq("id", id)
        .select("*, faculties ( name )")
        .single();
      if (err) throw new Error(err.message);
      const mapped = { ...data, faculty_name: data.faculties?.name ?? "" } as Program;
      setPrograms((prev) => prev.map((p) => (p.id === id ? mapped : p)));
      return mapped;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteProgram = useCallback(async (id: string): Promise<void> => {
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("programs").delete().eq("id", id);
      if (err) throw new Error(err.message);
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Mutations - Subjects
  const createSubject = useCallback(async (name: string, programIds: string[]): Promise<Subject> => {
    setSubmitting(true);
    try {
      const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .insert({ name: name.trim(), code: null })
        .select()
        .single();
      if (subjectError) throw new Error(subjectError.message);

      if (programIds.length > 0) {
        const links = programIds.map((pid) => ({ program_id: pid, subject_id: subject.id }));
        const { error: linkError } = await supabase.from("program_subjects").insert(links);
        if (linkError) throw linkError;
      }

      const linkedPrograms = programs.filter((p) => programIds.includes(p.id));
      const mapped = { ...subject, programs: linkedPrograms } as Subject;
      setSubjects((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)));
      return mapped;
    } finally {
      setSubmitting(false);
    }
  }, [programs]);

  const updateSubject = useCallback(async (id: string, name: string, programIds?: string[]): Promise<Subject> => {
    setSubmitting(true);
    try {
      const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .update({ name: name.trim() })
        .eq("id", id)
        .select()
        .single();
      if (subjectError) throw new Error(subjectError.message);

      if (programIds !== undefined) {
        const { error: deleteError } = await supabase.from("program_subjects").delete().eq("subject_id", id);
        if (deleteError) throw deleteError;

        if (programIds.length > 0) {
          const links = programIds.map((pid) => ({ program_id: pid, subject_id: id }));
          const { error: linkError } = await supabase.from("program_subjects").insert(links);
          if (linkError) throw linkError;
        }
      }

      const linkedPrograms = programIds !== undefined
        ? programs.filter((p) => programIds.includes(p.id))
        : undefined;
      const mapped = { ...subject, programs: linkedPrograms } as Subject;
      setSubjects((prev) => prev.map((s) => (s.id === id ? mapped : s)));
      return mapped;
    } finally {
      setSubmitting(false);
    }
  }, [programs]);

  const deleteSubject = useCallback(async (id: string): Promise<void> => {
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("subjects").delete().eq("id", id);
      if (err) throw new Error(err.message);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Mutations - Users
  const updateUserRole = useCallback(async (userId: string, role: UserRole): Promise<void> => {
    const { error: err } = await supabase.from("profiles").update({ role }).eq("id", userId);
    if (err) throw new Error(err.message);
    setProfiles((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }, []);

  const toggleUserActive = useCallback(async (userId: string, isActive: boolean): Promise<void> => {
    const { error: err } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
    if (err) throw new Error(err.message);
    setProfiles((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u)));
  }, []);

  // Mutations - Requests
  const closeRequest = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from("study_requests").update({ status: "cerrada" }).eq("id", id);
    if (err) throw new Error(err.message);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "cerrada" as const } : r)));
  }, []);

  const deleteRequest = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from("study_requests").delete().eq("id", id);
    if (err) throw new Error(err.message);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Mutations - Resources
  const deleteResource = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from("study_resources").delete().eq("id", id);
    if (err) throw new Error(err.message);
    setResources((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Mutations - Event Categories
  const getEventCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("event_categories")
        .select("*")
        .order("name");
      if (err) throw new Error(err.message);
      setEventCategories(data as EventCategoryRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar categorías");
    } finally {
      setLoading(false);
    }
  }, []);

  const createEventCategory = useCallback(async (payload: CreateEventCategoryPayload): Promise<EventCategoryRow> => {
    setSubmitting(true);
    try {
      const slug = generateSlug(payload.name);
      const { data: existing } = await supabase
        .from("event_categories")
        .select("id")
        .or(`slug.eq.${slug},name.ilike.${payload.name}`)
        .maybeSingle();
      if (existing) {
        throw new Error("Ya existe una categoría con ese nombre o slug");
      }
      const { data, error: err } = await supabase
        .from("event_categories")
        .insert({
          name: payload.name.trim(),
          slug,
          ...(payload.description?.trim() ? { description: payload.description.trim() } : {}),
        })
        .select()
        .single();
      if (err) {
        if (err.code === "23505") {
          throw new Error("Ya existe una categoría con ese nombre o slug");
        }
        throw new Error(err.message);
      }
      const row = data as EventCategoryRow;
      setEventCategories((prev) => [...prev, row].sort((a, b) => a.name.localeCompare(b.name)));
      return row;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateEventCategory = useCallback(async (id: string, updates: { name?: string; description?: string }): Promise<EventCategoryRow> => {
    setSubmitting(true);
    try {
      const newSlug = updates.name ? generateSlug(updates.name) : undefined;
      if (newSlug) {
        const { data: existing } = await supabase
          .from("event_categories")
          .select("id")
          .or(`slug.eq.${newSlug},name.ilike.${updates.name}`)
          .neq("id", id)
          .maybeSingle();
        if (existing) {
          throw new Error("Ya existe otra categoría con ese nombre o slug");
        }
      }
      const { data, error: err } = await supabase
        .from("event_categories")
        .update({
          ...(updates.name ? { name: updates.name.trim() } : {}),
          ...(newSlug ? { slug: newSlug } : {}),
          ...((updates as any).description !== undefined
            ? { description: (updates as any).description?.trim() ?? null }
            : {}),
        })
        .eq("id", id)
        .select()
        .single();
      if (err) {
        if (err.code === "23505") {
          throw new Error("Ya existe otra categoría con ese nombre o slug");
        }
        throw new Error(err.message);
      }
      const row = data as EventCategoryRow;
      // Si el slug cambió, actualizar el campo category (string) en eventos existentes
      // para que la UI de estudiante (que agrupa por event.category) no pierda la referencia
      if (newSlug) {
        await supabase
          .from("events")
          .update({ category: newSlug })
          .eq("category_id", id);
      }
      setEventCategories((prev) => prev.map((c) => (c.id === id ? row : c)));
      return row;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteEventCategory = useCallback(async (id: string): Promise<void> => {
    setSubmitting(true);
    try {
      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("category_id", id);
      if (count && count > 0) {
        throw new Error(`No se puede eliminar la categoría porque tiene ${count} evento(s) activo(s) asociado(s). Reasigna o elimina los eventos primero.`);
      }
      const { error: err } = await supabase.from("event_categories").delete().eq("id", id);
      if (err) throw new Error(err.message);
      setEventCategories((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setSubmitting(false);
    }
  }, []);

  // Mutations - Events
  const createEvent = useCallback(async (payload: CreateEventPayload): Promise<AdminEvent> => {
    setSubmitting(true);
    try {
      // Resolver slug de la categoría para mantener sincronizado category (string)
      const { data: cat } = await supabase
        .from("event_categories")
        .select("slug")
        .eq("id", payload.category_id)
        .single();
      const slug = (cat as any)?.slug ?? null;

      const { data, error: err } = await supabase
        .from("events")
        .insert({
          title: payload.title,
          description: payload.description,
          event_date: payload.event_date,
          location: payload.location,
          category_id: payload.category_id,
          category: slug,
          image_url: payload.image_url,
        })
        .select("*, creator:created_by ( full_name )")
        .single();
      if (err) throw new Error(err.message);
      const mapped = {
        id: data.id,
        title: data.title,
        event_date: data.event_date,
        location: data.location,
        category: data.category,
        category_id: data.category_id,
        created_at: data.created_at,
        creator_name: data.creator?.full_name ?? "Admin",
      } as AdminEvent;
      setEvents((prev) => [...prev, mapped].sort(
        (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      ));
      return mapped;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateEvent = useCallback(async (id: string, payload: Partial<CreateEventPayload>): Promise<AdminEvent> => {
    setSubmitting(true);
    try {
      const updates: Record<string, any> = {};
      if (payload.title !== undefined) updates.title = payload.title;
      if (payload.description !== undefined) updates.description = payload.description;
      if (payload.event_date !== undefined) updates.event_date = payload.event_date;
      if (payload.location !== undefined) updates.location = payload.location;
      if (payload.category_id !== undefined) {
        updates.category_id = payload.category_id;
        // Sincronizar category (string) con el slug
        const { data: cat } = await supabase
          .from("event_categories")
          .select("slug")
          .eq("id", payload.category_id)
          .single();
        updates.category = (cat as any)?.slug ?? null;
      }
      if (payload.image_url !== undefined) updates.image_url = payload.image_url;

      const { data, error: err } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select("*, creator:created_by ( full_name )")
        .single();
      if (err) throw new Error(err.message);
      const mapped = {
        id: data.id,
        title: data.title,
        event_date: data.event_date,
        location: data.location,
        category: data.category,
        category_id: data.category_id,
        created_at: data.created_at,
        creator_name: data.creator?.full_name ?? "Admin",
      } as AdminEvent;
      setEvents((prev) => prev.map((e) => (e.id === id ? mapped : e)));
      return mapped;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    setSubmitting(true);
    try {
      const { error: err } = await supabase.from("events").delete().eq("id", id);
      if (err) throw new Error(err.message);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    faculties,
    programs,
    subjects,
    profiles,
    requests,
    resources,
    events,
    eventCategories,
    metrics,
    loading,
    submitting,
    error,
    getFaculties,
    getPrograms,
    getSubjects,
    getProfiles,
    getRequests,
    getResources,
    getEvents,
    getEventCategories,
    getMetrics,
    createFaculty,
    updateFaculty,
    deleteFaculty,
    createProgram,
    updateProgram,
    deleteProgram,
    createSubject,
    updateSubject,
    deleteSubject,
    updateUserRole,
    toggleUserActive,
    closeRequest,
    deleteRequest,
    deleteResource,
    createEventCategory,
    updateEventCategory,
    deleteEventCategory,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
