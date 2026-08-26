import { z } from "zod";

const baseRegistrationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(20),
});

export const patientRegistrationSchema = baseRegistrationSchema.extend({
  role: z.literal("patient"),
  dateOfBirth: z.string().date(),
  gender: z.enum(["male", "female"]),
});

export const doctorRegistrationSchema = baseRegistrationSchema.extend({
  role: z.literal("doctor"),
  specialization: z.string().trim().min(2).max(100),
  medicalLicenseNumber: z.string().trim().min(3).max(50),
  yearsExperience: z.coerce.number().int().min(0).max(70),
  consultationFee: z.coerce.number().min(0).max(100000),
  bio: z.string().trim().min(20).max(1000),
  profilePhotoPath: z.string().trim().max(500).nullable(),
});

export const completeRegistrationSchema = z.discriminatedUnion("role", [
  patientRegistrationSchema,
  doctorRegistrationSchema,
]);

export const reviewDoctorSchema = z
  .object({
    doctorId: z.string().uuid(),
    status: z.enum(["approved", "rejected"]),
    reason: z.string().trim().min(5).max(500).optional(),
  })
  .refine((value) => value.status !== "rejected" || !!value.reason, {
    message: "A reason is required when rejecting an application.",
    path: ["reason"],
  });

export type PortalRole = "super_admin" | "doctor" | "patient";
export type DoctorStatus = "pending_approval" | "approved" | "rejected" | null;

export type PortalContext = {
  userId: string;
  fullName: string;
  phone: string;
  role: PortalRole;
  doctorStatus: DoctorStatus;
};
