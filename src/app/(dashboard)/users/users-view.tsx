"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, RefreshCw, X } from "lucide-react";

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

export function UsersView() {
  const [banner, setBanner] = useState<BannerState>(null);

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
                      <RoleManager
                        key={user.id}
                        userId={user.id}
                        userName={formatName(user)}
                        currentRoles={user.roles ?? []}
                        allRoles={allRoles}
                        onSuccess={(message) =>
                          setBanner({ type: "success", message })
                        }
                        onError={(message) =>
                          setBanner({ type: "error", message })
                        }
                        refetchUsers={refetch}
                        disabled={rolesLoading}
                      />
                    </td>
                    <td className="px-4 py-4 text-right text-slate-500">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

type UsersRow = UsersQueryResult["getUsers"]["data"][number];
type RoleRow = RolesQueryResult["getRoles"]["data"][number];

type RoleManagerProps = {
  userId: string;
  userName: string;
  currentRoles: UsersRow["roles"];
  allRoles: RoleRow[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refetchUsers: () => Promise<unknown>;
  disabled?: boolean;
};

function RoleManager({
  userId,
  userName,
  currentRoles,
  allRoles,
  onSuccess,
  onError,
  refetchUsers,
  disabled,
}: RoleManagerProps) {
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
    <div className="space-y-3">
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
                className="rounded-full bg-slate-900/10 p-1 text-slate-500 hover:bg-slate-900/20 hover:text-slate-900"
                onClick={() => handleRemove(role.id, role.name)}
                disabled={busy || disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-500">
            No roles assigned. Add one below.
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <select
            className="w-full appearance-none rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-slate-900/50 focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60"
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

function formatName(user: UsersRow) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name.length > 0 ? name : "—";
}
