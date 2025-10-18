# BoilerPlates.NextJS_Admin

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![GraphQL](https://img.shields.io/badge/GraphQL-Apollo_Client_3-e10098?logo=graphql)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Zustand](https://img.shields.io/badge/State_Zustand-4-1f2937)
![License](https://img.shields.io/badge/License-MIT-yellow)

Modern admin dashboard boilerplate built with **Next.js 15 (App Router)**, **Apollo Client**, and **Tailwind CSS**. It consumes the GraphQL API exposed by the companion [BoilerPlates.Express_GraphQL](../BoilerPlates.Express_GraphQL) backend and ships with ready-to-use pages for users, roles, and permissions management.

- **Live URL**: [https://next.sheikhthewizard.world](https://next.sheikhthewizard.world)

---

## 🚀 Features

- **App Router + Turbopack** development experience with fast refresh
- **Apollo Client 3** GraphQL integration with typed services and reusable hooks
- **Authentication-aware layout guards** and blocking loaders to prevent flash of unauthenticated UI
- **Role & permission dashboards** with modals for inline assignment/revocation
- **Responsive UI** powered by Tailwind CSS, Radix-inspired components, and lucide-react icons
- **Zustand store** for lightweight auth/session state management
- **Shared UI utilities** (blocking loader, charts, cards) ready to extend for custom modules
- **Production-ready build** (`pnpm exec next build`) without external font downloads

---

## 📂 Project Structure

```
BoilerPlates.NextJS_Admin/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/             # Auth pages (login, register, forgot password)
│   │   ├── (dashboard)/        # Protected dashboard routes (users, roles, permissions)
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── globals.css         # Tailwind + theme tokens
│   ├── components/
│   │   ├── dashboard/          # Charts & dashboard widgets
│   │   ├── shared/             # Sidebar navigation and shared atoms
│   │   └── ui/                 # Button, card, blocking loader, etc.
│   ├── hooks/                  # Custom React hooks (e.g. pagination helpers)
│   ├── lib/                    # Utilities (formatting, navigation helpers)
│   ├── services/               # Apollo queries/mutations for users, roles, permissions
│   ├── store/                  # Zustand auth session store
│   └── types/                  # Shared TypeScript types
├── public/                     # Static assets
├── .env.example                # Environment variable template
└── package.json
```

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/ThisIsTheWizard/BoilerPlates.NextJS_Admin.git
cd BoilerPlates.NextJS_Admin
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and adjust the values to point at your running backend (defaults to `http://localhost:8000`).

```bash
cp .env.example .env
```

Example:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXTAUTH_SECRET=replace-with-a-32-char-random-value
```

### 4. Run the development server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the dashboard UI. Make sure the Express GraphQL backend is running so data can be fetched successfully.

---

## 🌐 Available Pages

| Route                                     | Description                                                       |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `/login`, `/register`, `/forgot-password` | Public auth flows that interact with the GraphQL backend          |
| `/dashboard`                              | Overview metrics (user counts, signup trend, status distribution) |
| `/users`                                  | User directory with role assignment and status management modals  |
| `/roles`                                  | Role overview with permission assignment modals                   |
| `/permissions`                            | Permission inventory with role assignment management              |

All dashboard routes are gated by the auth layout. If session tokens are missing or invalid, the UI shows a blocking loader while redirecting to `/login`.

---

## 🔌 GraphQL Integration

The admin UI communicates with the Express GraphQL server through service modules in `src/services/`. Key operations:

- `GET_USERS_QUERY`, `GET_ROLES_QUERY`, `GET_PERMISSIONS_QUERY`
- `ASSIGN_PERMISSION_MUTATION` / `REVOKE_PERMISSION_MUTATION`
- `ASSIGN_ROLE_MUTATION` / `REVOKE_ROLE_MUTATION`
- `LOGIN_MUTATION`, `REGISTER_MUTATION`, `REQUEST_PASSWORD_RESET_MUTATION`

Each page composes these operations with Apollo hooks while keeping UI feedback (spinners, optimistic updates, toasts) encapsulated within modals and components.

---

## 📦 Scripts

| Command                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `pnpm dev`             | Start the development server with React fast refresh |
| `pnpm lint`            | Run ESLint across the project                        |
| `pnpm exec next build` | Generate a production build (network-free fonts)     |
| `pnpm start`           | Launch the compiled app in production mode           |

---

## 🤝 Working with the Backend

This frontend pairs with **BoilerPlates.Express_GraphQL**. Ensure that project is running (Docker or local) so GraphQL queries hit a live endpoint. Adjust `NEXT_PUBLIC_API_BASE_URL` if the backend runs on a different host/port.

---

## 📝 License

MIT © [The Wizard](https://github.com/ThisIsTheWizard)

Feel free to fork, adapt, and extend the dashboard for your own role/permission management workflows.

---

👋 Created by [Elias Shekh](https://sheikhthewizard.world)
If you find this useful, ⭐ the repo or reach out!
