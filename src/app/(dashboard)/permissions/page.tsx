"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Filter, Shield } from "lucide-react";
import type { Metadata } from "next";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  GET_PERMISSIONS_QUERY,
  type PermissionsQueryResult,
} from "@/services/permissions";
import { GET_ROLES_QUERY, type RolesQueryResult } from "@/services/roles";

export default function PermissionsPage() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  const {
    data: permissionsData,
    loading: permissionsLoading,
    error: permissionsError,
  } = useQuery<PermissionsQueryResult>(GET_PERMISSIONS_QUERY, {
    variables: { options: { limit: 200, offset: 0 } },
    fetchPolicy: "cache-and-network",
  });

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery<RolesQueryResult>(GET_ROLES_QUERY, {
    variables: { options: { limit: 50, offset: 0 } },
    fetchPolicy: "cache-and-network",
  });

  const permissions = permissionsData?.getPermissions?.data ?? [];
  const roles = rolesData?.getRoles?.data ?? [];

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
    const map = new Map<string, string[]>();
    roles.forEach((role) => {
      role.permissions?.forEach((permission) => {
        if (!map.has(permission.id)) {
          map.set(permission.id, []);
        }
        map.get(permission.id)?.push(role.name);
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
                          <RolePillList roles={attachedRoles} />
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-slate-500">
                        {formatDate(permission.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
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

function formatDate(input?: string | null) {
  if (!input) return "—";
  try {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  } catch {
    return "—";
  }
}
