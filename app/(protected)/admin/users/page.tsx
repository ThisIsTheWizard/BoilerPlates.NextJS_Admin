import { Card, Title, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Badge, Button } from '@tremor/react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { graphqlServer } from '@/lib/api';
import { revalidatePath } from 'next/cache';

type User = { id: string; email: string; first_name?: string | null; last_name?: string | null; status?: string | null };
type Role = { id: string; name: string };

async function getUsers(token?: string) {
  try {
    const query = `query GetUsers($options: Options) { getUsers(options: $options) { data { id email first_name last_name status } } }`;
    const res = await graphqlServer(query, { options: { limit: 100, offset: 0 } }, { token, next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed');
    const payload = await res.json();
    const errs = payload?.errors;
    if (errs?.length) throw new Error('Failed');
    const data: User[] = payload?.data?.getUsers?.data ?? [];
    return { users: data } as { users: User[] };
  } catch {
    return { users: [{ id: '1', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', status: 'active' }] };
  }
}

async function getRoles(token?: string): Promise<Role[]> {
  try {
    const query = `query GetRoles($options: Options) { getRoles(options: $options) { data { id name } } }`;
    const res = await graphqlServer(query, { options: { limit: 100, offset: 0 } }, { token, next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed');
    const payload = await res.json();
    if (payload?.errors?.length) throw new Error('Failed');
    return (payload?.data?.getRoles?.data ?? []) as Role[];
  } catch {
    return [
      { id: 'admin', name: 'admin' },
      { id: 'developer', name: 'developer' },
      { id: 'user', name: 'user' },
    ];
  }
}

// Role assignment is managed via RoleUser mutations in GraphQL; not shown here.

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.accessToken as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;
  const perms = ((session?.user as any)?.permissions ?? []) as string[];
  const canUpdate = role === 'admin' || role === 'developer';
  const { users } = await getUsers(token);
  const roles = await getRoles(token);

  return (
    <Card>
      <Title>Users</Title>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Assign Role</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '-'}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Badge color={u.status === 'active' ? 'emerald' : u.status === 'blocked' ? 'rose' : 'gray'}>{u.status ?? '-'}</Badge>
              </TableCell>
              <TableCell>
                <AssignRoleForm token={token} roles={roles} userId={u.id} enabled={!!token && canUpdate} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

async function assignRole(token: string, formData: FormData) {
  'use server';
  const user_id = String(formData.get('user_id') ?? '');
  const role_id = String(formData.get('role_id') ?? '');
  if (!user_id || !role_id) return;
  const mutation = `mutation AssignRole($input: CreateRoleUserInput!) { assignRole(input: $input) { id } }`;
  await graphqlServer(mutation, { input: { user_id, role_id } }, { token });
  revalidatePath('/admin/users');
}

function AssignRoleForm({ token, roles, userId, enabled }: { token?: string; roles: Role[]; userId: string; enabled: boolean }) {
  if (!enabled || !token) return <span className="text-tremor-content-subtle">-</span>;
  return (
    <form action={assignRole.bind(null, token)} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={userId} />
      <select name="role_id" className="w-44 border border-tremor-border rounded-md px-2 py-1 bg-white">
        <option value="">Select role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>
      <Button type="submit" variant="secondary">Assign</Button>
    </form>
  );
}
