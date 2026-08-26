import { mockDb } from "@/lib/mock-db";

export function requireActivePatient(userId: string): void {
  const patient = mockDb.patientProfiles.find((p) => p.userId === userId);
  if (!patient || patient.isBlocked) throw new Error("Forbidden");
}
