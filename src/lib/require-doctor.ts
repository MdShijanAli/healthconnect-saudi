import { mockDb } from "@/lib/mock-db";

export function requireApprovedDoctor(userId: string): void {
  const doctor = mockDb.doctorProfiles.find((d) => d.userId === userId);
  if (!doctor || doctor.approvalStatus !== "approved" || !doctor.isActive) {
    throw new Error("Forbidden");
  }
}
