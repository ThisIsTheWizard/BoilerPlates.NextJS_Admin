# Entities Reference

This document lists all Sequelize entities in the project with their fields, indexes, and associations. File paths reference where each entity is defined.

---

## User
- File: `src/modules/user/user.entity.js`
- Table: `user`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `email` STRING (required, unique)
  - `first_name` STRING (nullable)
  - `last_name` STRING (nullable)
  - `new_email` STRING (nullable)
  - `phone_number` STRING (nullable)
  - `old_passwords` ARRAY<STRING> (required, default `[]`)
  - `password` STRING (nullable)
  - `status` ENUM [`active`, `inactive`, `invited`, `unverified`] (required, default `unverified`)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - `email` (unique)
  - `first_name, last_name`
  - `status`
  - `created_at`, `updated_at`
- Associations (see `src/modules/entities.js`):
  - hasMany `AuthToken` (`user_id`)
  - hasMany `Permission` (as author via `created_by`)
  - hasMany `Role` (as `owned_roles` via `created_by`)
  - belongsToMany `Role` as `roles` through `role_users` (`user_id` ↔ `role_id`)
  - hasMany `RolePermission` (as author via `created_by`)
  - hasMany `RoleUser` (`user_id`)
  - hasMany `VerificationToken` (`user_id`)

---

## Role
- File: `src/modules/role/role.entity.js`
- Table: `role`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `name` ENUM [`admin`, `developer`, `moderator`, `user`] (required, unique)
  - `created_by` UUID (nullable)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - `name` (unique)
  - `created_by`
  - `created_at`, `updated_at`
- Associations:
  - belongsToMany `Permission` as `permissions` through `role_permissions` (`role_id` ↔ `permission_id`)
  - belongsToMany `User` as `users` through `role_users`
  - hasMany `RoleUser` (`role_id`)
  - belongsTo `User` as `author` (`created_by`)

---

## Permission
- File: `src/modules/permission/permission.entity.js`
- Table: `permission`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `action` ENUM [`create`, `read`, `update`, `delete`] (required)
  - `module` ENUM [`permission`, `role`, `role_permission`, `role_user`, `user`] (required)
  - `created_by` UUID (nullable)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - `action`
  - `module`
  - (`action`, `module`) (unique)
  - `created_by`
  - `created_at`, `updated_at`
- Associations:
  - belongsToMany `Role` as `roles` through `role_permissions`
  - belongsTo `User` as `author` (`created_by`)

---

## RolePermission
- File: `src/modules/role-permission/role-permission.entity.js`
- Table: `role_permission`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `role_id` UUID (required, onDelete `CASCADE`)
  - `permission_id` UUID (required, onDelete `CASCADE`)
  - `can_do_the_action` BOOLEAN (required, default `false`)
  - `created_by` UUID (nullable)
  - `updated_by` UUID (nullable)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - (`permission_id`, `role_id`) (unique)
  - `created_by`, `updated_by`
  - `created_at`, `updated_at`
- Associations:
  - belongsTo `Permission` (`permission_id`)
  - belongsTo `Role` (`role_id`)
  - belongsTo `User` as `author` (`created_by`)

---

## RoleUser
- File: `src/modules/role-user/role-user.entity.js`
- Table: `role_user`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `role_id` UUID (required)
  - `user_id` UUID (required)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - (`role_id`, `user_id`) (unique)
  - `created_at`, `updated_at`
- Associations:
  - belongsTo `User` (`user_id`)
  - belongsTo `Role` (`role_id`)

---

## AuthToken
- File: `src/modules/auth-token/auth-token.entity.js`
- Table: `auth_token`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `access_token` TEXT (required, unique with `user_id`)
  - `expires_at` DATE (nullable)
  - `refresh_token` TEXT (nullable)
  - `user_id` UUID (required)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - (`access_token`, `user_id`) (unique)
  - `refresh_token`
  - `created_at`, `updated_at`
- Associations:
  - belongsTo `User` (`user_id`)

---

## VerificationToken
- File: `src/modules/verification-token/verification-token.entity.js`
- Table: `verification_token`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `email` TEXT (required)
  - `expired_at` DATE (required, default `now + 5 minutes`)
  - `status` ENUM [`cancelled`, `verified`, `unverified`] (required, default `unverified`)
  - `token` STRING (required)
  - `type` ENUM [`forgot_password`, `user_verification`] (required, default `user_verification`)
  - `user_id` UUID (required)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - `email, token, user_id`
  - `created_at`, `updated_at`
- Associations:
  - belongsTo `User` (`user_id`)

---

## AuthTemplate
- File: `src/modules/auth-template/auth-template.entity.js`
- Table: `auth_template`
- Fields:
  - `id` UUID (PK, default `UUIDV4`)
  - `body` TEXT (required)
  - `created_by` UUID (nullable)
  - `event` TEXT (required, unique)
  - `subject` TEXT (required)
  - `created_at` TIMESTAMP (managed)
  - `updated_at` TIMESTAMP (managed)
- Indexes:
  - `id` (unique)
  - `event` (unique)
  - `subject`
  - `created_by`
  - `created_at`, `updated_at`
- Associations:
  - —

---

## Sync Order and Utility
- File: `src/modules/entities.js`
- Function: `syncEntitiesIntoDatabase(force = false)`
  - Syncs entities in dependency-safe order:
    1. `AuthTemplate`
    2. `User`
    3. `AuthToken`
    4. `VerificationToken`
    5. `Role`
    6. `RoleUser`
    7. `Permission`
    8. `RolePermission`
  - Uses `force` for destructive sync or `alter` for non-destructive migrations.

---

## Notes
- All entities use snake_case timestamps: `created_at`, `updated_at`.
- Foreign keys are UUIDs; many relations include `onDelete: 'CASCADE'` at the association level.
- GraphQL types for these entities live under `src/graphql/typeDefs/*.graphql` and resolvers under `src/graphql/resolvers/**`.

