import { gql } from "@apollo/client";

import type { AuthSession, AuthUser, RoleName } from "@/types/auth";

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      access_token
      refresh_token
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      first_name
      last_name
      status
    }
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($input: ForgotPasswordInput!) {
    forgotPassword(input: $input) {
      success
      message
    }
  }
`;

export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    user {
      id
      email
      first_name
      last_name
      permissions
      role
      status
    }
  }
`;

export type GraphQLUser = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  roles: Array<{ name: RoleName }>;
  status: AuthUser["status"];
};
