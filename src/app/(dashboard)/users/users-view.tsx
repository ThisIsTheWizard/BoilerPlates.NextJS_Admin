"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, MoreVertical, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import {
  ASSIGN_ROLE_MUTATION,
  GET_ROLES_QUERY,
  REVOKE_ROLE_MUTATION,
  type RolesQueryResult,
} from "@/services/roles";
import {
  GET_USERS_QUERY,
  USERS_DEFAULT_OPTIONS,
  UPDATE_USER_MUTATION,
  DEACTIVATE_USER_MUTATION,
  type DeactivateUserResult,
  type UpdateUserResult,
  type UsersQueryResult,
} from "@/services/users";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  invited: "bg-blue-50 text-blue-700 border-blue-100",
  unverified: "bg-amber-50 text-amber-700 border-amber-100",
};

type BannerState = {
  type: "success" | "error";
  message: string;
} | null;

type UsersRow = UsersQueryResult["getUsers"]["data"][number];
type RoleRow = RolesQueryResult["getRoles"]["data"][number];

type ModalState =
  | { type: "update-user"; user: UsersRow }
  | { type: "update-roles"; user: UsersRow }
  | { type: "deactivate-user"; user: UsersRow };

export function UsersView() {
  const [banner, setBanner] = useState<BannerState>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const { data, loading, error, refetch } = useQuery<UsersQueryResult>(
    GET_USERS_QUERY,
    {
      variables: { options: USERS_DEFAULT_OPTIONS },
      fetchPolicy: "cache-and-network",
    }
  );

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery<RolesQueryResult>(GET_ROLES_QUERY, {
    variables: { options: { limit: 50, offset: 0 } },
    fetchPolicy: "cache-and-network",
  });

  const users = data?.getUsers?.data ?? [];
  const meta = data?.getUsers?.meta_data;

  const allRoles = useMemo(() => rolesData?.getRoles?.data ?? [], [rolesData]);

  const bannerTone =
    banner?.type === "success"
      ? "border-emerald-200 bg-emerald-50/80 text-emerald-700"
      : "border-red-200 bg-red-100/80 text-red-700";
  const closeModal = () => setModalState(null);
  const selectedUser = modalState?.user ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-600">
            Invite, suspend, or update user roles across the workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
              void setBanner(null);
            }}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="md" className="sm:w-auto">
            Invite user
          </Button>
        </div>
      </header>

      {banner ? (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm",
            bannerTone
          )}
        >
          <p>{banner.message}</p>
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-wide"
            onClick={() => setBanner(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {rolesError ? (
        <Card className="border-red-200 bg-red-100/70 text-sm text-red-700">
          {rolesError.message}
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            <span className="font-semibold text-slate-900">
              {meta?.filtered_rows ?? 0}
            </span>{" "}
            {meta?.filtered_rows === 1 ? "user" : "users"} shown
          </div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            {loading ? "Syncing directory..." : "Directory synced"}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/40 backdrop-blur">
          {loading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users from GraphQL API...
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">
              {error.message || "Unable to load users."}
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No users found. Connect the admin backend or invite your first
              teammate.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-white/40 text-sm">
              <thead className="bg-white/40 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 backdrop-blur">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3 text-right">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 bg-white/60 backdrop-blur">
                {users.map((user) => (
                  <tr key={user.id} className="align-top hover:bg-white/90">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {formatName(user)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{user.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                          STATUS_STYLES[user.status] ??
                            "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <RolePillList roles={user.roles ?? []} />
                    </td>
                    <td className="px-4 py-4 text-right text-slate-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <UserActionsMenu
                        onUpdate={() =>
                          setModalState({ type: "update-user", user })
                        }
                        onUpdateRoles={() =>
                          setModalState({ type: "update-roles", user })
                        }
                        onDeactivate={() =>
                          setModalState({ type: "deactivate-user", user })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {modalState?.type === "update-user" && selectedUser ? (
        <UpdateUserModal
          open
          user={selectedUser}
          onClose={closeModal}
          onSuccess={(message) => setBanner({ type: "success", message })}
          onError={(message) => setBanner({ type: "error", message })}
          refetchUsers={refetch}
        />
      ) : null}

      {modalState?.type === "update-roles" && selectedUser ? (
        <UpdateRolesModal
          open
          user={selectedUser}
          allRoles={allRoles}
          loadingRoles={rolesLoading}
          refetchUsers={refetch}
          onClose={closeModal}
          onSuccess={(message) => setBanner({ type: "success", message })}
          onError={(message) => setBanner({ type: "error", message })}
        />
      ) : null}

      {modalState?.type === "deactivate-user" && selectedUser ? (
        <DeactivateUserModal
          open
          user={selectedUser}
          onClose={closeModal}
          refetchUsers={refetch}
          onSuccess={(message) => setBanner({ type: "success", message })}
          onError={(message) => setBanner({ type: "error", message })}
        />
      ) : null}
    </div>
  );
}

type UserActionsMenuProps = {
  onUpdate: () => void;
  onUpdateRoles: () => void;
  onDeactivate: () => void;
};

function UserActionsMenu({
  onUpdate,
  onUpdateRoles,
  onDeactivate,
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleAction = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <div className="relative inline-flex justify-end" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Open actions</span>
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-44 rounded-2xl border border-white/40 bg-white/95 p-1.5 text-left shadow-xl backdrop-blur"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80"
            onClick={() => handleAction(onUpdate)}
          >
            Update user
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80"
            onClick={() => handleAction(onUpdateRoles)}
          >
            Update roles
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            onClick={() => handleAction(onDeactivate)}
          >
            Deactivate user
          </button>
        </div>
      ) : null}
    </div>
  );
}

type DialogModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
};

function DialogModal({
  open,
  title,
  onClose,
  children,
  description,
  footer,
}: DialogModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full max-w-lg rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-sm text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          <div>{children}</div>
        </div>
        {footer ? (
          <div className="mt-6 flex items-center justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

type UpdateUserModalProps = {
  open: boolean;
  user: UsersRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetchUsers: () => Promise<unknown>;
};

function UpdateUserModal({
  open,
  user,
  onClose,
  onSuccess,
  onError,
  refetchUsers,
}: UpdateUserModalProps) {
  const [form, setForm] = useState({
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
  });
  const formId = useId();

  const [updateUser, { loading }] =
    useMutation<UpdateUserResult>(UPDATE_USER_MUTATION);

  useEffect(() => {
    setForm({
      firstName: user.first_name ?? "",
      lastName: user.last_name ?? "",
      email: user.email ?? "",
    });
  }, [user]);

  const handleChange =
    (field: "firstName" | "lastName" | "email") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await updateUser({
        variables: {
          input: {
            id: user.id,
            email: form.email.trim(),
            first_name: form.firstName.trim() || null,
            last_name: form.lastName.trim() || null,
          },
        },
      });
      await refetchUsers();
      const nextName = [form.firstName.trim(), form.lastName.trim()]
        .filter(Boolean)
        .join(" ");
      const label = nextName.length > 0 ? nextName : form.email.trim();
      onSuccess(`Updated ${label}.`);
      onClose();
    } catch (error) {
      console.error("[updateUser]", error);
      onError(
        error instanceof Error
          ? error.message
          : "Unable to update the selected user."
      );
    }
  };

  const disableSave = loading || form.email.trim().length === 0;

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={`Update ${formatName(user)}`}
      description="Edit account details and keep profile information accurate."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={disableSave}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor={`${formId}-first-name`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            First name
          </label>
          <input
            id={`${formId}-first-name`}
            type="text"
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={form.firstName}
            onChange={handleChange("firstName")}
            placeholder="Jane"
          />
        </div>
        <div>
          <label
            htmlFor={`${formId}-last-name`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Last name
          </label>
          <input
            id={`${formId}-last-name`}
            type="text"
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={form.lastName}
            onChange={handleChange("lastName")}
            placeholder="Doe"
          />
        </div>
        <div>
          <label
            htmlFor={`${formId}-email`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Email
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="jane@example.com"
          />
        </div>
      </form>
    </DialogModal>
  );
}

type UpdateRolesModalProps = {
  open: boolean;
  user: UsersRow;
  allRoles: RoleRow[];
  loadingRoles: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetchUsers: () => Promise<unknown>;
};

function UpdateRolesModal({
  open,
  user,
  allRoles,
  loadingRoles,
  onClose,
  onSuccess,
  onError,
  refetchUsers,
}: UpdateRolesModalProps) {
  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={`Update roles for ${formatName(user)}`}
      description="Assign or revoke roles to control which parts of the admin this member can access."
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      <RolesEditor
        key={user.id}
        userId={user.id}
        userName={formatName(user)}
        currentRoles={user.roles ?? []}
        allRoles={allRoles}
        disabled={loadingRoles}
        onSuccess={onSuccess}
        onError={onError}
        refetchUsers={refetchUsers}
      />
    </DialogModal>
  );
}

type DeactivateUserModalProps = {
  open: boolean;
  user: UsersRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetchUsers: () => Promise<unknown>;
};

function DeactivateUserModal({
  open,
  user,
  onClose,
  onSuccess,
  onError,
  refetchUsers,
}: DeactivateUserModalProps) {
  const [deactivateUser, { loading }] = useMutation<DeactivateUserResult>(
    DEACTIVATE_USER_MUTATION
  );

  const handleDeactivate = async () => {
    try {
      await deactivateUser({ variables: { id: user.id } });
      await refetchUsers();
      onSuccess(`Deactivated ${formatName(user)}.`);
      onClose();
    } catch (error) {
      console.error("[deactivateUser]", error);
      onError(
        error instanceof Error
          ? error.message
          : "Unable to deactivate the selected user."
      );
    }
  };

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={`Deactivate ${formatName(user)}`}
      description="The user will no longer be able to sign in. You can reactivate them later from your API."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeactivate}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-500"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deactivating...
              </>
            ) : (
              "Deactivate user"
            )}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        Are you sure you want to deactivate this account? This action will
        remove their access immediately.
      </p>
    </DialogModal>
  );
}

type RolesEditorProps = {
  userId: string;
  userName: string;
  currentRoles: UsersRow["roles"];
  allRoles: RoleRow[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetchUsers: () => Promise<unknown>;
  disabled?: boolean;
};

function RolesEditor({
  userId,
  userName,
  currentRoles,
  allRoles,
  onSuccess,
  onError,
  refetchUsers,
  disabled,
}: RolesEditorProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");

  const [assignRole, { loading: assigning }] =
    useMutation(ASSIGN_ROLE_MUTATION);
  const [revokeRole, { loading: removing }] = useMutation(REVOKE_ROLE_MUTATION);

  const busy = assigning || removing;

  const availableRoles = useMemo(
    () =>
      allRoles.filter(
        (role) =>
          !(currentRoles ?? []).some((assigned) => assigned.id === role.id)
      ),
    [allRoles, currentRoles]
  );

  const handleAssign = async () => {
    if (!selectedRole) return;
    const targetRole = allRoles.find((role) => role.id === selectedRole);

    try {
      await assignRole({
        variables: { input: { role_id: selectedRole, user_id: userId } },
      });
      await refetchUsers();
      onSuccess(`Assigned ${targetRole?.name ?? "role"} to ${userName}.`);
      setSelectedRole("");
    } catch (error) {
      console.error("[assignRole]", error);
      onError(
        error instanceof Error
          ? error.message
          : "Unable to assign the selected role."
      );
    }
  };

  const handleRemove = async (role_id: string, roleName: string) => {
    try {
      await revokeRole({
        variables: { input: { role_id, user_id: userId } },
      });
      await refetchUsers();
      onSuccess(`Removed ${roleName} from ${userName}.`);
    } catch (error) {
      console.error("[revokeRole]", error);
      onError(
        error instanceof Error
          ? error.message
          : "Unable to remove the selected role."
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {currentRoles?.length ? (
          currentRoles.map((role) => (
            <span
              key={role.id}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold capitalize text-slate-700 shadow-sm"
            >
              {role.name}
              <button
                type="button"
                aria-label={`Remove ${role.name}`}
                className="rounded-full bg-slate-900/10 p-1 text-slate-500 transition hover:bg-slate-900/20 hover:text-slate-900 disabled:opacity-40"
                onClick={() => handleRemove(role.id, role.name)}
                disabled={busy || disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500">
            No roles assigned. Select a role below to get started.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <select
            className="w-full appearance-none rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            disabled={busy || disabled || availableRoles.length === 0}
          >
            <option value="">
              {availableRoles.length === 0
                ? "All roles assigned"
                : "Select role to assign"}
            </option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAssign}
          disabled={!selectedRole || busy || disabled}
        >
          {assigning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : (
            "Assign role"
          )}
        </Button>
      </div>
    </div>
  );
}

function RolePillList({ roles }: { roles: UsersRow["roles"] }) {
  if (!roles?.length) {
    return <span className="text-xs text-slate-500">No roles</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={role.id}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold capitalize text-slate-700 shadow-sm"
        >
          {role.name}
        </span>
      ))}
    </div>
  );
}

function formatName(user: UsersRow) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name.length > 0 ? name : user.email;
}
