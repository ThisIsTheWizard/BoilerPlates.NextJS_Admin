"use client";

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  from,
  type NormalizedCacheObject,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";

import { authStore } from "@/store/auth.store";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const httpLink = new HttpLink({
  uri: `${API_BASE_URL}/graphql`,
  credentials: "include",
});

const authLink = setContext(async (_, { headers }) => {
  const token = authStore.getState().tokens?.accessToken;

  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: token } : {}),
      "Content-Type": "application/json",
    },
  };
});

const errorLink = onError(({ graphQLErrors }) => {
  if (!graphQLErrors) return;

  const hasToken = Boolean(authStore.getState().tokens?.accessToken);

  if (!hasToken) return;

  for (const error of graphQLErrors) {
    if (error.extensions?.code === "UNAUTHENTICATED") {
      authStore.getState().clear();
      break;
    }
  }
});

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

export function getApolloClient() {
  if (!apolloClient) {
    apolloClient = new ApolloClient({
      link: from([errorLink, authLink, httpLink]),
      cache: new InMemoryCache(),
    });
  }

  return apolloClient;
}
