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

export async function saveDoctorRegistration(input: z.infer<typeof doctorRegistrationSchema>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("doctor_registrations")
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      specialty: input.specialty,
      license_number: input.licenseNumber,
      years_experience: input.yearsExperience,
      clinic_name: input.clinicName || null,
      city: input.city,
      consultation_type: input.consultationType,
    })
    .select("id")
    .single();

  if (error) throw new Error("Unable to save provider application");
  return { reference: data.id.slice(0, 8).toUpperCase() };
}

export async function savePatientBooking(input: z.infer<typeof patientBookingSchema>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("patient_bookings")
    .insert({
      patient_name: input.patientName,
      email: input.email,
      phone: input.phone,
      specialty: input.specialty,
      doctor_preference: input.doctorPreference || null,
      appointment_date: input.appointmentDate,
      appointment_time: input.appointmentTime,
      visit_type: input.visitType,
      reason: input.reason,
    })
    .select("id")
    .single();

  if (error) throw new Error("Unable to save appointment request");
  return { reference: data.id.slice(0, 8).toUpperCase() };
}