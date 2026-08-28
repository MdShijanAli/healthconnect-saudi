import { z } from "zod";

export const appointmentStatusSchema = z.enum(["requested", "confirmed", "completed", "cancelled"]);

export const updateAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  status: appointmentStatusSchema,
  cancelReason: z.string().trim().max(500).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  appointmentDate: z.string().date(),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const availabilitySchema = z.object({
  days: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        isEnabled: z.boolean(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .max(7),
});

export const timeOffSchema = z.object({
  offDate: z.string().date(),
  note: z.string().trim().max(200).default(""),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const medicineSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  commonDosage: z.string().trim().max(120).default(""),
  category: z.string().trim().max(120).default(""),
});

export const consultationSchema = z.object({
  appointmentId: z.string().uuid(),
  diagnosis: z.string().trim().max(4000).default(""),
  advice: z.string().trim().max(4000).default(""),
  items: z
    .array(
      z.object({
        medicineName: z.string().trim().min(1).max(120),
        dosage: z.string().trim().max(120).default(""),
        frequency: z.string().trim().max(60).default(""),
        duration: z.string().trim().max(60).default(""),
        instructions: z.string().trim().max(500).default(""),
      }),
    )
    .max(30),
});

export const doctorProfileSchema = z.object({
  specialization: z.string().trim().min(2).max(100),
  bio: z.string().trim().min(20).max(1000),
  consultationFee: z.coerce.number().min(0).max(100000),
  yearsExperience: z.coerce.number().int().min(0).max(70),
  profilePhotoPath: z.string().trim().max(500).nullable().default(null),
});

export const patientIdSchema = z.object({ patientId: z.string().uuid() });
export const appointmentIdSchema = z.object({ appointmentId: z.string().uuid() });

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
