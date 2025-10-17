"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ASSIGN_PERMISSION_MUTATION,
  GET_PERMISSIONS_QUERY,
  REVOKE_PERMISSION_MUTATION,
  type PermissionsQueryResult,
} from "@/services/permissions";
import { GET_ROLES_QUERY, type RolesQueryResult } from "@/services/roles";

type BannerState = {
  type: "success" | "error";
  message: string;
} | null;

export default function RolesPage() {
  const [banner, setBanner] = useState<BannerState>(null);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery<RolesQueryResult>(GET_ROLES_QUERY, {
    variables: { options: { limit: 50, offset: 0 } },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: permissionsData,
    loading: permissionsLoading,
    error: permissionsError,
  } = useQuery<PermissionsQueryResult>(GET_PERMISSIONS_QUERY, {
    variables: { options: { limit: 100, offset: 0 } },
    fetchPolicy: "cache-and-network",
  });

  const roles = rolesData?.getRoles?.data ?? [];
  const permissions = permissionsData?.getPermissions?.data ?? [];
  const activeRole = useMemo(
    () => roles.find((role) => role.id === activeRoleId) ?? null,
    [roles, activeRoleId]
  );
  const closeModal = () => setActiveRoleId(null);

  const bannerTone =
    banner?.type === "success"
      ? "border-emerald-200 bg-emerald-50/80 text-emerald-700"
      : "border-red-200 bg-red-100/80 text-red-700";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow">
            <ShieldCheck className="h-5 w-5" />
          </span>
          Roles &amp; access
        </h1>
        <p className="text-sm text-slate-600">
          Grant capabilities to each team role and keep permissions aligned with
          your organization.
        </p>
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

      {permissionsError ? (
        <Card className="border-red-200 bg-red-100/70 text-sm text-red-700">
          {permissionsError.message}
        </Card>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rolesLoading ? (
          <Card className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading roles from GraphQL API...
          </Card>
        ) : roles.length === 0 ? (
          <Card className="text-sm text-slate-500">
            No roles found. Seed your backend or create roles to begin managing
            access.
          </Card>
        ) : (
          roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onManagePermissions={() => setActiveRoleId(role.id)}
              disabled={permissionsLoading}
            />
          ))
        )}
      </section>

      {activeRole ? (
        <RolePermissionsModal
          open
          role={activeRole}
          permissions={permissions}
          onClose={closeModal}
          refetchRoles={refetchRoles}
          setBanner={setBanner}
          busy={permissionsLoading}
        />
      ) : null}
    </div>
  );
}

type RoleRow = RolesQueryResult["getRoles"]["data"][number];
type PermissionRow = PermissionsQueryResult["getPermissions"]["data"][number];

type RoleCardProps = {
  role: RoleRow;
  onManagePermissions: () => void;
  disabled?: boolean;
};

function RoleCard({ role, onManagePermissions, disabled }: RoleCardProps) {
  const assignedPermissions = role.permissions ?? [];
  const preview = assignedPermissions.slice(0, 4);
  const remainingCount =
    assignedPermissions.length > preview.length
      ? assignedPermissions.length - preview.length
      : 0;

  return (
    <Card className="flex h-full flex-col justify-between space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-500">Role</p>
          <h2 className="text-lg font-semibold capitalize text-slate-900">
            {role.name}
          </h2>
        </div>
        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600">
          {formatNumber(role.users?.length ?? 0)} member
          {role.users && role.users.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Permissions
        </p>
        {assignedPermissions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-xs text-slate-500">
            No permissions assigned yet. Add one below.
          </p>
        ) : (
          <div className="space-y-2">
            <ul className="flex flex-wrap gap-2">
              {preview.map((permission) => (
                <li key={permission.id}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {formatPermission(permission)}
                  </span>
                </li>
              ))}
            </ul>
            {remainingCount > 0 ? (
              <p className="text-xs text-slate-500">
                +{remainingCount} more permission
                {remainingCount === 1 ? "" : "s"} configured
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Manage access
            </p>
            <p className="text-xs text-slate-500">
              Adjust module-level permissions for this role.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onManagePermissions}
            disabled={disabled}
          >
            Configure permissions
          </Button>
        </div>
      </div>
    </Card>
  );
}

type RolePermissionsModalProps = {
  open: boolean;
  role: RoleRow;
  permissions: PermissionRow[];
  onClose: () => void;
  refetchRoles: () => Promise<unknown>;
  setBanner: (banner: BannerState) => void;
  busy?: boolean;
};

function RolePermissionsModal({
  open,
  role,
  permissions,
  onClose,
  refetchRoles,
  setBanner,
  busy,
}: RolePermissionsModalProps) {
  const [search, setSearch] = useState("");
  const [assignPermission, { loading: assigning }] = useMutation(
    ASSIGN_PERMISSION_MUTATION
  );
  const [revokePermission, { loading: revoking }] = useMutation(
    REVOKE_PERMISSION_MUTATION
  );
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const busyState = assigning || revoking || busy;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSearch("");
  }, [role.id]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyState) {
        onClose();
      }
    };

    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, busyState]);

  const assignedPermissions = role.permissions ?? [];
  const availablePermissions = useMemo(
    () =>
      permissions.filter(
        (permission) =>
          !assignedPermissions.some((assigned) => assigned.id === permission.id)
      ),
    [assignedPermissions, permissions]
  );

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availablePermissions;
    return availablePermissions.filter((permission) =>
      formatPermission(permission).toLowerCase().includes(query)
    );
  }, [availablePermissions, search]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  if (!mounted || !open || !portalTarget) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm"
      onMouseDown={() => {
        if (busyState) return;
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-2xl rounded-3xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              Manage permissions for {role.name}
            </h2>
            <p id={descriptionId} className="text-sm text-slate-600">
              Assign or revoke module actions to keep this role aligned with
              your security model.
            </p>
          </div>

          <div className="space-y-3">
            <label
              htmlFor={`${titleId}-search`}
              className="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              Filter permissions
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id={`${titleId}-search`}
                type="search"
                placeholder="Search modules or actions..."
                value={search}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setSearch(event.target.value)
                }
                className="w-full rounded-xl border border-white/60 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-slate-900/50 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
                disabled={busyState}
              />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-2">
              {filteredPermissions.length === 0 ? (
                <p className="px-2 py-4 text-xs text-slate-500">
                  {permissions.length === 0
                    ? "No permissions are available."
                    : "No permissions match your search."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {filteredPermissions.map((permission) => {
                    const permissionId = permission.id;
                    const checked = assignedPermissionIds.has(permissionId);
                    return (
                      <li key={permissionId}>
                        <label className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-slate-900/20"
                              checked={checked}
                              onChange={() =>
                                handleToggle(permissionId, !checked)
                              }
                              disabled={busyState}
                            />
                            <span>{formatPermission(permission)}</span>
                          </div>
                          <span className="text-xs uppercase tracking-wide text-slate-400">
                            {checked ? "Assigned" : "Available"}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={busyState}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );

  async function handleToggle(permissionId: string, nextChecked: boolean) {
    const targetPermission = permissions.find(
      (permission) => permission.id === permissionId
    );

    if (!targetPermission) {
      return;
    }

    try {
      if (nextChecked) {
        await assignPermission({
          variables: {
            input: {
              permission_id: permissionId,
              role_id: role.id,
            },
          },
        });
        await refetchRoles();
        setBanner({
          type: "success",
          message: `Granted ${formatPermission(targetPermission)} to ${
            role.name
          }.`,
        });
      } else {
        await revokePermission({
          variables: {
            role_id: role.id,
            permission_id: permissionId,
          },
        });
        await refetchRoles();
        setBanner({
          type: "success",
          message: `Revoked ${formatPermission(targetPermission)} from ${
            role.name
          }.`,
        });
      }
    } catch (error) {
      console.error("[togglePermission]", error);
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to update the selected permission.",
      });
    }
  }
}

function formatPermission(permission?: {
  module?: string | null;
  action?: string | null;
}) {
  if (!permission) return "permission";
  const module = permission.module ?? "global";
  const action = permission.action ?? "read";
  return `${module}.${action}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}
