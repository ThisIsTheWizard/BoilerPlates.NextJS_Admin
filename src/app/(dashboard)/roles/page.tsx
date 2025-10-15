"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ASSIGN_PERMISSION_MUTATION,
  GET_PERMISSIONS_QUERY,
  REMOVE_PERMISSION_MUTATION,
  type PermissionsQueryResult,
} from "@/services/permissions";
import { GET_ROLES_QUERY, type RolesQueryResult } from "@/services/roles";

type BannerState = {
  type: "success" | "error";
  message: string;
} | null;

export default function RolesPage() {
  const [banner, setBanner] = useState<BannerState>(null);

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
              permissions={permissions}
              refetchRoles={refetchRoles}
              setBanner={setBanner}
              disabled={permissionsLoading}
            />
          ))
        )}
      </section>
    </div>
  );
}

type RoleRow = RolesQueryResult["getRoles"]["data"][number];
type PermissionRow = PermissionsQueryResult["getPermissions"]["data"][number];

type RoleCardProps = {
  role: RoleRow;
  permissions: PermissionRow[];
  refetchRoles: () => Promise<unknown>;
  setBanner: (banner: BannerState) => void;
  disabled?: boolean;
};

function RoleCard({
  role,
  permissions,
  refetchRoles,
  setBanner,
  disabled,
}: RoleCardProps) {
  const [selectedPermission, setSelectedPermission] = useState<string>("");

  const [assignPermission, { loading: assigning }] = useMutation(
    ASSIGN_PERMISSION_MUTATION
  );
  const [removePermission, { loading: revoking }] = useMutation(
    REMOVE_PERMISSION_MUTATION
  );

  const busy = assigning || revoking;

  const assignedPermissions = role.permissions ?? [];
  const availablePermissions = useMemo(
    () =>
      permissions.filter(
        (permission) =>
          !assignedPermissions.some(
            (assigned) =>
              assigned.id === permission.id &&
              assigned?.role_permissions?.can_do_the_action
          )
      ),
    [assignedPermissions, permissions]
  );

  const handleAssign = async () => {
    if (!selectedPermission) return;
    const targetPermission = permissions.find(
      (permission) => permission.id === selectedPermission
    );

    try {
      await assignPermission({
        variables: {
          input: {
            role_id: role.id,
            permission_id: selectedPermission,
            can_do_the_action: true,
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
      setSelectedPermission("");
    } catch (error) {
      console.error("[assignPermission]", error);
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to assign the selected permission.",
      });
    }
  };

  const handleRemove = async (permissionId: string) => {
    const targetPermission = permissions.find(
      (permission) => permission.id === permissionId
    );

    try {
      await removePermission({
        variables: {
          input: {
            role_id: role.id,
            permission_id: permissionId,
          },
        },
      });
      await refetchRoles();
      setBanner({
        type: "success",
        message: `Revoked ${formatPermission(targetPermission)} from ${
          role.name
        }.`,
      });
    } catch (error) {
      console.error("[removePermission]", error);
      setBanner({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to revoke the selected permission.",
      });
    }
  };

  return (
    <Card className="space-y-5">
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
          <ul className="flex flex-wrap gap-2">
            {assignedPermissions.map((permission) => (
              <li key={permission.id}>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  {formatPermission(permission)}
                  <button
                    type="button"
                    className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500 hover:bg-slate-900/20 hover:text-slate-900"
                    onClick={() => handleRemove(permission.id)}
                    disabled={busy || disabled}
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assign permission
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="flex-1 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-900/50 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
            value={selectedPermission}
            onChange={(event) => setSelectedPermission(event.target.value)}
            disabled={busy || disabled || availablePermissions.length === 0}
          >
            <option value="">
              {availablePermissions.length === 0
                ? "All permissions assigned"
                : "Select permission to assign"}
            </option>
            {availablePermissions.map((permission) => (
              <option key={permission.id} value={permission.id}>
                {formatPermission(permission)}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAssign}
            disabled={!selectedPermission || busy || disabled}
          >
            {assigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Granting...
              </>
            ) : (
              "Grant access"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
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
