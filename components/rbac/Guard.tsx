"use client";

import { PropsWithChildren } from 'react';
import { useSession } from 'next-auth/react';
import { can } from '@/lib/rbac';

type GuardProps = PropsWithChildren<{
  anyRole?: string[];
  anyPerm?: [string, string][]; // [module, action]
  fallback?: React.ReactNode;
}>;

export default function Guard({ anyRole, anyPerm, children, fallback = null }: GuardProps) {
  const { data: session, status } = useSession();
  if (status === 'loading') return null;
  const ok = can(session as any, { anyRole, anyPerm });
  if (!ok) return <>{fallback}</>;
  return <>{children}</>;
}

