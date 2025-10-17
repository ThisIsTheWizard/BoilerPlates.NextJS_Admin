import { gql } from "@apollo/client";

export const GET_USERS_QUERY = gql`
  query GetUsers($options: Options) {
    getUsers(options: $options) {
      data {
        id
        email
        first_name
        last_name
        status
        roles {
          id
          name
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

export const USERS_DEFAULT_OPTIONS = {
  limit: 10,
  offset: 0,
};

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      success
      message
      user {
        id
        email
        first_name
        last_name
        status
        roles {
          id
          name
        }
        created_at
      }
    }
  }
`;

export const DEACTIVATE_USER_MUTATION = gql`
  mutation DeactivateUser($id: ID!) {
    deactivateUser(id: $id) {
      success
      message
    }
  }
`;

export type UsersQueryResult = {
  getUsers: {
    data: Array<{
      id: string;
      email: string;
      first_name?: string | null;
      last_name?: string | null;
      status: string;
      roles: Array<{
        id: string;
        name: string;
      }>;
      created_at?: string | null;
    }>;
    meta_data?: {
      total_rows?: number | null;
      filtered_rows?: number | null;
    } | null;
  };
};

export type UpdateUserResult = {
  updateUser: {
    success: boolean;
    message?: string | null;
    user?: UsersQueryResult["getUsers"]["data"][number] | null;
  } | null;
};

export type DeactivateUserResult = {
  deactivateUser: {
    success: boolean;
    message?: string | null;
  } | null;
};
