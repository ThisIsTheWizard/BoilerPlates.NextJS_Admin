import { gql } from "@apollo/client";

export const GET_PERMISSIONS_QUERY = gql`
  query GetPermissions($options: Options) {
    getPermissions(options: $options) {
      data {
        id
        action
        created_at
        module
      }
      meta_data {
        filtered_rows
        total_rows
      }
    }
  }
`;

export const ASSIGN_PERMISSION_MUTATION = gql`
  mutation AssignPermission($input: CreateRolePermissionInput!) {
    assignPermission(input: $input) {
      id
      can_do_the_action
      permission_id
      role_id
    }
  }
`;

export const REMOVE_PERMISSION_MUTATION = gql`
  mutation RemovePermission($input: RemovePermissionInput!) {
    removePermission(input: $input) {
      message
      success
    }
  }
`;

export type PermissionsQueryResult = {
  getPermissions: {
    data: Array<{
      id: string;
      action: string;
      created_at?: string | null;
      module: string;
      role_permissions: {
        id: string;
        can_do_the_action: boolean;
      };
    }>;
    meta_data?: {
      filtered_rows?: number | null;
      total_rows?: number | null;
    } | null;
  };
};
