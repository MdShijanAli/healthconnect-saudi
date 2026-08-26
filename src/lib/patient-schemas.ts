import { z } from "zod";

const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24-hour HH:MM format");

export const searchDoctorsSchema = z.object({
  specialization: z.string().trim().max(100).optional(),
  availability: z.enum(["today", "this_week"]).optional(),
  query: z.string().trim().max(100).optional(),
});

export const getDoctorProfileSchema = z.object({ doctorId: z.string().uuid() });
export const getDoctorAvailabilitySchema = z.object({ doctorId: z.string().uuid() });
export const getAvailableSlotsSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().date(),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().date(),
  time: timeString,
  reason: z.string().trim().min(5).max(1000),
});

export const cancelPatientAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const reschedulePatientAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  date: z.string().date(),
  time: timeString,
});

export const markNotificationReadSchema = z.object({ id: z.string().uuid() });

export const updatePatientProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
  dateOfBirth: z.string().date(),
  gender: z.enum(["male", "female"]),
  profilePhotoPath: z.string().trim().max(500).nullable().optional(),
});
