import { gql } from "@apollo/client";
import { PermissionsQueryResult } from "./permissions";
import { UsersQueryResult } from "./users";

export const GET_ROLES_QUERY = gql`
  query GetRoles($options: Options) {
    getRoles(options: $options) {
      data {
        id
        created_at
        name
        permissions {
          id
          action
          created_at
          module
          updated_at
        }
        updated_at
        users {
          id
        }
      }
      meta_data {
        total_rows
        filtered_rows
      }
    }
  }
`;

export const ASSIGN_ROLE_MUTATION = gql`
  mutation AssignRole($input: CreateRoleUserInput!) {
    assignRole(input: $input) {
      id
    }
  }
`;

export const REVOKE_ROLE_MUTATION = gql`
  mutation RevokeRole($input: CreateRoleUserInput!) {
    revokeRole(input: $input) {
      id
    }
  }
`;

export type RolesQueryResult = {
  getRoles: {
    data: Array<{
      id: string;
      created_at?: string | null;
      name: string;
      permissions: PermissionsQueryResult["getPermissions"]["data"];
      updated_at?: string | null;
      users: UsersQueryResult["getUsers"]["data"];
    }>;
    meta_data?: {
      total_rows?: number | null;
      filtered_rows?: number | null;
    } | null;
  };
};
