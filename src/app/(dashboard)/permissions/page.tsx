"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Filter, Loader2, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ASSIGN_PERMISSION_MUTATION,
  GET_PERMISSIONS_QUERY,
  REVOKE_PERMISSION_MUTATION,
  type PermissionsQueryResult,
} from "@/services/permissions";
import { GET_ROLES_QUERY, type RolesQueryResult } from "@/services/roles";
import { formatDate } from "~/lib/utils";
import { createPortal } from "react-dom";

type BannerState = {
  type: "success" | "error";
  message: string;
} | null;

type PermissionRow = PermissionsQueryResult["getPermissions"]["data"][number];
type RoleRow = RolesQueryResult["getRoles"]["data"][number];

export default function PermissionsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [banner, setBanner] = useState<BannerState>(null);
  const [activePermissionId, setActivePermissionId] = useState<string | null>(
    null
  );

  const {
    data: permissionsData,
    loading: permissionsLoading,
    error: permissionsError,
    refetch: refetchPermissions,
  } = useQuery<PermissionsQueryResult>(GET_PERMISSIONS_QUERY, {
    variables: {
      options: {
        limit: 200,
        offset: 0,
        order: [
          ["module", "ASC"],
          ["action", "ASC"],
        ],
      },
    },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useQuery<RolesQueryResult>(GET_ROLES_QUERY, {
    variables: { options: { limit: 50, offset: 0 } },
    fetchPolicy: "cache-and-network",
  });

  const rawPermissions = permissionsData?.getPermissions?.data;
  const permissions = useMemo(() => rawPermissions ?? [], [rawPermissions]);
  const rawRoles = rolesData?.getRoles?.data;
  const roles = useMemo(() => rawRoles ?? [], [rawRoles]);
  const activePermission = useMemo(
    () =>
      permissions.find((permission) => permission.id === activePermissionId) ??
      null,
    [permissions, activePermissionId]
  );
  const closeModal = () => setActivePermissionId(null);

  const modules = useMemo(() => {
    const set = new Set<string>();
    permissions.forEach((permission) => {
      if (permission.module) {
        set.add(permission.module);
      }
    });
    return Array.from(set)
      .map((module) => ({
        raw: module,
        label: formatModuleLabel(module),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [permissions]);

  const permissionRoleMap = useMemo(() => {
    const map = new Map<string, RoleRow[]>();
    roles.forEach((role) => {
      role.permissions?.forEach((permission) => {
        if (!map.has(permission.id)) {
          map.set(permission.id, []);
        }
        map.get(permission.id)?.push(role);
      });
    });
    return map;
  }, [roles]);

  const filteredPermissions = permissions.filter((permission) => {
    const matchesModule =
      moduleFilter === "all" || permission.module === moduleFilter;
    const searchable = `${permission.module ?? ""}.${
      permission.action ?? ""
    }`.toLowerCase();
    const matchesSearch =
      search.trim().length === 0 ||
      searchable.includes(search.trim().toLowerCase());
    return matchesModule && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow">
            <Shield className="h-5 w-5" />
          </span>
          Permissions catalogue
        </h1>
        <p className="text-sm text-slate-600">
          Review every permission exposed by your GraphQL layer and see which
          roles rely on it.
        </p>
      </header>

      {banner ? (
        <div
          className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-700"
              : "border-red-200 bg-red-100/80 text-red-700"
          }`}
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

      <Card className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Permission inventory
            </h2>
            <p className="text-sm text-slate-600">
              {permissionsLoading
                ? "Loading permissions..."
                : `${filteredPermissions.length} of ${permissions.length} permissions shown.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2 shadow-sm">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                className="bg-transparent text-sm text-slate-700 focus:outline-none"
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                disabled={permissionsLoading}
              >
                <option value="all">All modules</option>
                {modules.map(({ raw, label }) => (
                  <option key={raw} value={raw}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Search by module or action..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full min-w-[220px] border-white/60 bg-white/80 text-sm text-slate-700 shadow-sm focus:border-slate-900/40 focus:ring-slate-900/20"
            />
          </div>
        </div>

        {permissionsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-100/80 px-4 py-3 text-sm text-red-700">
            {permissionsError.message}
          </div>
        ) : null}
        {rolesError ? (
          <div className="rounded-2xl border border-red-200 bg-red-100/80 px-4 py-3 text-sm text-red-700">
            {rolesError.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/40 backdrop-blur">
          {permissionsLoading || rolesLoading ? (
            <div className="p-6 text-sm text-slate-500">
              Syncing permission data from GraphQL API...
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No permissions match the current filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-white/40 text-sm">
              <thead className="bg-white/40 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 backdrop-blur">
                <tr>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Assigned roles</th>
                  <th className="px-4 py-3 text-right">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 bg-white/60 backdrop-blur">
                {filteredPermissions.map((permission) => {
                  const attachedRoles =
                    permissionRoleMap.get(permission.id) ?? [];
                  return (
                    <tr key={permission.id} className="hover:bg-white/90">
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {formatModuleLabel(permission.module)}
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-600">
                        {permission.action}
                      </td>
                      <td className="px-4 py-4">
                        {attachedRoles.length === 0 ? (
                          <span className="text-xs text-slate-500">
                            Not yet assigned
                          </span>
                        ) : (
                          <RolePillList
                            roles={attachedRoles.map((role) => role.name)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-500">
                        {formatDate(permission.created_at)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          variant="default"
                          size="sm"
                          className="px-4 sm:px-5"
                          onClick={() => setActivePermissionId(permission.id)}
                          disabled={rolesLoading || permissionsLoading}
                        >
                          Manage roles
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {activePermission ? (
        <PermissionRolesModal
          open
          permission={activePermission}
          assignedRoles={permissionRoleMap.get(activePermission.id) ?? []}
          allRoles={roles}
          onClose={closeModal}
          refetchRoles={refetchRoles}
          refetchPermissions={refetchPermissions}
        />
      ) : null}
    </div>
  );
}

function RolePillList({ roles }: { roles: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => (
        <span
          key={role}
          className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
        >
          {role}
        </span>
      ))}
    </div>
  );
}

type PermissionRolesModalProps = {
  open: boolean;
  permission: PermissionRow;
  assignedRoles: RoleRow[];
  allRoles: RoleRow[];
  onClose: () => void;
  refetchRoles: () => Promise<unknown>;
  refetchPermissions: () => Promise<unknown>;
};

function PermissionRolesModal({
  open,
  permission,
  assignedRoles,
  allRoles,
  onClose,
  refetchRoles,
  refetchPermissions,
}: PermissionRolesModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(
    () => new Set()
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [assignPermissionToRole, { loading: assigning }] = useMutation(
    ASSIGN_PERMISSION_MUTATION
  );
  const [revokePermissionFromRole, { loading: revoking }] = useMutation(
    REVOKE_PERMISSION_MUTATION
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const assignedRoleIds = useMemo(
    () => (assignedRoles ?? []).map((role) => role.id),
    [assignedRoles]
  );

  const assignedKey = useMemo(
    () => assignedRoleIds.slice().sort().join("|"),
    [assignedRoleIds]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedRoleIds(new Set(assignedRoleIds));
    setErrorMessage(null);
    setPendingRoleId(null);
    setHasChanges(false);
  }, [open, assignedKey, assignedRoleIds]);

  const filteredRoles = allRoles;
  const busyState = assigning || revoking || pendingRoleId !== null;

  const handleClose = useCallback(async () => {
    if (assigning || revoking || pendingRoleId !== null) {
      return;
    }

    try {
      if (hasChanges) {
        await Promise.all([refetchRoles(), refetchPermissions()]);
      }
    } catch (error) {
      console.error("[closePermissionRolesModal]", error);
    } finally {
            onClose();
    }
  }, [
    assigning,
    revoking,
    pendingRoleId,
    hasChanges,
    refetchRoles,
    refetchPermissions,
    onClose,
  ]);

  const handleToggleRole = async (roleId: string) => {
    const nextChecked = !selectedRoleIds.has(roleId);
    setErrorMessage(null);

    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (nextChecked) {
        next.add(roleId);
      } else {
        next.delete(roleId);
      }
      return next;
    });

    setPendingRoleId(roleId);

    try {
      if (nextChecked) {
        await assignPermissionToRole({
          variables: {
            input: {
              permission_id: permission.id,
              role_id: roleId,
            },
          },
        });
      } else {
        await revokePermissionFromRole({
          variables: {
            input: {
              role_id: roleId,
              permission_id: permission.id,
            },
          },
        });
      }

      setHasChanges(true);
    } catch (error) {
      console.error("[togglePermissionRole]", error);
      setSelectedRoleIds((prev) => {
        const next = new Set(prev);
        if (nextChecked) {
          next.delete(roleId);
        } else {
          next.add(roleId);
        }
        return next;
      });
      const message =
        error instanceof Error
          ? error.message.replace("GraphQL error: ", "")
          : "Unable to update roles for this permission.";
      setErrorMessage(message);
    } finally {
      setPendingRoleId(null);
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void handleClose();
      }
    };

    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  if (!mounted || !open || !portalTarget) {
    return null;
  }

  const moduleLabel = formatModuleLabel(permission.module);
  const actionLabel = formatActionLabel(permission.action);

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 px-4 py-6 backdrop-blur-sm"
      onMouseDown={() => {
        void handleClose();
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
            <h2
              id={titleId}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold text-slate-900"
            >
              <span>Manage roles for</span>
              <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-sm font-semibold text-slate-900">
                {moduleLabel} · {actionLabel}
              </span>
            </h2>
            <p id={descriptionId} className="text-sm text-slate-600">
              Assign or revoke roles that can use this permission.
            </p>
          </div>

          <div className="space-y-4">
                        {errorMessage ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <fieldset
              className="max-h-80 overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-3"
              disabled={busyState}
            >
              {filteredRoles.length === 0 ? (
                <p className="px-2 py-4 text-xs text-slate-500">
                  {allRoles.length === 0
                    ? "No roles available."
                    : "There are no roles to display."}
                </p>
              ) : (
                <div className="grid gap-3">
                  {filteredRoles.map((role) => {
                    const checked = selectedRoleIds.has(role.id);
                    const isPending = pendingRoleId === role.id;
                    return (
                      <label
                        key={role.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-slate-900/20"
                          checked={checked}
                          onChange={() => {
                            if (!isPending) {
                              void handleToggleRole(role.id);
                            }
                          }}
                          disabled={isPending}
                        />
                        <span className="capitalize">{role.name}</span>
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => void handleClose()} disabled={busyState}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
}

function formatModuleLabel(module?: string | null) {
  const value = module ?? "global";
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatActionLabel(action?: string | null) {
  const value = action ?? "read";
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
