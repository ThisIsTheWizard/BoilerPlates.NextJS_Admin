# Next.js Admin Dashboard: Project Architecture

**Document Version**: 1.0
**Date**: October 12, 2025

## 1. Overview

This document outlines the architecture for a modern, scalable, and secure frontend application for an admin dashboard. The chosen stack prioritizes developer experience, performance, and security.

### **Core Technologies**

- **Framework**: Next.js 15+ (with App Router)
- **Language**: TypeScript
- **UI**: React 19+
- **Styling**: Tailwind CSS
- **API Communication**: Apollo Client
- **State Management**: Zustand
- **Icons**: Lucide React

---

## 2. Directory Structure

A logical directory structure is essential for maintainability and scalability. The project will use the `src/` directory for all application code.

```plaintext
BoilerPlates.NextJS_Admin/
├── public/                     # Static assets (images, fonts)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Route group for auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx      # Layout for login, register pages
│   │   │
│   │   ├── (dashboard)/        # Route group for protected pages
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx      # Main layout with sidebar/header
│   │   │
│   │   ├── api/                # Next.js API Routes (Backend for Frontend)
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       │   └── route.ts
│   │   │       ├── refresh/
│   │   │       │   └── route.ts
│   │   │       └── logout/
│   │   │           └── route.ts
│   │   │
│   │   ├── globals.css         # Global styles (Tailwind base)
│   │   ├── layout.tsx          # Root layout of the entire app
│   │   └── page.tsx            # Landing page (optional)
│   │
│   ├── components/             # Reusable React components
│   │   ├── layout/             # Layout components (Sidebar, Header)
│   │   ├── ui/                 # Generic components (Button, Input, Card)
│   │   └── shared/             # Complex components (DataTable, Charts)
│   │
│   ├── hooks/                  # Custom React hooks (e.g., useAuth)
│   │
│   ├── lib/                    # Utility functions and libraries
│   │   ├── apollo-client.ts    # Apollo Client (links + cache)
│   │   └── utils.ts            # Helper functions
│   │
│   ├── services/               # GraphQL documents + typed helpers
│   │   ├── auth.ts
│   │   └── users.ts
│   │
│   ├── store/                  # Zustand state management stores
│   │   └── auth.store.ts
│   │
│   └── types/                  # TypeScript type definitions
│       └── index.ts
│
├── .env.local                  # Environment variables
├── middleware.ts               # Next.js middleware for route protection
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3\. Authentication Flow (Cookie-Based)

A secure, **HttpOnly cookie** strategy is employed to handle authentication. This prevents client-side JavaScript from accessing tokens, mitigating XSS attack vectors.

### **Token Strategy**

- **`access_token`**: A short-lived token (e.g., 15 minutes) sent with every API request to authorize the user.
- **`refresh_token`**: A long-lived token (e.g., 7 days) used only to obtain a new `access_token` upon its expiration.

### **Login Process**

1.  **User Submission**: The user submits credentials via the `/login` page.
2.  **Client to BFF**: The client sends credentials to a Next.js API route (`/api/auth/login`). This acts as a "Backend for Frontend" (BFF).
3.  **BFF to Backend**: The Next.js route securely forwards the credentials to the main backend API.
4.  **Token Issuance**: The backend validates the user and returns `access_token` and `refresh_token` to the Next.js BFF.
5.  **Set Secure Cookies**: The Next.js BFF sets the tokens as **`HttpOnly`**, **`Secure`**, and **`SameSite=Strict`** cookies in the browser's response.
6.  **Redirection**: The user is redirected to the protected `/dashboard`.

### **Automatic Token Refresh**

1.  **`401` Error**: An API call fails with a `401 Unauthorized` error because the `access_token` is expired.
2.  **Apollo Link**: The error link spots authentication failures and can request a refresh token.
3.  **Refresh Call**: The link invokes the Next.js refresh route (`/api/auth/refresh`) or a dedicated GraphQL mutation.
4.  **New Token**: The backend issues fresh credentials.
5.  **Update Cookie**: The frontend updates the persisted token (local storage + cookie shim).
6.  **Retry Request**: The original operation replays with the updated headers.

### **Route Protection**

- The `middleware.ts` file acts as a gatekeeper for protected routes.
- It intercepts requests to `(dashboard)/*` paths.
- If the `access_token` cookie is missing, the user is redirected to `/login`.
- Otherwise, access is granted.

---

## 4\. Page Layout Strategy

Next.js Route Groups are used to apply distinct layouts to different application sections without altering the URL structure.

- **Root Layout (`src/app/layout.tsx`)**: The top-level layout containing `<html>` and `<body>` tags. It wraps the entire application and is used for global context providers (state management, UI themes, etc.).

- **Dashboard Layout (`src/app/(dashboard)/layout.tsx`)**: The main application shell for all protected pages. It renders shared UI elements like the main sidebar and header. Page-specific content is rendered as `{children}`.

- **Auth Layout (`src/app/(auth)/layout.tsx`)**: A minimalist layout for pages like login and registration. It typically features a centered container without the main sidebar or header.

---

## 5\. Implementation Steps

1.  **Initialize Project**: Use `npx create-next-app@latest` with TypeScript and Tailwind CSS options.
2.  **Install Dependencies**: `npm install @apollo/client graphql zustand lucide-react`
3.  **Environment Setup**: Create a `.env.local` file for environment variables like the API base URL.
4.  **Scaffold Directories**: Create the folders as outlined in the structure diagram.
5.  **Configure Apollo Client**: Implement `src/lib/apollo-client.ts` with auth/error links and cache policies.
6.  **Implement Middleware**: Create `middleware.ts` in the project root to handle route protection.
7.  **Build Core UI**: Develop the reusable UI components (`Button`, `Input`) and layout components (`Sidebar`, `Header`).
8.  **Implement Layouts**: Create the `layout.tsx` files for the root, `(dashboard)`, and `(auth)` route groups.
9.  **Develop Auth Logic**:
    - Create the Zustand store (`src/store/auth.store.ts`) for user state.
    - Build the Next.js API routes (`/api/auth/*`) to manage secure cookies.
    - Connect the login page UI to the authentication service.
