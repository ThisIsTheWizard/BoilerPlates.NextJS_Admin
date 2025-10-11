import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { normalizePermissions } from '@/lib/rbac';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/sign-in');
  const role = (session?.user as any)?.role as string | undefined;
  const perms = normalizePermissions((session?.user as any)?.permissions);
  const allowedByRole = role === 'admin' || role === 'developer';
  const allowedByPerm = perms.includes('role:read') || perms.includes('user:read');
  if (!allowedByRole && !allowedByPerm) redirect('/dashboard');
  return <>{children}</>;
}
