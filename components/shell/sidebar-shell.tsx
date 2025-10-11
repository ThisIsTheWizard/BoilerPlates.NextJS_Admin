"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Button, Title, Text } from '@tremor/react';
import clsx from 'clsx';
import Guard from '@/components/rbac/Guard';

const nav = [
  { href: '/dashboard', label: 'Dashboard', anyRole: ['admin', 'developer', 'moderator', 'user'] },
  { href: '/admin/users', label: 'Users', anyPerm: [['user', 'read']], anyRole: ['admin'] },
  { href: '/admin/roles', label: 'Roles', anyPerm: [['role', 'read']], anyRole: ['admin', 'developer'] },
];

export default function SidebarShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-tremor-background-muted">
      <aside className="bg-white border-r border-tremor-border p-4 flex flex-col gap-6">
        <div>
          <Title>Admin Panel</Title>
          <Text className="text-tremor-content-subtle">Welcome{session?.user?.name ? `, ${session.user.name}` : ''}</Text>
        </div>
        <nav className="flex-1 space-y-2">
          {nav.map((item) => (
            <Guard key={item.href} anyRole={item.anyRole} anyPerm={item.anyPerm as any}>
              <Link
                href={item.href}
                className={clsx(
                  'block px-3 py-2 rounded-md',
                  pathname?.startsWith(item.href)
                    ? 'bg-tremor-brand-faint text-tremor-brand-emphasis'
                    : 'text-tremor-content',
                )}
              >
                {item.label}
              </Link>
            </Guard>
          ))}
        </nav>
        <div className="space-y-2">
          <Text className="text-tremor-content-subtle text-sm">Role: {session?.user && (session.user as any).role}</Text>
          <Button variant="secondary" className="w-full" onClick={() => signOut({ callbackUrl: '/sign-in' })}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
