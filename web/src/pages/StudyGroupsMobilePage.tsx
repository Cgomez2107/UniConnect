import React from "react";

const groups = [
  {
    id: "g1",
    name: "Grupo Álgebra Lineal",
    admin: "Sofía Espinosa",
    sede: "Sede Norte",
    subject: "Álgebra",
    members: 5,
    status: "Miembro Aceptado",
  },
  {
    id: "g2",
    name: "Programación II - Nocturno",
    admin: "Luis Gómez",
    sede: "Sede Centro",
    subject: "Programación",
    members: 3,
    status: "En Proceso",
  },
];

const pendingApplications = [
  {
    id: "p1",
    name: "Santiago Pérez",
    sede: "Sede Sur",
    date: "2026-05-18",
    status: "Pendiente",
  },
  {
    id: "p2",
    name: "Valentina Mora",
    sede: "Sede Norte",
    date: "2026-05-19",
    status: "Pendiente",
  },
];

const exploreGroups = [
  {
    id: "e1",
    name: "Sistemas Distribuidos",
    carrera: "Ingeniería de Sistemas",
    admin: "Luis Gómez",
    sede: "Sede Centro",
    subject: "Sistemas",
    members: 4,
    status: "En Proceso",
  },
  {
    id: "e2",
    name: "Álgebra II Intensivo",
    carrera: "Matemáticas",
    admin: "Mariana Cruz",
    sede: "Sede Norte",
    subject: "Álgebra",
    members: 6,
    status: "En Proceso",
  },
  {
    id: "e3",
    name: "Club de Programación",
    carrera: "Ingeniería de Software",
    admin: "Diego Prieto",
    sede: "Sede Sur",
    subject: "Programación",
    members: 8,
    status: "En Proceso",
  },
];

const transferCandidates = [
  { id: "m1", name: "Andrea Giraldo", role: "Miembro" },
  { id: "m2", name: "Juan Camilo Ríos", role: "Miembro" },
  { id: "m3", name: "Paula Díaz", role: "Miembro" },
];

export function StudyGroupsMobilePage() {
  return (
    <div className="study-groups-ui min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="sg-ambient pointer-events-none" aria-hidden="true" />

      <header className="sticky top-0 z-20 backdrop-blur-md bg-slate-950/80 border-b border-white/5">
        <div className="max-w-md mx-auto px-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-teal-200/70">Study Groups</p>
              <h1 className="sg-title text-2xl font-semibold text-white">Study Groups</h1>
            </div>
            <button className="sg-circle-btn" type="button" aria-label="Menú de usuario">
              <span className="text-sm font-semibold">SG</span>
            </button>
          </div>

          <div className="mt-4">
            <label className="sr-only" htmlFor="search-groups">Buscar</label>
            <div className="relative">
              <input
                id="search-groups"
                type="text"
                placeholder="Buscar por Carrera / Sede / Nombre"
                className="sg-input w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-teal-200">Ctrl + K</span>
            </div>
          </div>

          <div className="mt-4 sg-card">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Perfil</p>
            <div className="mt-3 space-y-2">
              <button className="sg-menu-item" type="button">Ajustes</button>
              <button className="sg-menu-item" type="button">Ayuda</button>
              <button className="sg-menu-item text-rose-200" type="button">Cerrar sesión</button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-16 space-y-8">
        <section className="pt-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="sg-title text-lg font-semibold">Creación de grupo</h2>
            <div className="flex gap-2">
              <span className="sg-chip sg-chip-success">Miembro Aceptado</span>
              <span className="sg-chip sg-chip-warning">En Proceso</span>
            </div>
          </div>
          <div className="sg-card mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.25em] text-teal-200">Paso 1 de 3</p>
              <span className="sg-pill">Formulario guiado</span>
            </div>

            <div>
              <label className="sg-label" htmlFor="group-name">Group Name</label>
              <input id="group-name" className="sg-input" placeholder="Ej. Álgebra Lineal Night" />
            </div>
            <div>
              <label className="sg-label" htmlFor="carrera">Carrera</label>
              <input id="carrera" className="sg-input" placeholder="Ingeniería de Sistemas" />
            </div>
            <div>
              <label className="sg-label" htmlFor="sede">Sede</label>
              <input id="sede" className="sg-input" placeholder="Sede Centro" />
            </div>

            <div>
              <label className="sg-label" htmlFor="subject">Subject</label>
              <div className="relative">
                <input id="subject" className="sg-input" placeholder="Buscar materia" />
                <div className="sg-dropdown">
                  {"Álgebra, Sistemas, Programación".split(", ").map((item) => (
                    <button key={item} type="button" className="sg-dropdown-item">
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sg-toggle">
              <div>
                <p className="text-sm font-medium">¿Está relacionado con una asignatura?</p>
                <p className="text-xs text-slate-400">Activa para asociar el grupo a una materia.</p>
              </div>
              <div className="sg-switch" aria-hidden="true">
                <span className="sg-switch-thumb" />
              </div>
            </div>

            <button className="sg-primary-btn" type="button">
              Crear estudio grupal
            </button>
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="sg-title text-lg font-semibold">Mis grupos y postulaciones</h2>
            <span className="sg-pill">2 grupos</span>
          </div>

          <div className="sg-tabs mt-4">
            <button type="button" className="sg-tab sg-tab-active">Tus grupos</button>
            <button type="button" className="sg-tab">Postulaciones pendientes</button>
          </div>

          <div className="mt-4 space-y-4">
            {groups.map((group) => (
              <article key={group.id} className="sg-card space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-white">{group.name}</h3>
                    <button className="sg-icon-btn" type="button" aria-label="Acciones">
                      <span className="text-lg">···</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Admin: {group.admin}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-300">Sede · {group.sede}</p>
                  <p className="text-slate-300">Subject · {group.subject}</p>
                  <p className="text-slate-300">Miembros · {group.members}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="sg-chip sg-chip-success">{group.status}</span>
                  <span className="sg-chip sg-chip-neutral">Transferencia de admin</span>
                </div>
                <div className="sg-action-list">
                  <button type="button" className="sg-action-btn">Ver detalles</button>
                  <button type="button" className="sg-action-btn">Chat de grupo</button>
                  <button type="button" className="sg-action-btn">Salir</button>
                  <button type="button" className="sg-action-btn sg-action-highlight">Transferencia de admin</button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 sg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Postulaciones pendientes</h3>
              <span className="sg-chip sg-chip-warning">2 pendientes</span>
            </div>
            <div className="space-y-3">
              {pendingApplications.map((app) => (
                <div key={app.id} className="sg-list-row">
                  <div>
                    <p className="font-medium text-white">{app.name}</p>
                    <p className="text-xs text-slate-400">{app.sede} · {app.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="sg-accept-btn">Aceptar</button>
                    <button type="button" className="sg-reject-btn">Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="sg-chip sg-chip-success w-fit">Miembro Aceptado</div>
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: "140ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="sg-title text-lg font-semibold">Estudios grupales</h2>
            <button className="sg-filter-btn" type="button">Filtrar</button>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {["Carrera", "Sede", "Disponibilidad", "Recientes"].map((filter) => (
              <button key={filter} className="sg-chip sg-chip-neutral" type="button">{filter}</button>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            {exploreGroups.map((group) => (
              <article key={group.id} className="sg-card space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{group.name}</h3>
                  <p className="text-xs text-slate-400">Carrera · {group.carrera}</p>
                </div>
                <div className="space-y-1 text-sm text-slate-300">
                  <p>Admin · {group.admin}</p>
                  <p>Sede · {group.sede}</p>
                  <p>Subject · {group.subject}</p>
                  <p>Miembros · {group.members}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="sg-chip sg-chip-warning">{group.status}</span>
                  <button className="sg-secondary-btn" type="button">Postularse</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="sg-title text-lg font-semibold">Administración y transferencias</h2>
            <span className="sg-pill">Panel dedicado</span>
          </div>

          <div className="sg-card mt-4 space-y-4">
            <p className="text-sm text-slate-300">
              Accede al panel de administración para gestionar miembros, permisos y transferencias de
              privilegios con confirmación segura.
            </p>
            <button className="sg-primary-btn" type="button">Abrir panel de administración</button>
          </div>

          <div className="sg-card mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Transferir privilegios</h3>
              <span className="sg-chip sg-chip-neutral">Confirmación requerida</span>
            </div>
            <div className="space-y-2">
              {transferCandidates.map((member) => (
                <div key={member.id} className="sg-list-row">
                  <div>
                    <p className="font-medium text-white">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.role}</p>
                  </div>
                  <button type="button" className="sg-secondary-btn">Transferir admin</button>
                </div>
              ))}
            </div>
            <div className="sg-confirm">
              <p className="text-xs text-slate-200">Confirmar transferencia a Andrea Giraldo</p>
              <div className="flex gap-2">
                <button type="button" className="sg-accept-btn">Confirmar</button>
                <button type="button" className="sg-reject-btn">Cancelar</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default StudyGroupsMobilePage;
