type SessionLike = {
  user?: { role?: string; permissions?: any };
};

export function normalizePermissions(perms: any): string[] {
  if (!perms) return [];
  if (Array.isArray(perms)) {
    // If they are strings already
    if (perms.every((p) => typeof p === 'string'))
      return (perms as string[]).map((p) => (p.includes('.') ? p.replace('.', ':') : p));
    // If objects like { module, action }
    return (perms as any[])
      .map((p) => {
        const mod = p?.module ?? p?.resource ?? p?.name;
        const act = p?.action ?? p?.verb ?? p?.type;
        if (!mod || !act) return null;
        return `${String(mod)}:${String(act)}`;
      })
      .filter(Boolean) as string[];
  }
  return [];
}

export function hasRole(session: SessionLike | null | undefined, roles: string | string[]) {
  const r = (session?.user as any)?.role as string | undefined;
  const list = Array.isArray(roles) ? roles : [roles];
  return !!r && list.includes(r);
}

export function hasPermission(
  session: SessionLike | null | undefined,
  module: string,
  action: string | string[],
) {
  const perms = normalizePermissions((session?.user as any)?.permissions);
  const actions = Array.isArray(action) ? action : [action];
  return actions.some((a) => perms.includes(`${module}:${a}`));
}

export function can(
  session: SessionLike | null | undefined,
  opts:
    | { anyRole?: string[]; allRoles?: string[]; anyPerm?: [string, string][] }
    | undefined,
) {
  if (!opts) return true;
  const role = (session?.user as any)?.role as string | undefined;
  const perms = normalizePermissions((session?.user as any)?.permissions);
  if (!role) return false;
  if (opts.anyRole && opts.anyRole.some((r) => r === role)) return true;
  if (opts.allRoles && opts.allRoles.every((r) => r === role)) return true;
  if (opts.anyPerm && opts.anyPerm.some(([m, a]) => perms.includes(`${m}:${a}`))) return true;
  return false;
}
