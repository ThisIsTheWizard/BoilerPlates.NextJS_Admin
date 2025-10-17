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
  mutation AssignPermission($input: RolePermissionInput!) {
    assignPermission(input: $input) {
      id
    }
  }
`;

export const REVOKE_PERMISSION_MUTATION = gql`
  mutation RevokePermission($input: RolePermissionInput!) {
    revokePermission(input: $input) {
      id
    }
  }
`;

export type PermissionsQueryResult = {
  getPermissions: {
    data: Array<{
      id: string;
      action: string;
      created_at: string;
      module: string;
      updated_at: string;
    }>;
    meta_data?: {
      filtered_rows?: number | null;
      total_rows?: number | null;
    } | null;
  };
};
