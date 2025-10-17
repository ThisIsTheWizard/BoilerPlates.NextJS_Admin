"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, MoreVertical, RefreshCw } from "lucide-react";

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
  CREATE_USER_MUTATION,
  SET_USER_PASSWORD_MUTATION,
  type CreateUserResult,
  type SetUserPasswordResult,
  type UpdateUserResult,
  type UsersQueryResult,
} from "@/services/users";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  invited: "bg-blue-50 text-blue-700 border-blue-100",
  unverified: "bg-amber-50 text-amber-700 border-amber-100",
};

const USER_STATUS_OPTIONS = ["active", "inactive"] as const;

type BannerState = {
  type: "success" | "error";
  message: string;
} | null;

type UsersRow = UsersQueryResult["getUsers"]["data"][number];
type RoleRow = RolesQueryResult["getRoles"]["data"][number];

type ModalState =
  | { type: "invite-user" }
  | { type: "update-user"; user: UsersRow }
  | { type: "update-roles"; user: UsersRow }
  | { type: "update-status"; user: UsersRow }
  | { type: "update-password"; user: UsersRow };

export function UsersView() {
  const [banner, setBanner] = useState<BannerState>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const { data, loading, error, refetch } = useQuery<UsersQueryResult>(
    GET_USERS_QUERY,
    {
      variables: { options: USERS_DEFAULT_OPTIONS },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
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
  const selectedUser =
    modalState && "user" in modalState ? modalState.user : null;

  return (
    <div className="flex min-h-[calc(100vh-7rem-2rem)] flex-col gap-6 sm:min-h-[calc(100vh-7rem-3rem)] lg:min-h-[calc(100vh-7rem-4rem)]">
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
            size="md"
            onClick={() => {
              void refetch();
              void setBanner(null);
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button onClick={() => setModalState({ type: "invite-user" })}>
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

      <Card className="flex min-h-0 flex-1 flex-col gap-4">
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

        <div className="relative flex-1 rounded-2xl border border-white/50 bg-white/40 backdrop-blur min-h-0">
          {loading ? (
            <div className="flex h-full items-center gap-2 p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users from GraphQL API...
            </div>
          ) : error ? (
            <div className="flex h-full items-center p-6 text-sm text-red-600">
              {error.message || "Unable to load users."}
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-full items-center p-6 text-sm text-slate-500">
              No users found. Connect the admin backend or invite your first
              teammate.
            </div>
          ) : (
            <div className="min-h-0 overflow-x-auto overflow-y-visible">
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
                  {users.map((user, index) => (
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
                      <td className="relative overflow-visible px-4 py-4 text-right">
                        <UserActionsMenu
                          preferredPlacement={
                            index >= Math.max(0, users.length - 2) ? "up" : "down"
                          }
                          onUpdate={() =>
                            setModalState({ type: "update-user", user })
                          }
                          onUpdateRoles={() =>
                            setModalState({ type: "update-roles", user })
                          }
                          onChangeStatus={() =>
                            setModalState({ type: "update-status", user })
                          }
                          onChangePassword={() =>
                            setModalState({ type: "update-password", user })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {modalState?.type === "invite-user" ? (
        <InviteUserModal
          open
          onClose={closeModal}
          refetchUsers={refetch}
          onSuccess={(message) => setBanner({ type: "success", message })}
          onError={(message) => setBanner({ type: "error", message })}
        />
      ) : null}

      {modalState?.type === "update-status" && selectedUser ? (
        <UpdateStatusModal
          open
          user={selectedUser}
          onClose={closeModal}
          onSuccess={(message) => setBanner({ type: "success", message })}
          onError={(message) => setBanner({ type: "error", message })}
          refetchUsers={refetch}
        />
      ) : null}

      {modalState?.type === "update-password" && selectedUser ? (
        <UpdatePasswordModal
          open
          user={selectedUser}
          onClose={closeModal}
          onSuccess={(message) => setBanner({ type: "success", message })}
          onError={(message) => setBanner({ type: "error", message })}
        />
      ) : null}

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
    </div>
  );
}

type UserActionsMenuProps = {
  onUpdate: () => void;
  onUpdateRoles: () => void;
  onChangeStatus: () => void;
  onChangePassword: () => void;
  preferredPlacement?: "up" | "down";
};

function UserActionsMenu({
  onUpdate,
  onUpdateRoles,
  onChangeStatus,
  onChangePassword,
  preferredPlacement = "down",
}: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"down" | "up">(preferredPlacement);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    setPlacement(preferredPlacement);
    if (!open) {
      setMenuCoords(null);
    }
  }, [preferredPlacement, open]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const container = containerRef.current;
      const menu = menuRef.current;

      if (container?.contains(target) || menu?.contains(target)) {
        return;
      }

      setOpen(false);
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
  }, [open, preferredPlacement]);

  useLayoutEffect(() => {
    if (!open) {
      setPlacement(preferredPlacement);
      setMenuCoords(null);
      return;
    }

    const evaluatePlacement = () => {
      if (!containerRef.current || !menuRef.current) return;

      const triggerRect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const padding = 12;

      let nextPlacement: "down" | "up" = preferredPlacement;

      if (spaceBelow < menuRect.height && spaceAbove >= menuRect.height) {
        nextPlacement = "up";
      } else if (spaceBelow >= menuRect.height) {
        nextPlacement = "down";
      } else if (spaceAbove > spaceBelow) {
        nextPlacement = "up";
      } else {
        nextPlacement = "down";
      }

      const top =
        nextPlacement === "up"
          ? Math.max(padding, triggerRect.top - menuRect.height - padding)
          : Math.min(
              window.innerHeight - menuRect.height - padding,
              triggerRect.bottom + padding,
            );
      const right = Math.max(
        padding,
        window.innerWidth - triggerRect.right - padding,
      );

      setPlacement(nextPlacement);
      setMenuCoords({ top, right });
    };

    evaluatePlacement();
    const raf = window.requestAnimationFrame(evaluatePlacement);

    window.addEventListener("resize", evaluatePlacement);
    window.addEventListener("scroll", evaluatePlacement, true);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", evaluatePlacement);
      window.removeEventListener("scroll", evaluatePlacement, true);
    };
  }, [open, preferredPlacement]);

  const handleAction = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <div
      className="relative inline-flex justify-end overflow-visible"
      ref={containerRef}
    >
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
      {open
        ? createPortal(
            <div
              id={menuId}
              role="menu"
              ref={menuRef}
              data-placement={placement}
              className="z-50 w-44 rounded-2xl border border-white/40 bg-white/95 p-1.5 text-left shadow-xl backdrop-blur"
              style={{
                position: "fixed",
                top: menuCoords?.top ?? 0,
                right: menuCoords?.right ?? 0,
                visibility: menuCoords ? "visible" : "hidden",
              }}
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
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80"
                onClick={() => handleAction(onChangeStatus)}
              >
                Update status
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80"
                onClick={() => handleAction(onChangePassword)}
              >
                Update password
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

type DialogModalProps = {
  open: boolean;
  title: ReactNode;
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

type InviteUserModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetchUsers: () => Promise<unknown>;
};

function InviteUserModal({
  open,
  onClose,
  onSuccess,
  onError,
  refetchUsers,
}: InviteUserModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formId = useId();

  const [createUser, { loading }] =
    useMutation<CreateUserResult>(CREATE_USER_MUTATION);

  useEffect(() => {
    if (!open) {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
      });
      setErrorMessage(null);
    }
  }, [open]);

  const handleChange =
    (field: "firstName" | "lastName" | "email") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    try {
      await createUser({
        variables: {
          input: {
            email,
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      await refetchUsers();

      const displayName =
        [firstName, lastName].filter(Boolean).join(" ") || email;
      onSuccess(`Invitation sent to ${displayName}.`);
      onClose();
    } catch (error) {
      console.error("[createUser]", error);
      const message =
        error instanceof Error
          ? error.message.replace("GraphQL error: ", "")
          : "Unable to invite the user.";
      setErrorMessage(message);
      onError(message);
    }
  };

  const disableInvite =
    loading ||
    form.firstName.trim().length === 0 ||
    form.lastName.trim().length === 0 ||
    form.email.trim().length === 0;

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title="Invite a new user"
      description="Send an invitation to add a teammate to the workspace."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={disableInvite}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending invite...
              </>
            ) : (
              "Send invite"
            )}
          </Button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
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
            required
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={form.firstName}
            onChange={handleChange("firstName")}
            placeholder="Morgan"
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
            required
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={form.lastName}
            onChange={handleChange("lastName")}
            placeholder="Lee"
          />
        </div>
        <div>
          <label
            htmlFor={`${formId}-email`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Work email
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={form.email}
            onChange={handleChange("email")}
            placeholder="morgan@example.com"
          />
        </div>
      </form>
    </DialogModal>
  );
}

type UpdateStatusModalProps = {
  open: boolean;
  user: UsersRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetchUsers: () => Promise<unknown>;
};

function UpdateStatusModal({
  open,
  user,
  onClose,
  onSuccess,
  onError,
  refetchUsers,
}: UpdateStatusModalProps) {
  const getDefaultStatus = (candidate: string | undefined | null) =>
    USER_STATUS_OPTIONS.includes((candidate ?? "") as (typeof USER_STATUS_OPTIONS)[number])
      ? (candidate as (typeof USER_STATUS_OPTIONS)[number])
      : "inactive";

  const [selectedStatus, setSelectedStatus] = useState<string>(
    getDefaultStatus(user.status)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formId = useId();

  const [updateUser, { loading }] =
    useMutation<UpdateUserResult>(UPDATE_USER_MUTATION);

  useEffect(() => {
    if (!open) return;
    setSelectedStatus(getDefaultStatus(user.status));
    setErrorMessage(null);
  }, [open, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    try {
      await updateUser({
        variables: {
          input: {
            entity_id: user.id,
            data: {
              status: selectedStatus,
            },
          },
        },
      });

      await refetchUsers();
      const statusLabel =
        selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1);
      onSuccess(`${formatName(user)} is now ${statusLabel}.`);
      onClose();
    } catch (error) {
      console.error("[updateUserStatus]", error);
      const message =
        error instanceof Error
          ? error.message.replace("GraphQL error: ", "")
          : "Unable to update the user status.";
      setErrorMessage(message);
      onError(message);
    }
  };

  const disableSave = loading || selectedStatus === user.status;

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={
        <>
          Update status for{" "}
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-0.5 text-sm font-semibold text-slate-900">
            {formatName(user)}
          </span>
        </>
      }
      description="Switch between active and inactive to control access immediately."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={disableSave}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update status"
            )}
          </Button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <div>
          <label
            htmlFor={`${formId}-status`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Select status
          </label>
          <select
            id={`${formId}-status`}
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
          >
            {USER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500">
          Status changes take effect immediately for the user.
        </p>
      </form>
    </DialogModal>
  );
}

type UpdatePasswordModalProps = {
  open: boolean;
  user: UsersRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

function UpdatePasswordModal({
  open,
  user,
  onClose,
  onSuccess,
  onError,
}: UpdatePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formId = useId();

  const [setPasswordMutation, { loading }] =
    useMutation<SetUserPasswordResult>(SET_USER_PASSWORD_MUTATION);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setConfirmPassword("");
    setErrorMessage(null);
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      setErrorMessage(message);
      onError(message);
      return;
    }

    try {
      const { data } = await setPasswordMutation({
        variables: { user_id: user.id, password },
      });

      if (!data?.setUserPasswordByAdmin?.success) {
        throw new Error(
          data?.setUserPasswordByAdmin?.message ??
            "Unable to update the password."
        );
      }

      onSuccess(`Password updated for ${formatName(user)}.`);
      onClose();
    } catch (error) {
      console.error("[setUserPassword]", error);
      const message =
        error instanceof Error
          ? error.message.replace("GraphQL error: ", "")
          : "Unable to update the password.";
      setErrorMessage(message);
      onError(message);
    }
  };

  const disableSave =
    loading || password.length < 8 || password !== confirmPassword;

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={
        <>
          Update password for{" "}
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-0.5 text-sm font-semibold text-slate-900">
            {formatName(user)}
          </span>
        </>
      }
      description="Set a new password for this member. They can sign in with it immediately."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={disableSave}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </>
      }
    >
      <form id={formId} className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <div>
          <label
            htmlFor={`${formId}-password`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            New password
          </label>
          <input
            id={`${formId}-password`}
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label
            htmlFor={`${formId}-confirm-password`}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Confirm password
          </label>
          <input
            id={`${formId}-confirm-password`}
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter the password"
          />
        </div>
        <p className="text-xs text-slate-500">
          Use a strong passphrase with a mix of letters, numbers, and symbols.
        </p>
      </form>
    </DialogModal>
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
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    try {
      const { data } = await updateUser({
        variables: {
          input: {
            entity_id: user.id,
            data: {
              email,
              first_name: firstName.length > 0 ? firstName : undefined,
              last_name: lastName.length > 0 ? lastName : undefined,
            },
          },
        },
      });
      await refetchUsers();

      const updatedUser = data?.updateUser;
      const nextName = [firstName, lastName].filter(Boolean).join(" ");
      const label =
        nextName.length > 0
          ? nextName
          : updatedUser?.email ?? email ?? formatName(user);
      onSuccess(`Updated ${label}.`);
      onClose();
    } catch (error) {
      console.error("[updateUser]", error);
      const message =
        error instanceof Error
          ? error.message.replace("GraphQL error: ", "")
          : "Unable to update the selected user.";
      onError(message);
    }
  };

  const trimmedFirstName = form.firstName.trim();
  const trimmedLastName = form.lastName.trim();
  const trimmedEmail = form.email.trim();
  const unchanged =
    trimmedFirstName === (user.first_name ?? "") &&
    trimmedLastName === (user.last_name ?? "") &&
    trimmedEmail === (user.email ?? "");

  const disableSave = loading || trimmedEmail.length === 0 || unchanged;

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={
        <>
          Update{" "}
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-0.5 text-sm font-semibold text-slate-900">
            {formatName(user)}
          </span>
        </>
      }
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
  const formId = useId();
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    () => new Set()
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentRoleIds = useMemo(
    () => (user.roles ?? []).map((role) => role.id),
    [user.roles]
  );
  const currentRoleKey = useMemo(
    () => currentRoleIds.slice().sort().join("|"),
    [currentRoleIds]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedRoleIds(new Set(currentRoleIds));
    setErrorMessage(null);
  }, [open, currentRoleKey, currentRoleIds]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const [assignRole, { loading: assigning }] =
    useMutation(ASSIGN_ROLE_MUTATION);
  const [revokeRole, { loading: removing }] = useMutation(REVOKE_ROLE_MUTATION);

  const busy = assigning || removing;

  const selectionMatchesCurrent =
    selectedRoleIds.size === currentRoleIds.length &&
    currentRoleIds.every((id) => selectedRoleIds.has(id));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (selectionMatchesCurrent) {
      onClose();
      return;
    }

    const rolesToAdd = Array.from(selectedRoleIds).filter(
      (roleId) => !currentRoleIds.includes(roleId)
    );
    const rolesToRemove = currentRoleIds.filter(
      (roleId) => !selectedRoleIds.has(roleId)
    );

    try {
      await Promise.all([
        ...rolesToAdd.map((roleId) =>
          assignRole({
            variables: { input: { role_id: roleId, user_id: user.id } },
          })
        ),
        ...rolesToRemove.map((roleId) =>
          revokeRole({
            variables: { input: { role_id: roleId, user_id: user.id } },
          })
        ),
      ]);

      await refetchUsers();
      onSuccess(`Updated roles for ${formatName(user)}.`);
      onClose();
    } catch (error) {
      console.error("[updateRoles]", error);
      const message =
        error instanceof Error
          ? error.message.replace("GraphQL error: ", "")
          : "Unable to update roles for this user.";
      setErrorMessage(message);
      onError(message);
    }
  };

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title={
        <>
          Update roles for{" "}
          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2.5 py-0.5 text-sm font-semibold text-slate-900">
            {formatName(user)}
          </span>
        </>
      }
      description="Select the roles this member should have. Changes take effect immediately."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={busy || loadingRoles}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={busy || loadingRoles || selectionMatchesCurrent}
          >
            {busy ? (
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
        {errorMessage ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <fieldset
          className="grid gap-3"
          disabled={busy || loadingRoles}
          aria-describedby={loadingRoles ? `${formId}-status` : undefined}
        >
          {allRoles.length === 0 ? (
            <p className="text-sm text-slate-500">
              No roles available. Create roles first in the Roles section.
            </p>
          ) : (
            allRoles.map((role) => {
              const checked = selectedRoleIds.has(role.id);
              return (
                <label
                  key={role.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-slate-900/40"
                    checked={checked}
                    onChange={() => toggleRole(role.id)}
                  />
                  <span className="capitalize">{role.name}</span>
                </label>
              );
            })
          )}
        </fieldset>
        {loadingRoles ? (
          <p id={`${formId}-status`} className="text-xs text-slate-500">
            Loading roles...
          </p>
        ) : null}
      </form>
    </DialogModal>
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
