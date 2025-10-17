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

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      first_name
      last_name
      status
      created_at
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
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
`;

export const SET_USER_PASSWORD_MUTATION = gql`
  mutation SetUserPassword($user_id: ID!, $password: String!) {
    setUserPasswordByAdmin(user_id: $user_id, password: $password) {
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
  updateUser: UsersQueryResult["getUsers"]["data"][number] | null;
};

export type CreateUserResult = {
  createUser: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    status?: string | null;
    created_at?: string | null;
  } | null;
};

export type SetUserPasswordResult = {
  setUserPasswordByAdmin: {
    success: boolean;
    message?: string | null;
  } | null;
};
