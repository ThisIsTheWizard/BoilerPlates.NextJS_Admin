"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Filter, Loader2, Search, Shield } from "lucide-react";

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
    variables: { options: { limit: 200, offset: 0 } },
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

  const permissions = permissionsData?.getPermissions?.data ?? [];
  const roles = rolesData?.getRoles?.data ?? [];
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
    return Array.from(set).sort();
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
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
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
                  <th className="px-4 py-3">Permission</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Roles using</th>
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
                        {permission.module}.{permission.action}
                      </td>
                      <td className="px-4 py-4 capitalize text-slate-600">
                        {permission.module}
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
                          variant="outline"
                          size="sm"
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
          setBanner={setBanner}
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
  setBanner: (banner: BannerState) => void;
  refetchRoles: () => Promise<unknown>;
  refetchPermissions: () => Promise<unknown>;
};

function PermissionRolesModal({
  open,
  permission,
  assignedRoles,
  allRoles,
  onClose,
  setBanner,
  refetchRoles,
  refetchPermissions,
}: PermissionRolesModalProps) {
  const [search, setSearch] = useState("");
  const [assignPermissionToRole, { loading: assigning }] = useMutation(
    ASSIGN_PERMISSION_MUTATION
  );
  const [revokePermissionFromRole, { loading: revoking }] = useMutation(
    REVOKE_PERMISSION_MUTATION
  );
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const busyState = assigning || revoking;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSearch("");
  }, [permission.id]);

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

  const assignedRoleIds = useMemo(
    () => new Set(assignedRoles.map((role) => role.id)),
    [assignedRoles]
  );

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allRoles;
    return allRoles.filter((role) =>
      role.name.toLowerCase().includes(query)
    );
  }, [allRoles, search]);

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
              Manage roles for {permission.module}.{permission.action}
            </h2>
            <p id={descriptionId} className="text-sm text-slate-600">
              Assign or revoke roles that can use this permission.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Roles with access
              </p>
              {assignedRoles.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-xs text-slate-500">
                  No roles currently use this permission. Select one below to
                  grant access.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {assignedRoles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
                    >
                      {role.name}
                      <button
                        type="button"
                        className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 transition hover:bg-slate-900/20 hover:text-slate-900 disabled:opacity-50"
                        onClick={() => handleRemove(role.id)}
                        disabled={busyState}
                      >
                        Remove
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label
                htmlFor={`${titleId}-search`}
                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Add role
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id={`${titleId}-search`}
                  type="search"
                  placeholder="Search roles..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-white/60 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-slate-900/50 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
                  disabled={busyState}
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-2">
                {filteredRoles.length === 0 ? (
                  <p className="px-2 py-4 text-xs text-slate-500">
                    {availableRoles.length === 0
                      ? "All roles already have this permission."
                      : "No roles match your search."}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {filteredRoles.map((role) => (
                      <li key={role.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100/80 disabled:opacity-50"
                          onClick={() => handleAssign(role.id)}
                          disabled={busyState}
                        >
                          <span>{role.name}</span>
                          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wide text-slate-400">
                            {busyState ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : null}
                            Grant
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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

  async function handleAssign(roleId: string) {
    const role = allRoles.find((item) => item.id === roleId);
    try {
      await assignPermissionToRole({
        variables: {
          input: {
            permission_id: permission.id,
            role_id: roleId,
          },
        },
      });
      await Promise.all([refetchRoles(), refetchPermissions()]);
      setBanner({
        type: "success",
        message: `Granted ${permission.module}.${permission.action} to ${
          role?.name ?? "role"
        }.`,
      });
    } catch (error) {
      console.error("[assignPermission]", error);
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to assign the selected role.",
      });
    }
  }

  async function handleRemove(roleId: string) {
    const role = allRoles.find((item) => item.id === roleId);
    try {
      await revokePermissionFromRole({
        variables: {
          input: {
            role_id: roleId,
            permission_id: permission.id,
          },
        },
      });
      await Promise.all([refetchRoles(), refetchPermissions()]);
      setBanner({
        type: "success",
        message: `Revoked ${permission.module}.${permission.action} from ${
          role?.name ?? "role"
        }.`,
      });
    } catch (error) {
      console.error("[revokePermission]", error);
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to revoke the selected role.",
      });
    }
  }
}
