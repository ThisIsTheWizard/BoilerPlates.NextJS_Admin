"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";

import { MiniAreaChart } from "@/components/dashboard/mini-area-chart";
import { StatusDistribution } from "@/components/dashboard/status-distribution";
import { Card } from "@/components/ui/card";
import {
  GET_PERMISSIONS_QUERY,
  type PermissionsQueryResult,
} from "@/services/permissions";
import { GET_ROLES_QUERY, type RolesQueryResult } from "@/services/roles";
import {
  GET_USERS_QUERY,
  USERS_DEFAULT_OPTIONS,
  type UsersQueryResult,
} from "@/services/users";
import { formatDate, toEpochMilliseconds } from "~/lib/utils";

const DASHBOARD_USERS_OPTIONS = {
  ...USERS_DEFAULT_OPTIONS,
  limit: 50,
  order: [["created_at", "DESC"]],
};

export default function DashboardHomePage() {
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery<UsersQueryResult>(GET_USERS_QUERY, {
    variables: { options: DASHBOARD_USERS_OPTIONS },
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

  const rawUserRows = usersData?.getUsers?.data;
  const userRows = useMemo(() => rawUserRows ?? [], [rawUserRows]);
  const totalUsers =
    usersData?.getUsers?.meta_data?.total_rows ?? userRows.length;
  const activeUsers = userRows.filter(
    (user) => user.status === "active"
  ).length;
  const invitedUsers = userRows.filter(
    (user) => user.status === "invited"
  ).length;
  const unverifiedUsers = userRows.filter(
    (user) => user.status === "unverified"
  ).length;

  const rawRoles = rolesData?.getRoles?.data;
  const roles = useMemo(() => rawRoles ?? [], [rawRoles]);
  const rolesCount = rolesData?.getRoles?.meta_data?.total_rows ?? roles.length;

  const rawPermissions = permissionsData?.getPermissions?.data;
  const globalPermissions = useMemo(() => rawPermissions ?? [], [rawPermissions]);
  const permissionsCount =
    permissionsData?.getPermissions?.meta_data?.total_rows ??
    globalPermissions.length;

  const roleAssignments = useMemo(
    () => roles.reduce((acc, role) => acc + (role.users?.length ?? 0), 0),
    [roles]
  );

  const averageRolesPerUser = totalUsers
    ? (roleAssignments / totalUsers).toFixed(1)
    : "0.0";

  const statusSlices = useMemo(
    () => [
      { status: "active", count: activeUsers },
      { status: "invited", count: invitedUsers },
      { status: "unverified", count: unverifiedUsers },
      {
        status: "inactive",
        count: userRows.filter((user) => user.status === "inactive").length,
      },
    ],
    [activeUsers, invitedUsers, unverifiedUsers, userRows]
  );

  const userTrend = useMemo(() => buildMonthlyTrend(userRows), [userRows]);

  const recentUsers = userRows.slice(0, 5);

  const hasAnyError = usersError ?? rolesError ?? permissionsError;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Total users"
          value={formatNumber(totalUsers)}
          hint={
            usersLoading
              ? "Syncing directory..."
              : `${formatNumber(activeUsers)} active · ${formatNumber(
                  invitedUsers
                )} invited`
          }
        />
        <MetricTile
          label="Active roles"
          value={formatNumber(rolesCount)}
          hint={
            rolesLoading
              ? "Loading roles..."
              : `${formatNumber(roleAssignments)} assignments`
          }
        />
        <MetricTile
          label="Permissions"
          value={formatNumber(permissionsCount)}
          hint={
            permissionsLoading
              ? "Loading permissions..."
              : "Manage access across modules"
          }
        />
        <MetricTile
          label="Roles per user"
          value={averageRolesPerUser}
          hint="Average assignments across directory"
        />
      </section>

      {hasAnyError ? (
        <Card className="border-red-200 bg-red-100/70 text-sm text-red-700">
          <p>
            {usersError?.message ??
              rolesError?.message ??
              permissionsError?.message ??
              "Unable to load dashboard metrics from the GraphQL API."}
          </p>
        </Card>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Monthly signups
              </h2>
              <p className="text-sm text-slate-600">
                Rolling six-month trend based on account creation dates.
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {formatNumber(totalUsers)} total
            </span>
          </div>
          <MiniAreaChart data={userTrend} />
        </Card>

        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Status snapshot
            </h2>
            <p className="text-sm text-slate-600">
              Track lifecycle states across your user base.
            </p>
          </div>
          <StatusDistribution data={statusSlices} total={totalUsers} />
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent signups
            </h2>
            <p className="text-sm text-slate-600">
              The latest members joining your workspace.
            </p>
          </div>
          <ul className="divide-y divide-white/50">
            {recentUsers.length === 0 ? (
              <li className="py-4 text-sm text-slate-500">
                No recent signups. Invite teammates to get started.
              </li>
            ) : (
              recentUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between py-3 text-sm text-slate-700"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatName(user)}
                    </p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="capitalize">{user.status}</p>
                    <p>{formatDate(user.created_at)}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Role coverage
            </h2>
            <p className="text-sm text-slate-600">
              Understand how roles are distributed across users.
            </p>
          </div>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3 backdrop-blur">
              <span className="font-medium text-slate-600">Assignments</span>
              <span className="font-semibold text-slate-900">
                {formatNumber(roleAssignments)}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3 backdrop-blur">
              <span className="font-medium text-slate-600">Roles in use</span>
              <span className="font-semibold text-slate-900">
                {formatNumber(
                  roles.filter((role) => (role.users?.length ?? 0) > 0).length
                )}
              </span>
            </li>
            <li className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/60 px-4 py-3 backdrop-blur">
              <span className="font-medium text-slate-600">
                Permissions span
              </span>
              <span className="font-semibold text-slate-900">
                {formatNumber(
                  roles.reduce(
                    (acc, role) => acc + (role.permissions?.length ?? 0),
                    0
                  )
                )}{" "}
                total
              </span>
            </li>
          </ul>
        </Card>
      </section>
    </div>
  );
}

function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-600">{hint}</p>
    </Card>
  );
}

type UserRow = UsersQueryResult["getUsers"]["data"][number];

function buildMonthlyTrend(users: UserRow[], months = 6) {
  const now = new Date();
  const markers: Array<{ key: string; label: string }> = [];
  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  });

  for (let index = months - 1; index >= 0; index -= 1) {
    const marker = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${marker.getFullYear()}-${marker.getMonth()}`;
    const label = monthFormatter.format(marker);
    markers.push({ key, label });
  }

  const counts = markers.reduce<Record<string, number>>((acc, marker) => {
    acc[marker.key] = 0;
    return acc;
  }, {});

  users.forEach((user) => {
    const epoch = toEpochMilliseconds(user.created_at);
    if (epoch === null) return;
    const timestamp = new Date(epoch);
    if (Number.isNaN(timestamp.getTime())) return;
    const key = `${timestamp.getFullYear()}-${timestamp.getMonth()}`;
    if (key in counts) {
      counts[key] += 1;
    }
  });

  return markers.map((marker) => ({
    label: marker.label,
    value: counts[marker.key] ?? 0,
  }));
}

function formatName(user: UserRow) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return name.length > 0 ? name : "—";
}

function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "0";
  if (typeof value === "string") return value;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
