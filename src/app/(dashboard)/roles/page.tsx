"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, Shield, ShieldCheck } from "lucide-react";

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

export default function RolesPage() {
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

  const rawRoles = rolesData?.getRoles?.data;
  const roles = useMemo(() => rawRoles ?? [], [rawRoles]);
  const rawPermissions = permissionsData?.getPermissions?.data;
  const permissions = useMemo(() => rawPermissions ?? [], [rawPermissions]);
  const permissionModuleOrder = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    permissions.forEach((permission) => {
      const moduleName = permission.module ?? "global";
      if (!seen.has(moduleName)) {
        seen.add(moduleName);
        order.push(moduleName);
      }
    });
    return order;
  }, [permissions]);
  const activeRole = useMemo(
    () => roles.find((role) => role.id === activeRoleId) ?? null,
    [roles, activeRoleId]
  );
  const closeModal = () => setActiveRoleId(null);

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

      <section className="grid gap-6 sm:grid-cols-2">
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
              moduleOrder={permissionModuleOrder}
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
  moduleOrder: string[];
  disabled?: boolean;
};

function RoleCard({
  role,
  onManagePermissions,
  moduleOrder,
  disabled,
}: RoleCardProps) {
  const assignedPermissions = useMemo(
    () => role.permissions ?? [],
    [role.permissions]
  );
  const moduleDescriptions = useMemo(() => {
    const grouped = new Map<string, PermissionRow[]>();
    assignedPermissions.forEach((permission) => {
      const moduleKey = permission.module ?? "global";
      const modulePermissions = grouped.get(moduleKey) ?? [];
      modulePermissions.push(permission);
      grouped.set(moduleKey, modulePermissions);
    });

    return Array.from(grouped.entries()).map(([moduleKey, perms]) => {
      const actions = perms
        .map((permission) => formatActionLabel(permission.action))
        .join(", ");
      return {
        module: moduleKey,
        description: `${formatModuleLabel(moduleKey)}: Can ${actions}`,
      };
    });
  }, [assignedPermissions]);

  const previewModules = useMemo(() => {
    const orderMap = new Map<string, number>();
    moduleOrder.forEach((moduleName, index) => {
      orderMap.set(moduleName, index);
    });

    return moduleDescriptions
      .slice()
      .sort((a, b) => {
        const aIndex = orderMap.get(a.module) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = orderMap.get(b.module) ?? Number.MAX_SAFE_INTEGER;
        if (aIndex === bIndex) {
          return a.module.localeCompare(b.module);
        }
        return aIndex - bIndex;
      });
  }, [moduleDescriptions, moduleOrder]);

  return (
    <Card className="flex h-full min-h-[22rem] flex-col justify-between space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-slate-700 shadow-sm">
            <Shield className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
            <h2 className="text-lg font-semibold capitalize text-slate-900">
              {role.name}
            </h2>
          </div>
        </div>
        <div className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600">
          {formatNumber(role.users?.length ?? 0)} member
          {role.users && role.users.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Modules
        </p>
        {moduleDescriptions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-xs text-slate-500">
            No modules assigned yet. Add one below.
          </p>
        ) : (
          <div className="space-y-2">
            <ul className="flex flex-wrap gap-2">
              {previewModules.map((module) => (
                <li key={module.module}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                    {module.description}
                  </span>
                </li>
              ))}
            </ul>
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
            variant="default"
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
  busy?: boolean;
};

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

function RolePermissionsModal({
  open,
  role,
  permissions,
  onClose,
  refetchRoles,
  busy,
}: RolePermissionsModalProps) {
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingPermissionId, setPendingPermissionId] = useState<string | null>(
    null
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [assignPermission, { loading: assigning }] = useMutation(
    ASSIGN_PERMISSION_MUTATION
  );
  const [revokePermission, { loading: revoking }] = useMutation(
    REVOKE_PERMISSION_MUTATION
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const assignedPermissionIds = useMemo(
    () => (role.permissions ?? []).map((permission) => permission.id),
    [role.permissions]
  );

  const assignedKey = useMemo(
    () => assignedPermissionIds.slice().sort().join("|"),
    [assignedPermissionIds]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedPermissionIds(new Set(assignedPermissionIds));
    setFeedback(null);
    setPendingPermissionId(null);
    setHasChanges(false);
  }, [open, assignedKey, assignedPermissionIds]);

  const groupedPermissions = useMemo(() => {
    const modules = new Map<string, PermissionRow[]>();
    permissions.forEach((permission) => {
      const moduleKey = permission.module ?? "global";
      const modulePermissions = modules.get(moduleKey) ?? [];
      modulePermissions.push(permission);
      modules.set(moduleKey, modulePermissions);
    });

    return Array.from(modules.entries())
      .map(([moduleName, modulePermissions]) => ({
        module: moduleName,
        permissions: modulePermissions
          .slice()
          .sort((a, b) => (a.action ?? "").localeCompare(b.action ?? "")),
      }))
      .sort((a, b) => a.module.localeCompare(b.module));
  }, [permissions]);

  const moduleGroups = groupedPermissions;
  const roleLabel = formatModuleLabel(role.name);

  const busyState =
    busy || assigning || revoking || pendingPermissionId !== null;

  const handleClose = useCallback(async () => {
    if (busyState) return;

    if (hasChanges) {
      try {
        await refetchRoles();
      } catch (error) {
        console.error("[closeRolePermissionsModal]", error);
        const message =
          error instanceof Error
            ? error.message.replace("GraphQL error: ", "")
            : "Unable to refresh role permissions. View may be outdated.";
        setFeedback({ type: "error", message });
        setHasChanges(false);
        return;
      }
    }

    onClose();
  }, [busyState, hasChanges, refetchRoles, onClose]);

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

  const handleTogglePermission = async (permission: PermissionRow) => {
    if (busyState) return;

    const permissionId = permission.id;
    const nextChecked = !selectedPermissionIds.has(permissionId);
    const actionLabel = formatActionLabel(permission.action);
    const moduleLabel = formatModuleLabel(permission.module);

    setFeedback(null);
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (nextChecked) {
        next.add(permissionId);
      } else {
        next.delete(permissionId);
      }
      return next;
    });
    setPendingPermissionId(permissionId);

    try {
      if (nextChecked) {
        await assignPermission({
          variables: {
            input: { permission_id: permissionId, role_id: role.id },
          },
        });
        setFeedback({
          type: "success",
          message: `Granted ${actionLabel.toLowerCase()} for ${moduleLabel}.`,
        });
      } else {
        await revokePermission({
          variables: { input: { role_id: role.id, permission_id: permissionId } },
        });
        setFeedback({
          type: "success",
          message: `Revoked ${actionLabel.toLowerCase()} for ${moduleLabel}.`,
        });
      }

      setHasChanges(true);
    } catch (error) {
      console.error("[toggleRolePermission]", error);
      setSelectedPermissionIds((prev) => {
        const next = new Set(prev);
        if (nextChecked) {
          next.delete(permissionId);
        } else {
          next.add(permissionId);
        }
        return next;
      });
      const message =
        error instanceof Error
          ? error.message.replace("GraphQL error: ", "")
          : "Unable to update this role permission.";
      setFeedback({ type: "error", message });
    } finally {
      setPendingPermissionId(null);
    }
  };

  const portalTarget = typeof document !== "undefined" ? document.body : null;

  if (!mounted || !open || !portalTarget) {
    return null;
  }

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
              <span>Manage permissions for</span>
              <span className="inline-flex items-center rounded-full bg-slate-900/5 px-3 py-1 text-sm font-semibold text-slate-900">
                {roleLabel}
              </span>
            </h2>
            <p id={descriptionId} className="text-sm text-slate-600">
              Assign or revoke module actions to keep this role aligned with
              your security model.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {feedback ? (
              <p
                className={cn(
                  "rounded-2xl border px-3 py-2 text-sm",
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                )}
              >
                {feedback.message}
              </p>
            ) : null}

            <div className="max-h-[32rem] overflow-y-auto rounded-2xl border border-white/60 bg-white/80 p-3">
              {moduleGroups.length === 0 ? (
                <p className="px-2 py-4 text-xs text-slate-500">
                  No permissions are available.
                </p>
              ) : (
                <div className="space-y-3">
                  {moduleGroups.map(({ module, permissions: modulePermissions }) => (
                    <div key={module} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatModuleLabel(module)}
                        </p>
                        <span className="text-xs text-slate-400">
                          {modulePermissions.length} permission
                          {modulePermissions.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-around gap-3">
                        {modulePermissions.map((permission) => {
                          const checked = selectedPermissionIds.has(permission.id);
                          const isPending = pendingPermissionId === permission.id;
                          return (
                            <label
                              key={permission.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/50 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border border-slate-300 text-slate-900 focus:ring-slate-900/20"
                                checked={checked}
                                onChange={() => {
                                  void handleTogglePermission(permission);
                                }}
                                disabled={busyState}
                              />
                              <span>{formatActionLabel(permission.action)}</span>
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              onClick={() => {
                void handleClose();
              }}
              disabled={busyState}
            >
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
