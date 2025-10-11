# NextJS Admin — Express GraphQL API Docs

This README documents how the NextJS Admin app integrates with the Express GraphQL backend, along with practical examples you can use directly against the GraphQL server.

## Base URL

- API base URL: `${API_BASE_URL}` (defaults to `http://localhost:8000` if not set)
- GraphQL endpoint: `${API_BASE_URL}/graphql`

See `.env.example` for environment variables.

## Authentication

- Send the access token in the `Authorization` header as the raw token value (no Bearer prefix).
  - Example: `Authorization: <access_token>`
- Public operations allow `roles: ["public"]`. Protected operations require user roles (e.g., `admin`, `developer`, `moderator`, `user`).

### How Admin obtains the token

The admin app uses NextAuth with a credentials provider to call the backend login and save tokens in the session.

Relevant files:
- `BoilerPlates.NextJS_Admin/lib/auth.ts:1` — Logs in via REST `POST /users/login` to obtain `access_token` and enriches session with user profile via `GET /users/me`.
- `BoilerPlates.NextJS_Admin/lib/api.ts:1` — Helper that attaches `Authorization: <token>` when calling the backend.

If you call GraphQL directly (outside the admin app), follow the examples below.

## Request Shape

POST a JSON body with `query` and optional `variables` to `/graphql`:

```
POST /graphql
Content-Type: application/json
Accept: application/json
Authorization: <access_token>

{
  "query": "query Example($id: ID!) { getAUser(entity_id: $id) { id email } }",
  "variables": { "id": "123" }
}
```

## Schema Overview

- Directive: `@auth(permission: String, roles: [String!]!)`
- Common pagination/sorting input: `Options { limit, offset, order }`
- Entities: `User`, `Role`, `Permission`, `RoleUser`, `RolePermission`

### Auth

- `login(input: LoginInput!): AuthPayload!` (public)
- `logout: SuccessResponse!` (requires signed-in role)
- `user: User` (current user, requires signed-in role)
- Additional helpers: `refreshToken`, password and email flows

### Users

- Queries: `getAUser(entity_id: ID!): User`, `getUsers(query, options): UserQuerySchema`
- Mutations: `createUser`, `updateUser`, `deleteUser`

### Roles & Permissions

- Roles: `getARole`, `getRoles`, `createRole`, `updateRole`, `deleteRole`
- Permissions: `getAPermission`, `getPermissions`, `createPermission`, `updatePermission`, `deletePermission`
- Role-User: `getRoleUsers`, `assignRole`, `updateRoleUser`, `removeRole`
- Role-Permission: `getRolePermissions`, `assignPermission`, `updateRolePermission`, `removePermission`

## GraphQL Examples

### 1) Login

```
mutation Login($input: LoginInput!) {
  login(input: $input) {
    access_token
    refresh_token
  }
}

Variables:
{
  "input": {
    "email": "admin@example.com",
    "password": "password"
  }
}
```

### 2) Get Users (with pagination)

```
query GetUsers($options: Options) {
  getUsers(options: $options) {
    data {
      id
      email
      first_name
      last_name
      status
      created_at
    }
    meta_data {
      filtered_rows
      total_rows
    }
  }
}

Variables:
{
  "options": {
    "limit": 20,
    "offset": 0,
    "order": [["created_at", "DESC"]]
  }
}
```

### 3) Create Role

```
mutation CreateRole($input: CreateRoleInput!) {
  createRole(input: $input) {
    id
    name
    description
  }
}

Variables:
{
  "input": {
    "name": "manager",
    "description": "Manager role"
  }
}
```

### 4) Assign Permission to Role

```
mutation AssignPermission($input: CreateRolePermissionInput!) {
  assignPermission(input: $input) {
    id
    role_id
    permission_id
    can_do_the_action
  }
}

Variables:
{
  "input": {
    "role_id": "<role-id>",
    "permission_id": "<permission-id>",
    "can_do_the_action": true
  }
}
```

### 5) Assign Role to User

```
mutation AssignRole($input: CreateRoleUserInput!) {
  assignRole(input: $input) {
    id
    role_id
    user_id
  }
}

Variables:
{
  "input": {
    "role_id": "<role-id>",
    "user_id": "<user-id>"
  }
}
```

## curl Examples

Login to obtain an access token:

```
curl -X POST "$API_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation($input: LoginInput!){ login(input: $input){ access_token refresh_token } }",
    "variables": { "input": { "email": "admin@example.com", "password": "password" } }
  }'
```

Use the access token for authorized operations (note: no Bearer prefix):

```
curl -X POST "$API_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: <access_token>" \
  -d '{
    "query": "query($opts: Options){ getUsers(options: $opts){ data{ id email } } }",
    "variables": { "opts": { "limit": 10, "offset": 0 } }
  }'
```

## Error Handling

- The GraphQL server returns HTTP 200 with an `errors` array when resolver exceptions occur. Inspect the `errors` array for details.
- Authorization is enforced via the `@auth` directive; unauthorized/forbidden operations return GraphQL errors.

## Using From NextJS Admin

- This admin uses REST endpoints for auth and example pages use `lib/api.ts` to call the backend with `Authorization: <token>`.
- For GraphQL clients (Apollo, urql, etc.), attach the same header before making GraphQL requests.

