import { z } from "zod";

const phonePattern = /^\+?[0-9\s()-]{8,20}$/;

export const doctorRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(phonePattern).max(20),
  specialty: z.string().trim().min(2).max(100),
  licenseNumber: z.string().trim().min(3).max(50),
  yearsExperience: z.coerce.number().int().min(0).max(70),
  clinicName: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2).max(80),
  consultationType: z.enum(["in_person", "video", "both"]),
});

export const patientBookingSchema = z.object({
  patientName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(phonePattern).max(20),
  specialty: z.string().trim().min(2).max(100),
  doctorPreference: z.string().trim().max(100).optional(),
  appointmentDate: z.string().date().refine((value) => value >= new Date().toISOString().slice(0, 10)),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  visitType: z.enum(["in_person", "video"]),
  reason: z.string().trim().min(5).max(1000),
});

export type DoctorRegistrationInput = z.infer<typeof doctorRegistrationSchema>;
export type PatientBookingInput = z.infer<typeof patientBookingSchema>;