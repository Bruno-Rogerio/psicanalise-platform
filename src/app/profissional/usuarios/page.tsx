"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/contexts/ToastContext";

type UserRow = {
  id: string;
  nome: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "blocked" | "pending_email" | string;
  created_at?: string | null;
};

export default function UsuariosPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", phone: "" });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json().catch(() => ({}));
      setUsers((data?.users || []) as UserRow[]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter((u) => {
      return (
        (u.nome || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  function startEdit(user: UserRow) {
    setEditing(user);
    setForm({
      nome: user.nome || "",
      email: user.email || "",
      phone: user.phone || "",
    });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;

    try {
      setBusyId(editing.id);
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          phone: form.phone,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao salvar");

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editing.id
            ? { ...u, nome: form.nome, email: form.email, phone: form.phone }
            : u,
        ),
      );

      setEditing(null);
    } catch (e: any) {
      toast(e?.message ?? "Erro ao salvar", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(user: UserRow) {
    const nextStatus = user.status === "blocked" ? "active" : "blocked";

    try {
      setBusyId(user.id);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao atualizar status");

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)),
      );
    } catch (e: any) {
      toast(e?.message ?? "Erro ao atualizar status", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: UserRow) {
    const ok = window.confirm(
      `Excluir ${user.nome || "este usuario"}? Essa acao bloqueia o acesso.`,
    );
    if (!ok) return;

    try {
      setBusyId(user.id);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Erro ao excluir");

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e: any) {
      toast(e?.message ?? "Erro ao excluir", "error");
    } finally {
      setBusyId(null);
    }
  }

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const blockedCount = users.filter((u) => u.status === "blocked").length;

  return (
    <div className="min-h-screen bg-[#F2EDE8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B0A098]">
              Profissional
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#2C2420] sm:text-3xl">
              Usuários
            </h1>
            <p className="mt-1 text-sm text-[#8B7B72]">
              Gerenciar contas dos clientes
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#E8E0DC] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2420] shadow-sm transition-colors hover:bg-[#F8F4F1]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-[#E8E0DC] bg-white px-4 py-2.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#B0A098]" />
            <span className="text-sm font-semibold text-[#2C2420]">{totalCount}</span>
            <span className="text-sm text-[#8B7B72]">total</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">{activeCount}</span>
            <span className="text-sm text-emerald-600">ativos</span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-sm font-semibold text-rose-700">{blockedCount}</span>
            <span className="text-sm text-rose-600">bloqueados</span>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0A098]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, email ou telefone"
            className="w-full rounded-2xl border border-[#E8E0DC] bg-white pl-11 pr-4 py-3 text-sm text-[#2C2420] shadow-sm outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
          />
        </div>

        {/* ── User List ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-3xl bg-[#F5F0ED]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[#E8E0DC] py-16 text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-[#B0A098]" />
            <h3 className="mt-4 text-lg font-bold text-[#2C2420]">Nenhum usuário encontrado</h3>
            <p className="mt-2 text-sm text-[#8B7B72]">
              {searchQuery ? "Tente ajustar o filtro de busca" : "Ainda não há clientes cadastrados"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="rounded-3xl border border-[#E8E0DC]/80 bg-white p-5 shadow-[0_1px_16px_rgba(44,36,32,0.07)] transition-shadow hover:shadow-[0_4px_24px_rgba(44,36,32,0.10)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4A7C59]/10 text-sm font-bold text-[#4A7C59]">
                      {(user.nome || "C").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#2C2420] truncate">
                        {user.nome || "Sem nome"}
                      </p>
                      <p className="text-sm text-[#8B7B72] truncate">
                        {user.email || "Sem email"}
                      </p>
                      {user.phone && (
                        <p className="text-xs text-[#B0A098]">{user.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Status + actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge status={user.status} />
                    <button
                      onClick={() => startEdit(user)}
                      className="rounded-xl border border-[#E8E0DC] bg-white px-3 py-2 text-sm font-semibold text-[#2C2420] transition-colors hover:bg-[#F8F4F1]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleStatus(user)}
                      disabled={busyId === user.id}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        user.status === "blocked"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      {user.status === "blocked" ? "Ativar" : "Bloquear"}
                    </button>
                    <button
                      onClick={() => deleteUser(user)}
                      disabled={busyId === user.id}
                      className="rounded-xl border border-[#E8E0DC] bg-[#F5F0ED] px-3 py-2 text-sm font-semibold text-[#8B7B72] transition-colors hover:bg-[#EDE8E4] disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#E8E0DC] bg-white shadow-2xl">
            {/* Modal header */}
            <div className="border-b border-[#E8E0DC] px-6 py-5">
              <h2 className="text-lg font-bold text-[#2C2420]">Editar Usuário</h2>
              <p className="mt-0.5 text-sm text-[#8B7B72]">{editing.email}</p>
            </div>

            {/* Modal body */}
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                  Nome
                </label>
                <input
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                  Email
                </label>
                <input
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8B7B72]">
                  Telefone
                </label>
                <input
                  className="w-full rounded-2xl border border-[#E8E0DC] bg-white px-4 py-3 text-sm text-[#2C2420] outline-none transition-all placeholder:text-[#C4B8AE] focus:border-[#4A7C59] focus:ring-2 focus:ring-[#4A7C59]/10"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="border-t border-[#E8E0DC] bg-[#FAFAF8] px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelEdit}
                  className="rounded-2xl border border-[#E8E0DC] bg-white px-5 py-2.5 text-sm font-semibold text-[#2C2420] transition-colors hover:bg-[#F8F4F1]"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveEdit}
                  disabled={busyId === editing.id}
                  className="rounded-2xl bg-[#4A7C59] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3d6649] disabled:opacity-60"
                >
                  {busyId === editing.id ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: {
      label: "Ativo",
      color: "inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700",
    },
    blocked: {
      label: "Bloqueado",
      color: "inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700",
    },
    pending_email: {
      label: "Pendente",
      color: "inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700",
    },
  };

  const cfg = map[status] || {
    label: status,
    color: "inline-flex items-center rounded-full bg-[#F5F0ED] px-2.5 py-1 text-xs font-semibold text-[#8B7B72]",
  };

  return <span className={cfg.color}>{cfg.label}</span>;
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
