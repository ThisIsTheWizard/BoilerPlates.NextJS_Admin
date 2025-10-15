import { gql } from "@apollo/client";
import { PermissionsQueryResult } from "./permissions";

export const GET_ROLES_QUERY = gql`
  query GetRoles($options: Options) {
    getRoles(options: $options) {
      data {
        id
        name
        permissions {
          id
          action
          module
          role_permissions {
            id
            can_do_the_action
          }
        }
        created_at
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
      role_id
      user_id
    }
  }
`;

export const REMOVE_ROLE_MUTATION = gql`
  mutation RemoveRole($input: RemoveRoleInput!) {
    removeRole(input: $input) {
      success
      message
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
    }>;
    meta_data?: {
      total_rows?: number | null;
      filtered_rows?: number | null;
    } | null;
  };
};
