import { mockDb } from "@/lib/mock-db";

export function isSuperAdmin(userId: string): boolean {
  return mockDb.userRoles.some((r) => r.userId === userId && r.role === "super_admin");
}

export function requireSuperAdmin(userId: string): void {
  if (!isSuperAdmin(userId)) throw new Error("Forbidden");
}
