import type { DoctorRegistrationInput, PatientBookingInput } from "./healthcare-flow-schemas";
import { genId, isoNow, mockDb } from "@/lib/mock-db";

export async function saveDoctorRegistration(input: DoctorRegistrationInput) {
  const id = genId();
  mockDb.doctorRegistrationLeads.push({
    id,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    specialty: input.specialty,
    licenseNumber: input.licenseNumber,
    yearsExperience: input.yearsExperience,
    clinicName: input.clinicName || null,
    city: input.city,
    consultationType: input.consultationType,
    status: "pending",
    createdAt: isoNow(),
  });
  return { reference: id.slice(0, 8).toUpperCase() };
}

export async function savePatientBooking(input: PatientBookingInput) {
  const id = genId();
  mockDb.patientBookingLeads.push({
    id,
    patientName: input.patientName,
    email: input.email,
    phone: input.phone,
    specialty: input.specialty,
    doctorPreference: input.doctorPreference || null,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    visitType: input.visitType,
    reason: input.reason,
    status: "requested",
    createdAt: isoNow(),
  });
  return { reference: id.slice(0, 8).toUpperCase() };
}
