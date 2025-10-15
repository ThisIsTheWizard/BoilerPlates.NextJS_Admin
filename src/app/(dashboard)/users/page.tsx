import type { Metadata } from "next";

import { UsersView } from "./users-view";

export const metadata: Metadata = {
  title: "Users | Next Admin",
  description: "Manage workspace users, roles, and statuses.",
};

export default function UsersPage() {
  return <UsersView />;
}
