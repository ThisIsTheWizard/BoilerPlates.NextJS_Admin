import { Card, Title, Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell, Button, TextInput } from '@tremor/react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { graphqlServer } from '@/lib/api';
import { revalidatePath } from 'next/cache';

type Role = { id: string; name: string };

async function getRoles(token?: string) {
  try {
    const query = `query GetRoles($options: Options) { getRoles(options: $options) { data { id name description } } }`;
    const res = await graphqlServer(query, { options: { limit: 100, offset: 0 } }, { token, next: { revalidate: 30 } });
    if (!res.ok) throw new Error('Failed');
    const payload = await res.json();
    const errs = payload?.errors;
    if (errs?.length) throw new Error('Failed');
    const items: Role[] = payload?.data?.getRoles?.data ?? [];
    return items as Role[];
  } catch {
    return [
      { id: 'admin', name: 'admin' },
      { id: 'developer', name: 'developer' },
      { id: 'user', name: 'user' },
    ];
  }
}

async function createRole(token: string, formData: FormData) {
  'use server';
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const mutation = `mutation CreateRole($input: CreateRoleInput!) { createRole(input: $input) { id } }`;
  await graphqlServer(mutation, { input: { name } }, { token });
  revalidatePath('/admin/roles');
}

async function updateRole(token: string, id: string, formData: FormData) {
  'use server';
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const mutation = `mutation UpdateRole($input: UpdateRoleInput!) { updateRole(input: $input) { id } }`;
  await graphqlServer(mutation, { input: { entity_id: id, data: { name } } }, { token });
  revalidatePath('/admin/roles');
}

async function deleteRole(token: string, id: string) {
  'use server';
  const mutation = `mutation DeleteRole($id: ID!) { deleteRole(entity_id: $id) { id } }`;
  await graphqlServer(mutation, { id }, { token });
  revalidatePath('/admin/roles');
}

export default async function RolesPage() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.accessToken as string | undefined;
  const roles = await getRoles(token);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Title>Roles</Title>
        <form action={token ? createRole.bind(null, token) : undefined} className="flex items-center gap-2">
          <TextInput name="name" placeholder="New role name" className="w-56" />
          <Button type="submit" disabled={!token}>Create</Button>
        </form>
      </div>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.name}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <form action={token ? updateRole.bind(null, token, r.id) : undefined} className="flex items-center gap-2">
                    <TextInput name="name" defaultValue={r.name} className="w-48" />
                    <Button type="submit" variant="secondary" disabled={!token}>Rename</Button>
                  </form>
                  <form action={token ? deleteRole.bind(null, token, r.id) : undefined}>
                    <Button type="submit" color="rose" disabled={!token}>Delete</Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
