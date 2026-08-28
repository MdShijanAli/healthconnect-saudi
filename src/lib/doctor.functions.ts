import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  appointmentIdSchema,
  availabilitySchema,
  consultationSchema,
  doctorProfileSchema,
  idSchema,
  medicineSchema,
  patientIdSchema,
  rescheduleAppointmentSchema,
  timeOffSchema,
  updateAppointmentSchema,
} from "@/lib/doctor-schemas";

export const getDoctorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.fetchDoctorDashboard(context.supabase, context.userId);
  });

export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.fetchDoctorAppointments(context.supabase, context.userId);
  });

export const setAppointmentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.updateAppointment(context.supabase, context.userId, data);
  });

export const rescheduleAppointmentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => rescheduleAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.rescheduleAppointment(context.supabase, context.userId, data);
  });

export const getAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.fetchAvailability(context.supabase, context.userId);
  });

export const saveAvailabilityFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => availabilitySchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.saveAvailability(context.supabase, context.userId, data);
  });

export const addTimeOffFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => timeOffSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.addTimeOff(context.supabase, context.userId, data);
  });

export const removeTimeOffFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.removeTimeOff(context.supabase, context.userId, data.id);
  });

export const listMedicines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.fetchMedicines(context.supabase, context.userId);
  });

export const saveMedicineFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => medicineSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.saveMedicine(context.supabase, context.userId, data);
  });

export const deleteMedicineFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => idSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.deleteMedicine(context.supabase, context.userId, data.id);
  });

export const getPatientOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => patientIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.fetchPatientOverview(context.supabase, context.userId, data.patientId);
  });

export const getConsultation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => appointmentIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.fetchConsultation(context.supabase, context.userId, data.appointmentId);
  });

export const saveConsultationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => consultationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.saveConsultation(context.supabase, context.userId, data);
  });

export const getDoctorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.fetchDoctorProfile(context.supabase, context.userId);
  });

export const updateDoctorProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => doctorProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const m = await import("@/lib/doctor.server");
    await m.assertDoctor(context.supabase, context.userId);
    return m.updateDoctorProfile(context.supabase, context.userId, data);
  });
