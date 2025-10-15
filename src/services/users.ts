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
