/**
 * components/dashboard/AdminDashboardLayout.tsx
 * 
 * Panel de administración de grupos de estudio con diseño profesional.
 * Uso de Gris Antracita #121212, tipografía grande y layout responsive 60/40.
 */

import React, { useEffect, useMemo, useState } from "react";

import { AdminTransferNotification } from "@/components/dashboard/AdminTransferNotification";
import { GroupChatPanel } from "@/components/dashboard/GroupChatPanel";
import { useStudyGroupDashboard } from "@/hooks/useStudyGroupDashboard";
import { useAuthStore } from "@/store/useAuthStore";
import type { StudyGroupMember } from "@/types/adminDashboard";

const ROLE_LABELS: Record<StudyGroupMember["role"], string> = {
  autor: "Creador",
  admin: "Admin",
  miembro: "Miembro",
};

interface AdminDashboardLayoutProps {
  requestId?: string;
}

export function AdminDashboardLayout({ requestId }: AdminDashboardLayoutProps) {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const {
    activeRequest,
    pendingCards,
    members,
    messages,
    stats,
    loading,
    error,
    reviewingApplicationId,
    sendingMessage,
    transferingAdmin,
    toast,
    dismissToast,
    handleReviewApplication,
    handleSendMessage,
    requestAdminTransfer,
  } = useStudyGroupDashboard({ requestId });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismissToast(), 4200);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  const groupTitle = activeRequest?.title ?? "Grupo de estudio";
  const groupSubtitle = activeRequest?.subject_name ?? "";
  const groupDescription =
    activeRequest?.description ?? "Grupo de estudio colaborativo";
  const facultyName = activeRequest?.faculty_name ?? "";

  const [transferMode, setTransferMode] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const currentUserRole = useMemo(() => {
    if (!userId) return null;
    return members.find((member) => member.userId === userId)?.role ?? null;
  }, [members, userId]);

  const canTransferAdmin = currentUserRole === "autor" || currentUserRole === "admin";

  const candidateMembers = useMemo(
    () => members.filter((member) => member.userId !== userId),
    [members, userId]
  );

  const canLeaveAdmin = canTransferAdmin && candidateMembers.length > 0;

  return (
    <div className="dark min-h-screen bg-[#121212] text-white font-body-main antialiased">
      {/* ============================================================================ */}
      {/* HERO SECTION: Cabecera Informativa */}
      {/* ============================================================================ */}
      <section className="bg-[#121212] border-b border-[#2D2D2D] px-10 py-12 sticky top-20 z-30">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-start justify-between gap-8 mb-6">
            <div className="flex-1">
              {/* Subject Badge */}
              {groupSubtitle && (
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-blue-600/20 border border-blue-500/40 rounded-full">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
                    {groupSubtitle} {facultyName && `• ${facultyName}`}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
                {groupTitle}
              </h1>

              {/* Description */}
              <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
                {groupDescription}
              </p>
            </div>

            {/* Action Button: Abandonar Grupo */}
            {canTransferAdmin && (
              <div className="flex-shrink-0">
                <div className="relative group">
                  <button
                    className={`px-6 py-3 text-sm font-semibold rounded-xl border transition-all ${
                      canLeaveAdmin
                        ? "border-red-500/50 text-red-300 hover:bg-red-500/10 hover:border-red-500"
                        : "border-neutral-700 text-neutral-500 opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (!canLeaveAdmin) return;
                      setTransferMode((prev) => !prev);
                      setSelectedCandidateId(null);
                    }}
                    disabled={!canLeaveAdmin}
                    title={
                      !canLeaveAdmin
                        ? "Necesitas al menos un miembro para transferir"
                        : undefined
                    }
                  >
                    {transferMode ? "Cancelar salida" : "Abandonar Grupo"}
                  </button>
                  {!canLeaveAdmin && (
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-300 z-50 whitespace-normal">
                      Necesitas al menos un miembro para transferir la administración
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/50 border border-neutral-800">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-widest">
                {stats.pending} PENDIENTES
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/50 border border-neutral-800">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-widest">
                {stats.accepted} ACEPTADAS
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/50 border border-neutral-800">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-xs font-semibold text-neutral-300 uppercase tracking-widest">
                {stats.rejected} RECHAZADAS
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast ? (
        <div className="fixed right-10 top-40 z-50 w-96 rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-100 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold">{toast.title}</p>
              <p className="text-xs text-red-200/80 mt-1">{toast.message}</p>
            </div>
            <button
              className="text-xs text-red-200/80 hover:text-red-100"
              onClick={dismissToast}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}

      {/* ============================================================================ */}
      {/* MAIN CONTENT: Two-Column Layout (60/40) */}
      {/* ============================================================================ */}
      <main className="px-10 py-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-12 gap-8 h-[calc(100vh-300px)]">
          {/* LEFT COLUMN: Solicitudes + Integrantes (60%) */}
          <div className="col-span-12 lg:col-span-7 space-y-8 overflow-y-auto custom-scrollbar pr-4">
            {/* ===== SOLICITUDES SECTION ===== */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Solicitudes de Ingreso
                </h2>
                <span className="px-3 py-1 bg-neutral-900 text-neutral-400 rounded-full text-xs font-bold uppercase tracking-widest">
                  {stats.pending} PENDIENTES
                </span>
              </div>

              {pendingCards.length === 0 && !loading ? (
                <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl p-8 text-center text-neutral-500">
                  No hay solicitudes pendientes
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pendingCards.map((request) => (
                    <div
                      key={request.id}
                      className="bg-[#1E1E1E] border border-[#2D2D2D] p-8 rounded-xl hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        {/* Profile Image */}
                        {request.avatarUrl ? (
                          <img
                            alt={request.name}
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-neutral-700"
                            src={request.avatarUrl}
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-lg">
                            {request.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </div>
                        )}

                        {/* Name & Info */}
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {request.name}
                          </h3>
                          <p className="text-sm text-neutral-400 mt-1">
                            {request.timeLabel}
                          </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 w-full pt-2">
                          {reviewingApplicationId === request.id ? (
                            <button className="flex-1 py-3 bg-blue-600/20 border border-blue-500/50 text-blue-300 font-semibold rounded-lg text-sm hover:bg-blue-600/30 transition-all flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></span>
                              Procesando...
                            </button>
                          ) : (
                            <button
                              className="flex-1 py-3 bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 font-semibold rounded-lg text-sm hover:bg-emerald-600/30 transition-all"
                              onClick={() =>
                                void handleReviewApplication(request.id, "aceptada")
                              }
                            >
                              Aceptar
                            </button>
                          )}
                          <button
                            className="flex-1 py-3 bg-red-600/10 border border-red-500/30 text-red-300 font-semibold rounded-lg text-sm hover:bg-red-600/20 transition-all"
                            onClick={() =>
                              void handleReviewApplication(request.id, "rechazada")
                            }
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ===== INTEGRANTES SECTION ===== */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-6">
                Integrantes del Grupo
              </h2>

              {transferMode && (
                <div className="mb-4 rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-xs text-blue-300">
                  Selecciona a quién le transferirás la administración antes de salir.
                </div>
              )}

              <div className="bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl overflow-hidden">
                {members.length === 0 && !loading ? (
                  <div className="p-8 text-center text-neutral-500">
                    No hay integrantes todavía
                  </div>
                ) : (
                  <div className="divide-y divide-[#2D2D2D]">
                    {members.map((member) => (
                      <div
                        key={member.userId}
                        className="p-6 flex items-center justify-between hover:bg-neutral-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {/* Avatar */}
                          {member.avatarUrl ? (
                            <img
                              alt={member.fullName ?? "Miembro"}
                              className="w-12 h-12 rounded-full object-cover"
                              src={member.avatarUrl}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 font-bold">
                              {(member.fullName ?? "?")
                                .split(" ")
                                .map((part) => part[0])
                                .join("")}
                            </div>
                          )}

                          {/* Name & Role */}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-white">
                                {member.fullName ?? "Sin nombre"}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-widest ${
                                  member.role === "autor"
                                    ? "bg-purple-600/20 text-purple-300"
                                    : member.role === "admin"
                                      ? "bg-blue-600/20 text-blue-300"
                                      : "bg-neutral-800 text-neutral-400"
                                }`}
                              >
                                {ROLE_LABELS[member.role]}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {transferMode && member.userId !== userId ? (
                            <button
                              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                                selectedCandidateId === member.userId
                                  ? "border-blue-500 text-blue-300 bg-blue-500/10"
                                  : "border-[#2D2D2D] text-neutral-400 hover:border-blue-500 hover:text-blue-300"
                              }`}
                              onClick={() => setSelectedCandidateId(member.userId)}
                            >
                              {selectedCandidateId === member.userId
                                ? "✓ Seleccionado"
                                : "Seleccionar"}
                            </button>
                          ) : (
                            <button className="p-2 text-neutral-500 hover:text-white transition-colors text-lg hover:scale-110 transition-transform">
                              💬
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer Confirmation */}
              {transferMode && (
                <div className="mt-4 flex items-center justify-between gap-4 px-6 py-4 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                  <span className="text-sm text-neutral-400">
                    {selectedCandidateId
                      ? "Candidato listo para transferencia"
                      : "Selecciona un integrante"}
                  </span>
                  <button
                    className="px-6 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedCandidateId || transferingAdmin}
                    onClick={() => {
                      if (!selectedCandidateId) return;
                      void requestAdminTransfer(selectedCandidateId);
                      setTransferMode(false);
                      setSelectedCandidateId(null);
                    }}
                  >
                    {transferingAdmin ? "Enviando..." : "Confirmar Transferencia"}
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Chat Grupal (40%) */}
          <div className="col-span-12 lg:col-span-5 h-full sticky top-32">
            <section className="h-full flex flex-col bg-[#1E1E1E] border border-[#2D2D2D] rounded-xl overflow-hidden shadow-xl">
              {/* Chat Header */}
              <div className="p-6 border-b border-[#2D2D2D] flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Chat Grupal
                  </h2>
                  <p className="text-emerald-400 text-xs font-semibold mt-1 flex items-center">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></span>
                    {members.length} MIEMBROS ACTIVOS
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <GroupChatPanel
                  groupName={activeRequest?.title ?? "Chat grupal"}
                  onlineCount={members.length}
                  messages={messages}
                  currentUserId={userId}
                  onSendMessage={handleSendMessage}
                  isSending={sendingMessage}
                />
              </div>
            </section>
          </div>
        </div>

        {/* Error Display */}
        {error ? (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/40 rounded-xl text-sm text-red-300">
            {error}
          </div>
        ) : null}
      </main>

      {/* Notificación de transferencia de administración */}
      {requestId && <AdminTransferNotification requestId={requestId} />}
    </div>
  );
}

