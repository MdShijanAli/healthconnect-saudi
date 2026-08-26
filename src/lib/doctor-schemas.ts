import { z } from "zod";

const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use 24-hour HH:MM format");

export const availabilityDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isEnabled: z.boolean(),
  startTime: timeString,
  endTime: timeString,
});

export const saveAvailabilitySchema = z.object({
  days: z.array(availabilityDaySchema).length(7),
});

export const addUnavailableDateSchema = z.object({
  date: z.string().date(),
  reason: z.string().trim().max(200).optional(),
});

export const removeUnavailableDateSchema = z.object({ id: z.string().uuid() });

export const acceptAppointmentSchema = z.object({ appointmentId: z.string().uuid() });

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  date: z.string().date(),
  time: timeString,
});

export const markAppointmentCompleteSchema = z.object({ appointmentId: z.string().uuid() });

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500),
});

export const getPatientProfileSchema = z.object({ patientId: z.string().uuid() });

export const getConsultationContextSchema = z.object({ appointmentId: z.string().uuid() });

const prescriptionItemSchema = z.object({
  medicineId: z.string().uuid().nullable(),
  medicineName: z.string().trim().min(2).max(150),
  dosage: z.string().trim().max(100).optional(),
  frequency: z.string().trim().max(50).optional(),
  duration: z.string().trim().max(50).optional(),
  instructions: z.string().trim().max(500).optional(),
});

export const completeConsultationSchema = z.object({
  appointmentId: z.string().uuid(),
  diagnosisNotes: z.string().trim().max(2000).optional(),
  adviceNotes: z.string().trim().max(2000).optional(),
  items: z.array(prescriptionItemSchema).min(1),
});

const medicineFields = {
  name: z.string().trim().min(2).max(150),
  commonDosage: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
};

export const createMedicineSchema = z.object(medicineFields);
export const updateMedicineSchema = z.object({ id: z.string().uuid(), ...medicineFields });
export const deleteMedicineSchema = z.object({ id: z.string().uuid() });

export const updateDoctorProfileSchema = z.object({
  specialization: z.string().trim().min(2).max(100),
  bio: z.string().trim().min(20).max(1000),
  consultationFee: z.coerce.number().min(0).max(100000),
  profilePhotoPath: z.string().trim().max(500).nullable().optional(),
});
