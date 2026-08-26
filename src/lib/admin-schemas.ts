import { z } from "zod";

export const toggleDoctorActiveSchema = z.object({
  doctorId: z.string().uuid(),
  isActive: z.boolean(),
});

export const togglePatientBlockedSchema = z.object({
  patientId: z.string().uuid(),
  isBlocked: z.boolean(),
});

const specializationFields = {
  name: z.string().trim().min(2).max(100),
  icon: z.string().trim().min(1).max(50),
  description: z.string().trim().max(500).default(""),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
};

export const createSpecializationSchema = z.object(specializationFields);
export const updateSpecializationSchema = z.object({
  id: z.string().uuid(),
  ...specializationFields,
});
export const deleteSpecializationSchema = z.object({ id: z.string().uuid() });

const subscriptionPlanFields = {
  name: z.string().trim().min(2).max(100),
  price: z.coerce.number().min(0).max(1000000),
  billingCycle: z.enum(["monthly", "yearly"]),
  features: z.array(z.string().trim().min(1).max(200)).max(20),
  isActive: z.boolean().default(true),
};

export const createSubscriptionPlanSchema = z.object(subscriptionPlanFields);
export const updateSubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  ...subscriptionPlanFields,
});
export const deleteSubscriptionPlanSchema = z.object({ id: z.string().uuid() });

export const reportsFilterSchema = z.object({
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  doctorId: z.string().uuid().optional(),
});

export const getSignedPhotoUrlSchema = z.object({
  path: z.string().trim().min(1).max(500),
});
