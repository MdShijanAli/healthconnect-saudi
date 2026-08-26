import type { PortalContext, PortalRole } from "@/lib/auth-schemas";

export function dashboardForRole(role: PortalRole): "/admin/dashboard" | "/doctor/dashboard" | "/patient/dashboard" {
  if (role === "super_admin") return "/admin/dashboard";
  if (role === "doctor") return "/doctor/dashboard";
  return "/patient/dashboard";
}

export function normalizePortalContext(value: unknown): PortalContext | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<PortalContext>;
  if (!candidate.userId || !candidate.fullName || !candidate.phone || !candidate.role) return null;
  return candidate as PortalContext;
}