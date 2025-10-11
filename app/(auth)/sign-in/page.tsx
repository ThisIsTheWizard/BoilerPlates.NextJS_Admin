"use client";

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Card, Title, Text, TextInput, Button } from '@tremor/react';
import { useSearchParams } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
      callbackUrl,
    });
    setLoading(false);
    if (!res || res.error) {
      setError(res?.error ?? 'Unable to sign in');
      return;
    }
    window.location.href = res.url ?? callbackUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tremor-background-muted p-4">
      <Card className="w-full max-w-md">
        <Title>Sign in</Title>
        <Text className="mt-2">Use your admin credentials</Text>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Text>Email</Text>
            <TextInput type="email" value={email} onValueChange={setEmail} placeholder="you@example.com" required />
          </div>
          <div>
            <Text>Password</Text>
            <TextInput type="password" value={password} onValueChange={setPassword} placeholder="••••••••" required />
          </div>
          {error && <Text className="text-red-600">{error}</Text>}
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </Card>
    </div>
  );
}

