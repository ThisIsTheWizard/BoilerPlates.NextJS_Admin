# BoilerPlates.NextJS_Admin

![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)
![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)
![GraphQL](https://img.shields.io/badge/GraphQL-16-e10098?logo=graphql)
![Prisma](https://img.shields.io/badge/Prisma-5-blue?logo=prisma)
![Postgres](https://img.shields.io/badge/Postgres-17-blue?logo=postgresql)
![Apollo](https://img.shields.io/badge/Apollo-3-311c87?logo=apollo-graphql)
![License](https://img.shields.io/badge/License-MIT-yellow)

A boilerplate setup for running a **NestJS** backend with **GraphQL**, **PostgreSQL** and **Prisma ORM** using Docker Compose.
This repository provides a ready-to-use **NestJS + GraphQL API** connected to PostgreSQL for rapid backend development.

---

## 🚀 Features

- **Pure GraphQL API** with Apollo Server (no REST endpoints)
- PostgreSQL database running in Docker
- Prisma ORM for type-safe database access
- GraphQL Playground for API exploration
- Complete authentication & authorization system
- Role-based access control with GraphQL guards
- Permission-based access control
- JWT token management with refresh tokens
- pgAdmin 4 for database management
- Environment-based configuration
- Fully Dockerized for easy setup and deployment
- Comprehensive test suite

---

## 📂 Project Structure

```
BoilerPlates.Nest_GraphQL/
├───prisma/
│   ├── schema.prisma        # Database schema with models
│   └── seed.ts              # Database seeding script
└───src/
   ├───main.ts               # NestJS entry point
   ├───app/                  # Application core
   │   ├── app.module.ts     # Root module with GraphQL setup
   │   ├── app.controller.ts # Basic health check endpoint
   │   └── app.service.ts    # Root service
   ├───auth/                 # Authentication module
   │   ├── auth.resolver.ts  # GraphQL resolver for auth
   │   ├── auth.service.ts   # Authentication business logic
   │   ├── auth.module.ts    # Auth module configuration
   │   └── auth.inputs.ts    # GraphQL input types
   ├───user/                 # User management
   │   ├── user.resolver.ts  # GraphQL resolver for users
   │   ├── user.service.ts   # User business logic
   │   ├── user.module.ts    # User module configuration
   │   ├── user.types.ts     # GraphQL object types
   │   └── user.inputs.ts    # GraphQL input types
   ├───role/                 # Role management
   │   ├── role.resolver.ts  # GraphQL resolver for roles
   │   ├── role.service.ts   # Role business logic
   │   ├── role.module.ts    # Role module configuration
   │   ├── role.types.ts     # GraphQL object types
   │   └── role.inputs.ts    # GraphQL input types
   ├───permission/           # Permission management
   │   ├── permission.resolver.ts # GraphQL resolver for permissions
   │   ├── permission.service.ts  # Permission business logic
   │   ├── permission.module.ts   # Permission module configuration
   │   ├── permission.types.ts    # GraphQL object types
   │   └── permission.inputs.ts   # GraphQL input types
   ├───guards/               # GraphQL-specific guards
   │   ├── graphql-auth.guard.ts       # Authentication guard
   │   ├── graphql-roles.guard.ts      # Role-based access guard
   │   └── graphql-permissions.guard.ts # Permission-based access guard
   ├───decorators/           # Custom decorators
   │   ├── graphql-user.decorator.ts   # Extract user from GraphQL context
   │   ├── roles.decorator.ts          # Role metadata decorator
   │   └── permissions.decorator.ts    # Permission metadata decorator
   └───prisma/
       └── prisma.service.ts # Prisma database service
```

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/ThisIsTheWizard/BoilerPlates.Nest_GraphQL.git
cd BoilerPlates.Nest_GraphQL
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.sample` to `.env` and update your configuration:

```bash
cp .env.sample .env
```

Example `.env` entries:

```
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
PORT=8000
```

### 4. Start services with Docker

```bash
docker-compose up -d --build
```

---

## 🌐 Access

- **GraphQL Playground** → [http://localhost:8000/graphql](http://localhost:8000/graphql)
- **Health Check** → [http://localhost:8000](http://localhost:8000)
- **PostgreSQL** → [http://localhost:5432](http://localhost:5432)
- **pgAdmin** → [http://localhost:4000](http://localhost:4000)
  Use credentials from `.env`

## 📋 Available GraphQL Operations

### Authentication

- `register` - Register a new user
- `verifyUserEmail` - Verify user email with token
- `resendVerificationEmail` - Resend email verification
- `login` - Login with email/password
- `refreshToken` - Refresh JWT token
- `logout` - Logout user
- `changeEmail` - Change user email
- `cancelChangeEmail` - Cancel email change request
- `verifyChangeEmail` - Verify email change with token
- `setUserEmail` - Set user email (admin only)
- `changePassword` - Change user password
- `setUserPassword` - Set user password (admin only)
- `forgotPassword` - Request password reset
- `retryForgotPassword` - Retry password reset request
- `verifyForgotPassword` - Verify and reset password
- `verifyForgotPasswordCode` - Verify password reset code
- `verifyUserPassword` - Verify user password
- `me` - Get current user info
- `assignRole` - Assign role to user (admin only)
- `revokeRole` - Revoke role from user (admin only)

### User Management

- `users` - Get all users (admin/developer only)
- `user(id)` - Get user by ID (admin/developer only)
- `createUser` - Create new user (admin/developer only)
- `updateUser` - Update user (admin/developer only)
- `deleteUser` - Delete user (admin/developer only)

### Role Management

- `roles` - Get all roles (admin/developer only)
- `role(id)` - Get role by ID (admin/developer only)
- `createRole` - Create new role (admin/developer only)
- `updateRole` - Update role (admin/developer only)
- `deleteRole` - Delete role (admin/developer only)
- `assignPermission` - Assign permission to role (admin/developer only)
- `revokePermission` - Revoke permission from role (admin/developer only)
- `seedRoles` - Seed system roles (admin/developer only)

### Permission Management

- `permissions` - Get all permissions (admin/developer only)
- `permission(id)` - Get permission by ID (admin/developer only)
- `createPermission` - Create new permission (admin/developer only)
- `updatePermission` - Update permission (admin/developer only)
- `deletePermission` - Delete permission (admin/developer only)
- `seedPermissions` - Seed system permissions (admin/developer only)

---

## 🛠️ Commands

- Start containers:

```bash
docker-compose up -d --build
```

- Stop containers:

```bash
docker-compose down
```

- View logs:

```bash
docker-compose logs -f
```

- Run NestJS server locally (without Docker):

```bash
npm run nest:dev
```

- Run Prisma migrations:

```bash
npx prisma migrate dev
```

- Generate Prisma client:

```bash
npx prisma generate
```

- Seed the database:

```bash
ts-node prisma/seed.ts
```

---

## 📦 Volumes

Data is persisted via Docker volumes:

- `node_server_data` → Stores Node server files for hot reload in dev mode
- `postgres_admin_data` → Stores pgAdmin configuration
- `postgres_data` → Stores PostgreSQL database files

---

## 📝 License

This boilerplate is provided under the MIT License.
Feel free to use and modify it for your projects.

---

👋 Created by [Elias Shekh](https://sheikhthewizard.world)
If you find this useful, ⭐ the repo or reach out!
