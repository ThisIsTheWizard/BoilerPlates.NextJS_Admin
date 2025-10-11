import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { graphqlServer } from "./api";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        try {
          // GraphQL login mutation
          const LOGIN_MUTATION = `mutation Login($input: LoginInput!) { login(input: $input) { access_token refresh_token } }`;
          const res = await graphqlServer(LOGIN_MUTATION, { input: { email, password } });
          if (!res.ok) return null;
          const payload = await res.json();
          const gqlErrors = payload?.errors;
          if (gqlErrors?.length) return null;
          const { access_token, refresh_token } = payload?.data?.login ?? {};
          if (!access_token) return null;

          // Derive role from JWT roles claim (payload.roles)
          const role = (() => {
            try {
              const parts = access_token.split(".");
              if (parts.length !== 3) return "user";
              const json = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
              const roles: string[] = Array.isArray(json?.roles) ? json.roles : [];
              const priority = ["admin", "developer", "moderator", "user"] as const;
              for (const r of priority) if (roles.includes(r)) return r;
              return roles[0] ?? "user";
            } catch {
              return "user";
            }
          })();
          const permissions: string[] = [];

          return {
            id: email,
            name: email,
            email,
            role,
            permissions,
            accessToken: access_token,
          } as any;
        } catch (err) {
          console.log(err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session.user as any).role = (token as any).role;
      (session.user as any).permissions = (token as any).permissions ?? [];
      return session;
    },
  },
  pages: { signIn: "/sign-in" },
  secret: process.env.NEXTAUTH_SECRET,
};
