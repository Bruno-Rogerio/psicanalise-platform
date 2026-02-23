"use client";

import { useEffect, useMemo, useState } from "react";

type UserRow = {
  id: string;
  nome: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "blocked" | "pending_email" | string;
  created_at?: string | null;
};

export default function UsuariosPage() {
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
      alert(e?.message ?? "Erro ao salvar");
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
      alert(e?.message ?? "Erro ao atualizar status");
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
      alert(e?.message ?? "Erro ao excluir");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-sage-600 shadow-lg">
            <UsersIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-warm-900">Usuarios</h1>
            <p className="text-sm text-warm-600">
              {users.length} cliente(s) cadastrados
            </p>
          </div>
        </div>
        <button
          onClick={loadUsers}
          className="inline-flex items-center gap-2 rounded-xl border border-warm-300 bg-white px-4 py-2.5 text-sm font-semibold text-warm-700 transition-all hover:bg-warm-50"
        >
          Atualizar
        </button>
      </header>

      {/* Search */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, email ou telefone"
            className="h-11 w-full rounded-xl border border-warm-200 bg-warm-50 pl-10 pr-4 text-sm text-warm-900 outline-none transition-all focus:border-sage-400 focus:ring-2 focus:ring-sage-100"
          />
        </div>
      </div>

      {/* Edit Panel */}
      {editing && (
        <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-warm-900">Editar usuario</p>
            <button
              onClick={cancelEdit}
              className="text-sm text-warm-500 hover:text-warm-700"
            >
              Cancelar
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-warm-600">
                Nome
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-900 outline-none focus:border-sage-400"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-600">
                Email
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-900 outline-none focus:border-sage-400"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-600">
                Telefone
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-warm-200 bg-warm-50 px-3 py-2 text-sm text-warm-900 outline-none focus:border-sage-400"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              onClick={cancelEdit}
              className="rounded-lg border border-warm-200 bg-white px-4 py-2 text-sm font-semibold text-warm-600 hover:bg-warm-50"
            >
              Cancelar
            </button>
            <button
              onClick={saveEdit}
              disabled={busyId === editing.id}
              className="rounded-lg bg-[#4A7C59] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d6649] disabled:opacity-60"
            >
              {busyId === editing.id ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-warm-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-warm-50 p-6 text-center text-sm text-warm-600">
            Nenhum usuario encontrado
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-warm-200 bg-warm-50/60 p-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sm font-bold text-sage-700">
                  {(user.nome || "C").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-warm-900">
                    {user.nome || "Sem nome"}
                  </p>
                  <p className="truncate text-xs text-warm-500">
                    {user.email || "Sem email"}
                  </p>
                </div>
                <div className="text-xs text-warm-500">
                  {user.phone || "Sem telefone"}
                </div>
                <StatusBadge status={user.status} />
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => startEdit(user)}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-warm-700 hover:bg-warm-100"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleStatus(user)}
                    disabled={busyId === user.id}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      user.status === "blocked"
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                    }`}
                  >
                    {user.status === "blocked" ? "Ativar" : "Bloquear"}
                  </button>
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={busyId === user.id}
                    className="rounded-lg bg-warm-200 px-3 py-1.5 text-xs font-semibold text-warm-700 hover:bg-warm-300 disabled:opacity-60"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Ativo", color: "bg-emerald-100 text-emerald-700" },
    blocked: { label: "Bloqueado", color: "bg-rose-100 text-rose-700" },
    pending_email: { label: "Pendente", color: "bg-amber-100 text-amber-700" },
  };

  const cfg = map[status] || {
    label: status,
    color: "bg-warm-100 text-warm-700",
  };

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
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
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
