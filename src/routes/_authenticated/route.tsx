import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { SESSION_STORAGE_KEY } from "@/lib/mock-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: () => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null;
    if (!token) throw redirect({ to: "/auth" });
    return { token };
  },
  component: () => <Outlet />,
});
