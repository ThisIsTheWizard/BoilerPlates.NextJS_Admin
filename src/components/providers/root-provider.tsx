"use client";

import type { ReactNode } from "react";
import { ApolloProvider } from "@apollo/client";

import { getApolloClient } from "@/lib/apollo-client";

export default function RootProvider({ children }: { children: ReactNode }) {
  const client = getApolloClient();

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
